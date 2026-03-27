//! # Storage Module for Split Template Contract
//!
//! Handles all persistent storage operations for templates.
//! Uses typed storage keys to prevent key collisions.

use soroban_sdk::{contracttype, Address, Env, String, Vec};

use crate::types::Template;

// Storage key types as contracted types
#[contracttype]
#[derive(Clone)]
pub struct TemplateKey {
    pub id: String,
}

#[contracttype]
#[derive(Clone)]
pub struct CreatorKey {
    pub creator: Address,
}

// Time-to-live for persistent storage (about 1 year)
const LEDGER_TTL_PERSISTENT: u32 = 31_536_000;

/// Store a template by its ID in persistent storage.
pub fn store_template(env: &Env, template: &Template) {
    let key = TemplateKey {
        id: template.id.clone(),
    };
    env.storage().persistent().set(&key, template);
    env.storage()
        .persistent()
        .extend_ttl(&key, LEDGER_TTL_PERSISTENT, LEDGER_TTL_PERSISTENT);
}

/// Retrieve a template by ID from persistent storage.
pub fn get_template(env: &Env, template_id: &String) -> Option<Template> {
    let key = TemplateKey {
        id: template_id.clone(),
    };
    env.storage().persistent().get(&key)
}

/// Add a template ID to a creator's index.
pub fn add_to_creator_index(env: &Env, creator: &Address, template_id: String) {
    let key = CreatorKey {
        creator: creator.clone(),
    };
    let mut templates: Vec<String> = env
        .storage()
        .persistent()
        .get(&key)
        .unwrap_or_else(|| Vec::new(env));

    templates.push_back(template_id);

    env.storage().persistent().set(&key, &templates);
    env.storage()
        .persistent()
        .extend_ttl(&key, LEDGER_TTL_PERSISTENT, LEDGER_TTL_PERSISTENT);
}

/// Retrieve all template IDs for a given creator.
pub fn get_creator_template_ids(env: &Env, creator: &Address) -> Vec<String> {
    let key = CreatorKey {
        creator: creator.clone(),
    };
    env.storage()
        .persistent()
        .get(&key)
        .unwrap_or_else(|| Vec::new(env))
}
