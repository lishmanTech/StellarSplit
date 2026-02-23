# Achievement Badges NFT Contract

This Soroban smart contract implements an NFT minting system for achievement badges in the StellarSplit application.

## Overview

The contract allows users to mint NFTs representing various achievements within the StellarSplit ecosystem. Each badge type can only be minted once per user, ensuring uniqueness and preventing duplicates.

## Badge Types

- **First Split Creator**: Awarded for creating your first split
- **Century Club**: Participated in 100 splits
- **Big Spender**: Spent over 1000 XLM in splits
- **Frequent Settler**: Settled 50 splits as creator
- **Group Leader**: Created 10 group splits

## Functions

### `initialize(env: Env, admin: Address)`

Initializes the contract with an admin address. Must be called before any other operations.

### `check_badge_eligibility(env: Env, user: Address, badge_type: BadgeType) -> bool`

Checks if a user is eligible to mint a specific badge type. Currently returns true for all badges (mock implementation).

### `mint_badge(env: Env, user: Address, badge_type: BadgeType) -> Result<u64, BadgeError>`

Mints a new badge NFT for the user if they are eligible and haven't already minted that badge type. Returns the token ID.

### `get_user_badges(env: Env, user: Address) -> Vec<UserBadge>`

Returns all badges owned by a user.

### `get_badge_metadata(env: Env, badge_type: BadgeType) -> BadgeMetadata`

Returns metadata for a specific badge type including name, description, and image URL.

## Error Types

- `AlreadyMinted`: User has already minted this badge type
- `NotEligible`: User is not eligible for this badge
- `InvalidBadgeType`: Invalid badge type provided
- `Unauthorized`: Operation not authorized

## Building

```bash
cd contracts/achievement-badges
cargo build --target wasm32-unknown-unknown --release
```

## Testing

```bash
cd contracts/achievement-badges
cargo test
```

## Deployment

The contract can be deployed to Stellar testnet or mainnet using the Soroban CLI.

## Integration

This contract is designed to be called by the main StellarSplit backend when users achieve certain milestones. The eligibility checking logic should be updated to integrate with the main split contract to verify actual user achievements.