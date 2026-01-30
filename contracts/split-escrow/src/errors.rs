use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    EscrowNotFound = 3,
    EscrowExpired = 4,
    InvalidParticipant = 5,
    InvalidAmount = 6,
    AlreadyPaid = 7,
    Unauthorized = 8,
    ParticipantNotFound = 9
}
