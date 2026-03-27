use crate::types::{DataKey, Loan};
use soroban_sdk::{Address, Env, String};

pub fn has_admin(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::Admin)
}

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

pub fn get_token(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Token).unwrap()
}

pub fn set_token(env: &Env, token: &Address) {
    env.storage().instance().set(&DataKey::Token, token);
}

pub fn get_fee_bp(env: &Env) -> u32 {
    env.storage()
        .instance()
        .get(&DataKey::FeeBP)
        .unwrap_or(5u32) // Default 0.05%
}

pub fn set_fee_bp(env: &Env, fee_bp: u32) {
    env.storage().instance().set(&DataKey::FeeBP, &fee_bp);
}

pub fn is_reentrancy_guard_active(env: &Env) -> bool {
    env.storage()
        .instance()
        .get(&DataKey::ReentrancyGuard)
        .unwrap_or(false)
}

pub fn set_reentrancy_guard(env: &Env, status: bool) {
    env.storage()
        .instance()
        .set(&DataKey::ReentrancyGuard, &status);
}

pub fn get_loan(env: &Env, loan_id: &String) -> Option<Loan> {
    env.storage()
        .persistent()
        .get(&DataKey::Loan(loan_id.clone()))
}

pub fn set_loan(env: &Env, loan_id: &String, loan: &Loan) {
    env.storage()
        .persistent()
        .set(&DataKey::Loan(loan_id.clone()), loan);
}
