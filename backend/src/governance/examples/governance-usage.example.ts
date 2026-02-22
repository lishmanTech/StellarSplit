/**
 * DAO Governance System Usage Examples
 * 
 * This file demonstrates how to use the governance system
 * for various DAO operations.
 */

import { GovernanceService } from '../governance.service';
import { ActionType } from '../entities/proposal-action.entity';
import { VoteType } from '../entities/vote.entity';

export class GovernanceUsageExamples {
  constructor(private readonly governanceService: GovernanceService) {}

  /**
   * Example 1: Create a proposal to transfer funds
   */
  async createFundingProposal() {
    const proposal = await this.governanceService.createProposal({
      proposer: 'proposer-stellar-address',
      description: 'Allocate 50,000 USDC to development team for Q1 2026',
      actions: [
        {
          actionType: ActionType.TRANSFER_FUNDS,
          target: 'dev-team-wallet-address',
          parameters: {
            amount: '50000000000', // 50,000 USDC (6 decimals)
            token: 'USDC',
            memo: 'Q1 2026 Development Budget',
          },
        },
      ],
      quorumPercentage: 60, // Require 60% quorum for this important proposal
    });

    console.log(`Proposal created: ${proposal.id}`);
    return proposal;
  }

  /**
   * Example 2: Create a proposal with multiple actions
   */
  async createMultiActionProposal() {
    const proposal = await this.governanceService.createProposal({
      proposer: 'proposer-address',
      description: 'Platform upgrade and team expansion',
      actions: [
        {
          actionType: ActionType.UPGRADE_CONTRACT,
          target: 'platform-contract-address',
          parameters: {
            newVersion: '2.0.0',
            migrationScript: 'upgrade-v2.js',
          },
        },
        {
          actionType: ActionType.ADD_MEMBER,
          target: 'new-member-address',
          parameters: {
            role: 'developer',
            votingPower: '1000000000000',
          },
        },
        {
          actionType: ActionType.TRANSFER_FUNDS,
          target: 'new-member-address',
          parameters: {
            amount: '5000000000',
            token: 'USDC',
            memo: 'Welcome bonus',
          },
        },
      ],
    });

    return proposal;
  }

  /**
   * Example 3: Cast a vote with reasoning
   */
  async voteOnProposal(proposalId: string, voterAddress: string) {
    await this.governanceService.vote({
      proposalId,
      voter: voterAddress,
      support: true,
      reason: 'This proposal aligns with our long-term strategy and has clear deliverables.',
    });

    console.log('Vote cast successfully');
  }

  /**
   * Example 4: Cast an abstain vote
   */
  async abstainFromVote(proposalId: string, voterAddress: string) {
    await this.governanceService.voteWithType({
      proposalId,
      voter: voterAddress,
      voteType: VoteType.ABSTAIN,
      reason: 'Conflict of interest - I am part of the receiving team',
    });
  }

  /**
   * Example 5: Execute a proposal after timelock
   */
  async executeProposalAfterTimelock(proposalId: string) {
    try {
      await this.governanceService.executeProposal(proposalId);
      console.log('Proposal executed successfully');
    } catch (error) {
      console.error('Execution failed:', error.message);
      // Might fail if timelock hasn't expired or quorum wasn't met
    }
  }

  /**
   * Example 6: Veto a proposal (requires veto power)
   */
  async vetoProposal(proposalId: string, vetoerAddress: string) {
    await this.governanceService.vetoProposal(
      proposalId,
      vetoerAddress,
      'Security audit revealed critical vulnerabilities in the proposed contract upgrade',
    );

    console.log('Proposal vetoed');
  }

  /**
   * Example 7: Monitor proposal lifecycle
   */
  async monitorProposal(proposalId: string) {
    const proposal = await this.governanceService.getProposal(proposalId);

    console.log('Proposal Status:', proposal.status);
    console.log('Votes For:', proposal.votesFor);
    console.log('Votes Against:', proposal.votesAgainst);
    console.log('Votes Abstain:', proposal.votesAbstain);

    // Calculate participation
    const totalVotes =
      BigInt(proposal.votesFor) +
      BigInt(proposal.votesAgainst) +
      BigInt(proposal.votesAbstain);
    const totalPower = BigInt(proposal.totalVotingPower);
    const participation = Number((totalVotes * BigInt(100)) / totalPower);

    console.log(`Participation: ${participation.toFixed(2)}%`);
    console.log(`Quorum Required: ${proposal.quorumPercentage}%`);

    // Check if quorum is met
    const quorumMet = participation >= proposal.quorumPercentage;
    console.log(`Quorum Met: ${quorumMet}`);

    // Check if proposal is passing
    const isPassing = BigInt(proposal.votesFor) > BigInt(proposal.votesAgainst);
    console.log(`Currently Passing: ${isPassing}`);

    return {
      proposal,
      participation,
      quorumMet,
      isPassing,
    };
  }

