# DAO Governance API Documentation

## Base URL

```
http://localhost:3000/governance
```

## Endpoints

### 1. Create Proposal

Create a new governance proposal with one or more actions.

**Endpoint:** `POST /governance/proposals`

**Request Body:**

```json
{
  "proposer": "stellar-address-of-proposer",
  "description": "Detailed description of the proposal",
  "actions": [
    {
      "actionType": "transfer_funds",
      "target": "recipient-address",
      "parameters": {
        "amount": "1000000000",
        "token": "USDC",
        "memo": "Payment description"
      },
      "calldata": "optional-encoded-data"
    }
  ],
  "quorumPercentage": 60
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "proposalId": "uuid",
    "proposal": {
      "id": "uuid",
      "proposer": "stellar-address",
      "description": "Proposal description",
      "status": "pending",
      "votesFor": "0",
      "votesAgainst": "0",
      "votesAbstain": "0",
      "votingStartTime": "2026-02-23T10:00:00Z",
      "votingEndTime": "2026-02-26T10:00:00Z",
      "quorumPercentage": 60,
      "totalVotingPower": "100000000000000",
      "actions": [...],
      "createdAt": "2026-02-22T10:00:00Z"
    }
  }
}
```

---

### 2. Get All Proposals

Retrieve all proposals, optionally filtered by status.

**Endpoint:** `GET /governance/proposals`

**Query Parameters:**

- `status` (optional): Filter by status (pending, active, succeeded, defeated, queued, executed, vetoed, expired)

**Example:**

```
GET /governance/proposals?status=active
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "proposer": "address",
      "description": "Proposal description",
      "status": "active",
      "votesFor": "5000000000000",
      "votesAgainst": "2000000000000",
      "votingEndTime": "2026-02-26T10:00:00Z",
      "actions": [...]
    }
  ]
}
```

---

### 3. Get Proposal Details

Get detailed information about a specific proposal.

**Endpoint:** `GET /governance/proposals/:id`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "proposer": "address",
    "description": "Proposal description",
    "status": "active",
    "votesFor": "5000000000000",
    "votesAgainst": "2000000000000",
    "votesAbstain": "1000000000000",
    "votingStartTime": "2026-02-23T10:00:00Z",
    "votingEndTime": "2026-02-26T10:00:00Z",
    "executionTime": null,
    "quorumPercentage": 51,
    "totalVotingPower": "100000000000000",
    "actions": [
      {
        "id": "uuid",
        "actionType": "transfer_funds",
        "target": "recipient-address",
        "parameters": {...},
        "executed": false
      }
    ],
    "votes": [...]
  }
}
```

---

### 4. Cast Vote (Simple)

Cast a FOR or AGAINST vote on a proposal.

**Endpoint:** `POST /governance/vote`

**Request Body:**

```json
{
  "proposalId": "uuid",
  "voter": "stellar-address",
  "support": true,
  "reason": "Optional reasoning for the vote"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Vote cast successfully"
}
```

---

### 5. Cast Vote (With Type)

Cast a vote with explicit type (FOR/AGAINST/ABSTAIN).

**Endpoint:** `POST /governance/vote-with-type`

**Request Body:**

```json
{
  "proposalId": "uuid",
  "voter": "stellar-address",
  "voteType": "for",
  "reason": "Optional reasoning"
}
```

**Vote Types:**

- `for` - Vote in favor
- `against` - Vote against
- `abstain` - Abstain from voting (counts toward quorum)

**Response:**

```json
{
  "success": true,
  "message": "Vote cast successfully"
}
```

---

### 6. Get Proposal Votes

Get all votes cast on a specific proposal.

**Endpoint:** `GET /governance/proposals/:id/votes`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "proposalId": "uuid",
      "voter": "stellar-address",
      "voteType": "for",
      "votingPower": "1000000000000",
      "reason": "Good proposal",
      "createdAt": "2026-02-23T12:00:00Z"
    }
  ]
}
```

---

### 7. Execute Proposal

Execute a proposal that has passed and completed its timelock.

**Endpoint:** `POST /governance/execute`

**Request Body:**

```json
{
  "proposalId": "uuid"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Proposal executed successfully"
}
```

**Requirements:**

- Proposal status must be `queued`
- Timelock period must have expired
- All actions will be executed sequentially

---

### 8. Veto Proposal

Veto a proposal (requires veto authority).

**Endpoint:** `POST /governance/veto`

**Request Body:**

