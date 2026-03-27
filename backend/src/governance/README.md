# DAO Governance System

A comprehensive DAO (Decentralized Autonomous Organization) governance system for platform decisions with proposal creation, voting mechanisms, quorum requirements, time-locked execution, and veto capabilities.

## Features

### Core Functionality

- **Proposal Creation**: Create proposals with multiple actions
- **Voting Mechanism**: Support for FOR/AGAINST/ABSTAIN votes
- **Quorum Requirements**: Configurable quorum percentage for proposal passage
- **Time-locked Execution**: Proposals are queued with a timelock delay before execution
- **Veto Mechanism**: Authorized addresses can veto proposals
- **Proposal Lifecycle**: Complete state machine from creation to execution

## Architecture

### Entities

#### Proposal

- Tracks proposal metadata, voting results, and status
- Supports multiple actions per proposal
- Configurable quorum percentage
- Time-locked execution after voting ends

#### Vote

- Records individual votes with voting power
- Prevents double voting
- Supports FOR/AGAINST/ABSTAIN vote types
- Optional reasoning for votes

#### ProposalAction

- Defines executable actions within a proposal
- Supports multiple action types (transfer funds, update parameters, etc.)
- Tracks execution status

#### GovernanceConfig

- System-wide governance parameters
- Configurable voting periods, timelock delays, and quorum
- Veto address management

### Proposal States

```
PENDING → ACTIVE → SUCCEEDED → QUEUED → EXECUTED
                 ↓
              DEFEATED
                 ↓
              VETOED
```

- **PENDING**: Proposal created, voting not started
- **ACTIVE**: Voting period is active
- **SUCCEEDED**: Voting ended, proposal passed
- **DEFEATED**: Voting ended, proposal failed (quorum not met or more against votes)
- **QUEUED**: Proposal succeeded and waiting for timelock
- **EXECUTED**: Proposal actions executed
- **VETOED**: Proposal vetoed by authorized address
- **EXPIRED**: Proposal lifetime exceeded

## API Endpoints

### Create Proposal

```http
POST /governance/proposals
Content-Type: application/json

{
  "proposer": "address",
  "description": "Proposal description",
  "actions": [
    {
      "actionType": "transfer_funds",
      "target": "recipient-address",
      "parameters": {
        "amount": "1000000",
        "token": "USDC"
      }
    }
  ],
  "quorumPercentage": 51
}
```

### Cast Vote

```http
POST /governance/vote
Content-Type: application/json

{
  "proposalId": "uuid",
  "voter": "address",
  "support": true,
  "reason": "Optional reasoning"
}
```

### Cast Vote with Type

```http
POST /governance/vote-with-type
Content-Type: application/json

{
  "proposalId": "uuid",
  "voter": "address",
  "voteType": "for|against|abstain",
  "reason": "Optional reasoning"
}
```

### Execute Proposal

```http
POST /governance/execute
Content-Type: application/json

{
  "proposalId": "uuid"
}
```

### Veto Proposal

```http
POST /governance/veto
Content-Type: application/json

{
  "proposalId": "uuid",
  "vetoer": "address",
  "reason": "Security concern"
}
```

### Get Proposals

```http
GET /governance/proposals?status=active
```

### Get Proposal Details

```http
GET /governance/proposals/:id
```

### Get Proposal Votes

```http
GET /governance/proposals/:id/votes
```

### Finalize Proposal

```http
POST /governance/proposals/:id/finalize
```

## Action Types

- **TRANSFER_FUNDS**: Transfer tokens to an address
- **UPDATE_PARAMETER**: Update system parameters
- **ADD_MEMBER**: Add a new member to the DAO
- **REMOVE_MEMBER**: Remove a member from the DAO
- **UPGRADE_CONTRACT**: Upgrade smart contract
- **CUSTOM**: Custom action with arbitrary parameters

## Configuration

Default governance parameters:

- **Quorum Percentage**: 51% (configurable per proposal)
- **Voting Period**: 3 days (259,200 seconds)
- **Timelock Delay**: 2 days (172,800 seconds)
- **Proposal Lifetime**: 7 days (604,800 seconds)
- **Proposal Threshold**: 1,000,000,000,000 (minimum voting power to create proposal)

## Voting Power

The system uses voting power to weight votes. Integration points:

- `getVotingPower(address)`: Returns voting power for an address
- `getTotalVotingPower()`: Returns total voting power in the system

These methods should be implemented to integrate with your token/governance token system.

## Events

The service emits the following events:

- `proposal.created`: When a new proposal is created
- `vote.cast`: When a vote is cast
- `proposal.finalized`: When voting ends and proposal is finalized
- `proposal.executed`: When proposal actions are executed
- `proposal.vetoed`: When a proposal is vetoed
- `action.executed`: When an individual action is executed

## Security Features

1. **Proposal Threshold**: Minimum voting power required to create proposals
2. **Quorum Requirements**: Minimum participation required for valid votes
3. **Timelock**: Delay between proposal success and execution
4. **Veto Power**: Authorized addresses can veto proposals
5. **Double Vote Prevention**: Each address can only vote once per proposal
6. **Status Validation**: Strict state machine prevents invalid transitions

## Usage Example

```typescript
// Create a proposal
const proposal = await governanceService.createProposal({
  proposer: "proposer-address",
  description: "Allocate 10,000 USDC to marketing budget",
  actions: [
    {
      actionType: ActionType.TRANSFER_FUNDS,
      target: "marketing-wallet",
      parameters: {
        amount: "10000000000",
        token: "USDC",
      },
    },
  ],
});

// Cast votes
await governanceService.vote({
  proposalId: proposal.id,
  voter: "voter-address-1",
  support: true,
});

// After voting period ends, finalize
await governanceService.finalizeProposal(proposal.id);

// After timelock, execute
await governanceService.executeProposal(proposal.id);
```

## Testing

Run tests:

```bash
npm test governance.service.spec.ts
```

## Integration

Add to your app module:

```typescript
import { GovernanceModule } from "./governance/governance.module";

@Module({
  imports: [
    // ... other imports
    GovernanceModule,
  ],
})
export class AppModule {}
```

## Database Migration

Run the migration to create tables:

```bash
npm run migration:run
```

## Future Enhancements

- Delegation system for voting power
- Proposal amendments
- Multi-signature execution
- Snapshot voting integration
- On-chain execution via smart contracts
- Proposal templates
- Voting strategies (quadratic voting, conviction voting)
