use soroban_sdk::{token, Address, Env};

use crate::{errors::Error, events, storage};

const MAX_BPS: u32 = 10_000;

fn require_admin(env: &Env) -> Result<(), Error> {
    if !storage::has_admin(env) {
        return Err(Error::NotInitialized);
    }
    let admin = storage::get_admin(env);
    admin.require_auth();
    Ok(())
}

pub fn set_fee(env: &Env, fee_bps: u32) -> Result<(), Error> {
    require_admin(env)?;
    if fee_bps > MAX_BPS {
        return Err(Error::InvalidFeeBps);
    }
    storage::set_fee_bps(env, fee_bps);
    Ok(())
}

pub fn set_treasury(env: &Env, treasury: &Address) -> Result<(), Error> {
    require_admin(env)?;
    storage::set_treasury(env, treasury);
    Ok(())
}

pub fn calculate_fee(total: i128, fee_bps: u32) -> i128 {
    (total * fee_bps as i128) / MAX_BPS as i128
}

pub fn collect_fee(env: &Env, total: i128) -> Result<i128, Error> {
    let fee_bps = storage::get_fee_bps(env);
    let treasury = storage::get_treasury(env).ok_or(Error::TreasuryNotSet)?;
    let fee_amount = calculate_fee(total, fee_bps);

    if fee_amount > 0 {
        let token = storage::get_token(env);
        let token_client = token::Client::new(env, &token);
        token_client.transfer(&env.current_contract_address(), &treasury, &fee_amount);
    }

    events::emit_fees_collected(env, fee_amount, &treasury);
    Ok(fee_amount)
}