```json
{
  "proposalId": "uuid",
  "vetoer": "authorized-address",
  "reason": "Security vulnerability detected"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Proposal vetoed successfully"
}
```

**Requirements:**

- Vetoer address must be in the authorized veto list
- Proposal cannot already be executed

---

### 9. Finalize Proposal

Finalize a proposal after voting period ends (calculates result and queues for execution if passed).

**Endpoint:** `POST /governance/proposals/:id/finalize`

**Response:**

```json
{
  "success": true,
  "message": "Proposal finalized successfully"
}
```

**This endpoint:**

- Calculates if quorum was met
- Determines if proposal passed (more FOR than AGAINST votes)
- Updates status to `succeeded`/`defeated`
- Queues successful proposals with timelock

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

### Common Errors

**400 Bad Request**

- Proposer does not meet threshold
- Voter has already voted
- Voting period has not started/ended
- Proposal is timelocked
- Invalid proposal status

**403 Forbidden**

- Address does not have veto power

**404 Not Found**

- Proposal not found

---

## Action Types Reference

### transfer_funds

```json
{
  "actionType": "transfer_funds",
  "target": "recipient-address",
  "parameters": {
    "amount": "1000000000",
    "token": "USDC",
    "memo": "Payment description"
  }
}
```

### update_parameter

```json
{
  "actionType": "update_parameter",
  "target": "governance-config",
  "parameters": {
    "parameter": "quorumPercentage",
    "oldValue": 51,
    "newValue": 60
  }
}
```

### add_member

```json
{
  "actionType": "add_member",
  "target": "new-member-address",
  "parameters": {
    "role": "developer",
    "votingPower": "1000000000000"
  }
}
```

### remove_member

```json
{
  "actionType": "remove_member",
  "target": "member-address",
  "parameters": {
    "reason": "Inactive for 6 months"
  }
}
```

### upgrade_contract

```json
{
  "actionType": "upgrade_contract",
  "target": "contract-address",
  "parameters": {
    "newVersion": "2.0.0",
    "migrationScript": "upgrade-v2.js"
  }
}
```

### custom

```json
{
  "actionType": "custom",
  "target": "target-address",
  "parameters": {
    "customField1": "value1",
    "customField2": "value2"
  },
  "calldata": "0x..."
}
```

---

## Complete Workflow Example

### Step 1: Create Proposal

```bash
curl -X POST http://localhost:3000/governance/proposals \
  -H "Content-Type: application/json" \
  -d '{
    "proposer": "GABC123...",
    "description": "Allocate 10,000 USDC for marketing",
    "actions": [{
      "actionType": "transfer_funds",
      "target": "GXYZ789...",
      "parameters": {
        "amount": "10000000000",
        "token": "USDC"
      }
    }]
  }'
```

### Step 2: Cast Votes

```bash
# Vote FOR
curl -X POST http://localhost:3000/governance/vote \
  -H "Content-Type: application/json" \
  -d '{
    "proposalId": "proposal-uuid",
    "voter": "GDEF456...",
    "support": true,
    "reason": "Marketing is essential"
  }'

# Vote AGAINST
curl -X POST http://localhost:3000/governance/vote \
  -H "Content-Type: application/json" \
  -d '{
    "proposalId": "proposal-uuid",
    "voter": "GHIJ789...",
    "support": false
  }'
```

### Step 3: Check Proposal Status

```bash
curl http://localhost:3000/governance/proposals/proposal-uuid
```

### Step 4: Finalize (after voting ends)

```bash
curl -X POST http://localhost:3000/governance/proposals/proposal-uuid/finalize
```

### Step 5: Execute (after timelock)

```bash
curl -X POST http://localhost:3000/governance/execute \
  -H "Content-Type: application/json" \
  -d '{
    "proposalId": "proposal-uuid"
  }'
```

---

## Rate Limits

Consider implementing rate limits:

- Proposal creation: 10 per hour per address
- Voting: 100 per hour per address
- Query endpoints: 1000 per hour per IP

---

## Authentication

Add authentication middleware to protect endpoints:

- Verify Stellar signatures
- Validate address ownership
- Check voting power before allowing votes
- Verify veto authority

---

## WebSocket Events (Future Enhancement)

Subscribe to real-time updates:

```javascript
socket.on("proposal.created", (data) => {
  console.log("New proposal:", data.proposalId);
});

socket.on("vote.cast", (data) => {
  console.log("Vote cast:", data);
});

socket.on("proposal.executed", (data) => {
  console.log("Proposal executed:", data.proposalId);
});
```
