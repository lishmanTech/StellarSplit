import { Test, TestingModule } from '@nestjs/testing';
import { GovernanceController } from './governance.controller';
import { GovernanceService } from './governance.service';
import { ProposalStatus } from './entities/proposal.entity';
import { ActionType } from './entities/proposal-action.entity';

describe('GovernanceController', () => {
  let controller: GovernanceController;
  let service: GovernanceService;

  const mockProposal = {
    id: 'proposal-1',
    proposer: 'proposer-address',
    description: 'Test proposal',
    status: ProposalStatus.PENDING,
    votesFor: '0',
    votesAgainst: '0',
    votesAbstain: '0',
    actions: [],
    votes: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GovernanceController],
      providers: [
        {
          provide: GovernanceService,
          useValue: {
            createProposal: jest.fn(),
            getProposals: jest.fn(),
            getProposal: jest.fn(),
            vote: jest.fn(),
            voteWithType: jest.fn(),
            getVotes: jest.fn(),
            executeProposal: jest.fn(),
            vetoProposal: jest.fn(),
            finalizeProposal: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<GovernanceController>(GovernanceController);
    service = module.get<GovernanceService>(GovernanceService);
  });

  describe('createProposal', () => {
    it('should create a proposal', async () => {
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

      jest.spyOn(service, 'createProposal').mockResolvedValue(mockProposal as any);

      const result = await controller.createProposal(dto);

      expect(result.success).toBe(true);
      expect(result.data.proposalId).toBe('proposal-1');
      expect(service.createProposal).toHaveBeenCalledWith(dto);
    });
  });

  describe('getProposals', () => {
    it('should return all proposals', async () => {
      jest.spyOn(service, 'getProposals').mockResolvedValue([mockProposal] as any);

      const result = await controller.getProposals();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(service.getProposals).toHaveBeenCalled();
    });

    it('should filter proposals by status', async () => {
      jest.spyOn(service, 'getProposals').mockResolvedValue([mockProposal] as any);

      const result = await controller.getProposals(ProposalStatus.ACTIVE);

      expect(result.success).toBe(true);
      expect(service.getProposals).toHaveBeenCalledWith(ProposalStatus.ACTIVE);
    });
  });

  describe('getProposal', () => {
    it('should return a specific proposal', async () => {
      jest.spyOn(service, 'getProposal').mockResolvedValue(mockProposal as any);

      const result = await controller.getProposal('proposal-1');

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('proposal-1');
      expect(service.getProposal).toHaveBeenCalledWith('proposal-1');
    });
  });

  describe('vote', () => {
    it('should cast a vote', async () => {
      const dto = {
        proposalId: 'proposal-1',
        voter: 'voter-address',
        support: true,
      };

      jest.spyOn(service, 'vote').mockResolvedValue(undefined);

      const result = await controller.vote(dto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Vote cast successfully');
      expect(service.vote).toHaveBeenCalledWith(dto);
    });
  });

  describe('executeProposal', () => {
    it('should execute a proposal', async () => {
      const dto = { proposalId: 'proposal-1' };

      jest.spyOn(service, 'executeProposal').mockResolvedValue(undefined);

      const result = await controller.executeProposal(dto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Proposal executed successfully');
      expect(service.executeProposal).toHaveBeenCalledWith('proposal-1');
    });
  });

  describe('vetoProposal', () => {
    it('should veto a proposal', async () => {
      const dto = {
        proposalId: 'proposal-1',
        vetoer: 'veto-address',
        reason: 'Security concern',
      };

      jest.spyOn(service, 'vetoProposal').mockResolvedValue(undefined);

      const result = await controller.vetoProposal(dto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Proposal vetoed successfully');
      expect(service.vetoProposal).toHaveBeenCalledWith(
        'proposal-1',
        'veto-address',
        'Security concern',
      );
    });
  });

  describe('finalizeProposal', () => {
    it('should finalize a proposal', async () => {
      jest.spyOn(service, 'finalizeProposal').mockResolvedValue(undefined);

      const result = await controller.finalizeProposal('proposal-1');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Proposal finalized successfully');
      expect(service.finalizeProposal).toHaveBeenCalledWith('proposal-1');
    });
  });
});
