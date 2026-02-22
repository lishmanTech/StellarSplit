import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GovernanceService } from './governance.service';
import { Proposal, ProposalStatus } from './entities/proposal.entity';
import { Vote, VoteType } from './entities/vote.entity';
import { ProposalAction, ActionType } from './entities/proposal-action.entity';
import { GovernanceConfig } from './entities/governance-config.entity';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('GovernanceService', () => {
  let service: GovernanceService;
  let proposalRepository: Repository<Proposal>;
  let voteRepository: Repository<Vote>;
  let actionRepository: Repository<ProposalAction>;
  let configRepository: Repository<GovernanceConfig>;
  let eventEmitter: EventEmitter2;

  const mockConfig: GovernanceConfig = {
    id: 'config-1',
    quorumPercentage: 51,
    votingPeriod: 259200,
    timelockDelay: 172800,
    proposalLifetime: 604800,
    proposalThreshold: '1000000000000',
    vetoAddresses: ['veto-address-1'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GovernanceService,
        {
          provide: getRepositoryToken(Proposal),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Vote),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ProposalAction),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(GovernanceConfig),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GovernanceService>(GovernanceService);
    proposalRepository = module.get<Repository<Proposal>>(
      getRepositoryToken(Proposal),
    );
    voteRepository = module.get<Repository<Vote>>(getRepositoryToken(Vote));
    actionRepository = module.get<Repository<ProposalAction>>(
      getRepositoryToken(ProposalAction),
    );
    configRepository = module.get<Repository<GovernanceConfig>>(
      getRepositoryToken(GovernanceConfig),
    );
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  describe('createProposal', () => {
    it('should create a proposal successfully', async () => {
      const dto = {
        proposer: 'proposer-address',
        description: 'Test proposal',
        actions: [
          {
            actionType: ActionType.TRANSFER_FUNDS,
            target: 'target-address',
            parameters: { amount: '1000' },
          },
        ],
      };

      jest.spyOn(configRepository, 'findOne').mockResolvedValue(mockConfig);
      jest.spyOn(service as any, 'getVotingPower').mockResolvedValue('2000000000000');
      jest.spyOn(service as any, 'getTotalVotingPower').mockResolvedValue('100000000000000');

      const mockProposal = {
        id: 'proposal-1',
        proposer: dto.proposer,
        description: dto.description,
        status: ProposalStatus.PENDING,
        votesFor: '0',
        votesAgainst: '0',
        votesAbstain: '0',
        votingStartTime: new Date(),
        votingEndTime: new Date(),
        executionTime: null,
        executedAt: null,
        vetoedBy: null,
        vetoReason: null,
        quorumPercentage: 51,
        totalVotingPower: '100000000000000',
        votes: [],
        actions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Proposal;

      jest.spyOn(proposalRepository, 'create').mockReturnValue(mockProposal);
      jest.spyOn(proposalRepository, 'save').mockResolvedValue(mockProposal);
      jest.spyOn(actionRepository, 'create').mockReturnValue({} as ProposalAction);
      jest.spyOn(actionRepository, 'save').mockResolvedValue({} as ProposalAction);
      jest.spyOn(proposalRepository, 'findOne').mockResolvedValue(mockProposal);

      const result = await service.createProposal(dto);

      expect(result).toBeDefined();
      expect(proposalRepository.save).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('proposal.created', expect.any(Object));
    });

    it('should throw error if proposer does not meet threshold', async () => {
      const dto = {
        proposer: 'proposer-address',
        description: 'Test proposal',
        actions: [],
      };

      jest.spyOn(configRepository, 'findOne').mockResolvedValue(mockConfig);
      jest.spyOn(service as any, 'getVotingPower').mockResolvedValue('500000000000');

      await expect(service.createProposal(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('vote', () => {
    it('should cast a vote successfully', async () => {
      const dto = {
        proposalId: 'proposal-1',
        voter: 'voter-address',
        support: true,
      };

      const mockProposal = {
        id: 'proposal-1',
        status: ProposalStatus.ACTIVE,
        votingStartTime: new Date(Date.now() - 10000),
        votingEndTime: new Date(Date.now() + 100000),
        votesFor: '0',
        votesAgainst: '0',
      } as Proposal;

      jest.spyOn(proposalRepository, 'findOne').mockResolvedValue(mockProposal);
      jest.spyOn(voteRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(service as any, 'getVotingPower').mockResolvedValue('1000000000000');
      jest.spyOn(voteRepository, 'create').mockReturnValue({} as Vote);
      jest.spyOn(voteRepository, 'save').mockResolvedValue({} as Vote);
      jest.spyOn(proposalRepository, 'save').mockResolvedValue(mockProposal);

      await service.vote(dto);

      expect(voteRepository.save).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('vote.cast', expect.any(Object));
    });

    it('should throw error if voter already voted', async () => {
      const dto = {
        proposalId: 'proposal-1',
        voter: 'voter-address',
        support: true,
      };

      const mockProposal = {
        id: 'proposal-1',
        status: ProposalStatus.ACTIVE,
        votingStartTime: new Date(Date.now() - 10000),
        votingEndTime: new Date(Date.now() + 100000),
      } as Proposal;

      jest.spyOn(proposalRepository, 'findOne').mockResolvedValue(mockProposal);
      jest.spyOn(voteRepository, 'findOne').mockResolvedValue({} as Vote);

      await expect(service.vote(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('vetoProposal', () => {
    it('should veto a proposal successfully', async () => {
      const mockProposal = {
        id: 'proposal-1',
        status: ProposalStatus.ACTIVE,
      } as Proposal;

      jest.spyOn(proposalRepository, 'findOne').mockResolvedValue(mockProposal);
      jest.spyOn(configRepository, 'findOne').mockResolvedValue(mockConfig);
      jest.spyOn(proposalRepository, 'save').mockResolvedValue(mockProposal);

      await service.vetoProposal('proposal-1', 'veto-address-1', 'Security concern');

      expect(proposalRepository.save).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('proposal.vetoed', expect.any(Object));
    });

    it('should throw error if address does not have veto power', async () => {
      const mockProposal = {
        id: 'proposal-1',
        status: ProposalStatus.ACTIVE,
      } as Proposal;

      jest.spyOn(proposalRepository, 'findOne').mockResolvedValue(mockProposal);
      jest.spyOn(configRepository, 'findOne').mockResolvedValue(mockConfig);

      await expect(
        service.vetoProposal('proposal-1', 'unauthorized-address', 'reason'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
