use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    InvalidAmount = 4,
    InvalidFeeBps = 5,
    SplitNotFound = 6,
    SplitNotPending = 7,
    SplitNotReady = 8,
    TreasuryNotSet = 9,
    ParticipantCapExceeded = 10,
    InvalidInput = 11,
    EscrowNotActive = 12,
    InvalidMetadata = 13,
    SplitNotActive = 14,
    InvalidVersion = 15,
    InvalidMetadata = 15,
    ParticipantNotOwed = 16,
    InsufficientFulfillment = 17,
    TotalAmountMismatch = 18,
}
