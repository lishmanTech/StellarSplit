use soroban_sdk::{contracttype, Address, String};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Token,
    FeeBP,
    ReentrancyGuard,
    Loan(String),
}

#[contracttype]
#[derive(Clone)]
pub struct Loan {
    pub borrower: Address,
    pub amount: i128,
    pub fee: i128,
    pub repaid: bool,
}
