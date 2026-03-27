import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Proposal, ProposalStatus } from './entities/proposal.entity';
import { Vote, VoteType } from './entities/vote.entity';
import { ProposalAction } from './entities/proposal-action.entity';
import { GovernanceConfig } from './entities/governance-config.entity';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { CastVoteDto, CastVoteWithTypeDto } from './dto/vote.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class GovernanceService {
  constructor(
    @InjectRepository(Proposal)
    private proposalRepository: Repository<Proposal>,
    @InjectRepository(Vote)
    private voteRepository: Repository<Vote>,
    @InjectRepository(ProposalAction)
    private actionRepository: Repository<ProposalAction>,
    @InjectRepository(GovernanceConfig)
    private configRepository: Repository<GovernanceConfig>,
    private eventEmitter: EventEmitter2,
  ) {}

  async createProposal(dto: CreateProposalDto): Promise<Proposal> {
    const config = await this.getActiveConfig();

    // Verify proposer has enough voting power
    const proposerPower = await this.getVotingPower(dto.proposer);
    if (BigInt(proposerPower) < BigInt(config.proposalThreshold)) {
      throw new BadRequestException(
        `Proposer does not meet threshold. Required: ${config.proposalThreshold}, Has: ${proposerPower}`,
      );
    }

    const now = new Date();
    const votingStartTime = new Date(now.getTime() + 60000); // Start in 1 minute
    const votingEndTime = new Date(
      votingStartTime.getTime() + config.votingPeriod * 1000,
    );

    const proposal = this.proposalRepository.create({
      proposer: dto.proposer,
      description: dto.description,
      status: ProposalStatus.PENDING,
      votingStartTime,
      votingEndTime,
      quorumPercentage: dto.quorumPercentage || config.quorumPercentage,
      totalVotingPower: await this.getTotalVotingPower(),
    });

    const savedProposal = await this.proposalRepository.save(proposal);

    // Create actions
    for (const actionDto of dto.actions) {
      const action = this.actionRepository.create({
        proposalId: savedProposal.id,
        actionType: actionDto.actionType,
        target: actionDto.target,
        parameters: actionDto.parameters,
        calldata: actionDto.calldata,
      });
      await this.actionRepository.save(action);
    }

    this.eventEmitter.emit('proposal.created', {
      proposalId: savedProposal.id,
      proposer: dto.proposer,
    });

    return this.getProposal(savedProposal.id);
  }

  async vote(dto: CastVoteDto): Promise<void> {
    const proposal = await this.getProposal(dto.proposalId);

    // Check if voting is active
    const now = new Date();
    if (now < proposal.votingStartTime) {
      throw new BadRequestException('Voting has not started yet');
    }
    if (now > proposal.votingEndTime) {
      throw new BadRequestException('Voting period has ended');
    }
    if (proposal.status !== ProposalStatus.ACTIVE && proposal.status !== ProposalStatus.PENDING) {
      throw new BadRequestException(`Cannot vote on proposal with status: ${proposal.status}`);
    }

    // Update proposal status to active if it was pending
    if (proposal.status === ProposalStatus.PENDING && now >= proposal.votingStartTime) {
      proposal.status = ProposalStatus.ACTIVE;
      await this.proposalRepository.save(proposal);
    }

    // Check if voter already voted
    const existingVote = await this.voteRepository.findOne({
      where: { proposalId: dto.proposalId, voter: dto.voter },
    });
    if (existingVote) {
      throw new BadRequestException('Voter has already voted on this proposal');
    }

    // Get voter's voting power
    const votingPower = await this.getVotingPower(dto.voter);
    if (BigInt(votingPower) === BigInt(0)) {
      throw new BadRequestException('Voter has no voting power');
    }

    // Create vote
    const voteType = dto.support ? VoteType.FOR : VoteType.AGAINST;
    const vote = this.voteRepository.create({
      proposalId: dto.proposalId,
      voter: dto.voter,
      voteType,
      votingPower,
      reason: dto.reason,
    });

    await this.voteRepository.save(vote);

    // Update proposal vote counts
    const powerBigInt = BigInt(votingPower);
    if (voteType === VoteType.FOR) {
      proposal.votesFor = (BigInt(proposal.votesFor) + powerBigInt).toString();
    } else {
      proposal.votesAgainst = (BigInt(proposal.votesAgainst) + powerBigInt).toString();
    }

    await this.proposalRepository.save(proposal);

    this.eventEmitter.emit('vote.cast', {
      proposalId: dto.proposalId,
      voter: dto.voter,
      voteType,
      votingPower,
    });
  }

  async voteWithType(dto: CastVoteWithTypeDto): Promise<void> {
    const proposal = await this.getProposal(dto.proposalId);

    const now = new Date();
    if (now < proposal.votingStartTime || now > proposal.votingEndTime) {
      throw new BadRequestException('Voting is not active');
    }

    const existingVote = await this.voteRepository.findOne({
      where: { proposalId: dto.proposalId, voter: dto.voter },
    });
    if (existingVote) {
      throw new BadRequestException('Voter has already voted');
    }

    const votingPower = await this.getVotingPower(dto.voter);
    if (BigInt(votingPower) === BigInt(0)) {
      throw new BadRequestException('Voter has no voting power');
    }

    const vote = this.voteRepository.create({
      proposalId: dto.proposalId,
      voter: dto.voter,
      voteType: dto.voteType,
      votingPower,
      reason: dto.reason,
    });

    await this.voteRepository.save(vote);

    const powerBigInt = BigInt(votingPower);
    if (dto.voteType === VoteType.FOR) {
      proposal.votesFor = (BigInt(proposal.votesFor) + powerBigInt).toString();
    } else if (dto.voteType === VoteType.AGAINST) {
      proposal.votesAgainst = (BigInt(proposal.votesAgainst) + powerBigInt).toString();
    } else {
      proposal.votesAbstain = (BigInt(proposal.votesAbstain) + powerBigInt).toString();
    }

    await this.proposalRepository.save(proposal);
  }

  async executeProposal(proposalId: string): Promise<void> {
    const proposal = await this.getProposal(proposalId);
    const config = await this.getActiveConfig();

    // Check if voting has ended
    const now = new Date();
    if (now < proposal.votingEndTime) {
      throw new BadRequestException('Voting period has not ended');
    }

    // Update status if still active
    if (proposal.status === ProposalStatus.ACTIVE) {
      await this.finalizeProposal(proposalId);
      await this.proposalRepository.findOne({ where: { id: proposalId }, relations: ['actions'] });
    }

    // Reload proposal after finalization
    const updatedProposal = await this.getProposal(proposalId);

    if (updatedProposal.status !== ProposalStatus.QUEUED) {
      throw new BadRequestException(
        `Proposal cannot be executed. Status: ${updatedProposal.status}`,
      );
    }

    // Check timelock
    if (now < updatedProposal.executionTime) {
      throw new BadRequestException(
        `Proposal is timelocked until ${updatedProposal.executionTime.toISOString()}`,
      );
    }

    // Execute actions
    const actions = await this.actionRepository.find({
      where: { proposalId },
    });

    for (const action of actions) {
      await this.executeAction(action);
      action.executed = true;
      await this.actionRepository.save(action);
    }

    updatedProposal.status = ProposalStatus.EXECUTED;
    updatedProposal.executedAt = now;
    await this.proposalRepository.save(updatedProposal);

    this.eventEmitter.emit('proposal.executed', {
      proposalId,
      executedAt: now,
    });
  }

  async vetoProposal(
    proposalId: string,
    vetoer: string,
    reason: string,
  ): Promise<void> {
    const proposal = await this.getProposal(proposalId);
    const config = await this.getActiveConfig();

    // Check if vetoer has veto power
    if (!config.vetoAddresses.includes(vetoer)) {
      throw new ForbiddenException('Address does not have veto power');
    }

    // Can only veto proposals that are not yet executed
    if (proposal.status === ProposalStatus.EXECUTED) {
      throw new BadRequestException('Cannot veto executed proposal');
    }

    proposal.status = ProposalStatus.VETOED;
    proposal.vetoedBy = vetoer;
    proposal.vetoReason = reason;

    await this.proposalRepository.save(proposal);

    this.eventEmitter.emit('proposal.vetoed', {
      proposalId,
      vetoer,
      reason,
    });
  }

  async finalizeProposal(proposalId: string): Promise<void> {
    const proposal = await this.getProposal(proposalId);
    const config = await this.getActiveConfig();

    const now = new Date();
    if (now < proposal.votingEndTime) {
      throw new BadRequestException('Voting period has not ended');
    }

    // Calculate quorum
    const totalVotes =
      BigInt(proposal.votesFor) +
      BigInt(proposal.votesAgainst) +
      BigInt(proposal.votesAbstain);
    const totalPower = BigInt(proposal.totalVotingPower);
    const quorumReached =
      totalVotes * BigInt(100) >= totalPower * BigInt(proposal.quorumPercentage);

    // Determine outcome
    if (!quorumReached) {
      proposal.status = ProposalStatus.DEFEATED;
    } else if (BigInt(proposal.votesFor) > BigInt(proposal.votesAgainst)) {
      proposal.status = ProposalStatus.SUCCEEDED;
      // Queue for execution with timelock
      proposal.status = ProposalStatus.QUEUED;
      proposal.executionTime = new Date(now.getTime() + config.timelockDelay * 1000);
    } else {
      proposal.status = ProposalStatus.DEFEATED;
    }

    await this.proposalRepository.save(proposal);

    this.eventEmitter.emit('proposal.finalized', {
      proposalId,
      status: proposal.status,
    });
  }

  async getProposal(proposalId: string): Promise<Proposal> {
    const proposal = await this.proposalRepository.findOne({
      where: { id: proposalId },
      relations: ['votes', 'actions'],
    });

    if (!proposal) {
      throw new NotFoundException(`Proposal ${proposalId} not found`);
    }

    return proposal;
  }

  async getProposals(status?: ProposalStatus): Promise<Proposal[]> {
    const where = status ? { status } : {};
    return this.proposalRepository.find({
      where,
      relations: ['actions'],
      order: { createdAt: 'DESC' },
    });
  }

  async getVotes(proposalId: string): Promise<Vote[]> {
    return this.voteRepository.find({
      where: { proposalId },
      order: { createdAt: 'DESC' },
    });
  }

  private async executeAction(action: ProposalAction): Promise<void> {
    // This is where you would implement actual action execution
    // For now, we'll just emit an event
    this.eventEmitter.emit('action.executed', {
      actionId: action.id,
      actionType: action.actionType,
      target: action.target,
      parameters: action.parameters,
    });
  }

  private async getVotingPower(address: string): Promise<string> {
    // This should integrate with your token/governance token system
    // For now, return a mock value
    return '1000000000000';
  }

  private async getTotalVotingPower(): Promise<string> {
    // This should return the total voting power in the system
    // For now, return a mock value
    return '100000000000000';
  }

  private async getActiveConfig(): Promise<GovernanceConfig> {
    let config = await this.configRepository.findOne({
      where: { isActive: true },
    });

    if (!config) {
      // Create default config
      config = this.configRepository.create({
        quorumPercentage: 51,
        votingPeriod: 259200,
        timelockDelay: 172800,
        proposalLifetime: 604800,
        proposalThreshold: '1000000000000',
        vetoAddresses: [],
        isActive: true,
      });
      await this.configRepository.save(config);
    }

    return config;
  }
}
