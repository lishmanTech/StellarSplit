import { ProposalStatus } from '../entities/proposal.entity';
import { VoteType } from '../entities/vote.entity';

export class ProposalResponseDto {
  id: string;
  proposer: string;
  description: string;
  status: ProposalStatus;
  votesFor: string;
  votesAgainst: string;
  votesAbstain: string;
  votingStartTime: Date;
  votingEndTime: Date;
  executionTime: Date;
  quorumPercentage: number;
  totalVotingPower: string;
  actions: Array<{
    actionType: string;
    target: string;
    parameters: Record<string, any>;
    executed: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export class VoteResponseDto {
  id: string;
  proposalId: string;
  voter: string;
  voteType: VoteType;
  votingPower: string;
  reason?: string;
  createdAt: Date;
}