  /**
   * Example 8: Get all active proposals
   */
  async getActiveProposals() {
    const proposals = await this.governanceService.getProposals();
    
    const active = proposals.filter(
      (p) => p.status === 'active' || p.status === 'pending',
    );

    console.log(`Found ${active.length} active proposals`);
    
    return active.map((p) => ({
      id: p.id,
      description: p.description,
      proposer: p.proposer,
      votingEndTime: p.votingEndTime,
      status: p.status,
    }));
  }

  /**
   * Example 9: Create a parameter update proposal
   */
  async createParameterUpdateProposal() {
    const proposal = await this.governanceService.createProposal({
      proposer: 'proposer-address',
      description: 'Increase quorum requirement to 65% for better governance',
      actions: [
        {
          actionType: ActionType.UPDATE_PARAMETER,
          target: 'governance-config',
          parameters: {
            parameter: 'quorumPercentage',
            oldValue: 51,
            newValue: 65,
          },
        },
      ],
      quorumPercentage: 75, // Higher quorum for governance changes
    });

    return proposal;
  }

  /**
   * Example 10: Finalize a proposal after voting ends
   */
  async finalizeProposal(proposalId: string) {
    await this.governanceService.finalizeProposal(proposalId);
    
    const proposal = await this.governanceService.getProposal(proposalId);
    
    console.log('Proposal finalized with status:', proposal.status);
    
    if (proposal.status === 'queued') {
      console.log('Proposal succeeded and is queued for execution');
      console.log('Execution time:', proposal.executionTime);
      
      const now = new Date();
      const timeUntilExecution = proposal.executionTime.getTime() - now.getTime();
      const hoursUntilExecution = timeUntilExecution / (1000 * 60 * 60);
      
      console.log(`Can be executed in ${hoursUntilExecution.toFixed(2)} hours`);
    }
    
    return proposal;
  }
}

/**
 * Complete workflow example
 */
export async function completeGovernanceWorkflow(
  governanceService: GovernanceService,
) {
  console.log('=== DAO Governance Workflow Example ===\n');

  // Step 1: Create proposal
  console.log('Step 1: Creating proposal...');
  const proposal = await governanceService.createProposal({
    proposer: 'proposer-address',
    description: 'Fund marketing campaign for Q1 2026',
    actions: [
      {
        actionType: ActionType.TRANSFER_FUNDS,
        target: 'marketing-wallet',
        parameters: {
          amount: '25000000000',
          token: 'USDC',
        },
      },
    ],
  });
  console.log(`✓ Proposal created: ${proposal.id}\n`);

  // Step 2: Wait for voting to start (in real scenario)
  console.log('Step 2: Waiting for voting period to start...');
  console.log(`Voting starts at: ${proposal.votingStartTime}`);
  console.log(`Voting ends at: ${proposal.votingEndTime}\n`);

  // Step 3: Cast votes
  console.log('Step 3: Casting votes...');
  await governanceService.vote({
    proposalId: proposal.id,
    voter: 'voter-1',
    support: true,
    reason: 'Marketing is essential for growth',
  });
  console.log('✓ Vote 1 cast (FOR)');

  await governanceService.vote({
    proposalId: proposal.id,
    voter: 'voter-2',
    support: true,
  });
  console.log('✓ Vote 2 cast (FOR)');

  await governanceService.vote({
    proposalId: proposal.id,
    voter: 'voter-3',
    support: false,
    reason: 'Budget is too high',
  });
  console.log('✓ Vote 3 cast (AGAINST)\n');

  // Step 4: Finalize after voting ends
  console.log('Step 4: Finalizing proposal...');
  await governanceService.finalizeProposal(proposal.id);
  const finalizedProposal = await governanceService.getProposal(proposal.id);
  console.log(`✓ Proposal finalized with status: ${finalizedProposal.status}\n`);

  // Step 5: Execute if succeeded
  if (finalizedProposal.status === 'queued') {
    console.log('Step 5: Waiting for timelock to expire...');
    console.log(`Execution time: ${finalizedProposal.executionTime}`);
    
    // In real scenario, wait for timelock
    // await governanceService.executeProposal(proposal.id);
    console.log('(Execution would happen after timelock expires)\n');
  }

  console.log('=== Workflow Complete ===');
}
