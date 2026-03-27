//! # Utility functions for Split Template Contract

use soroban_sdk::{Bytes, Env, String};

/// Convert a slice of bytes to a hex string (uppercase).
///
/// No_std compatible implementation without external dependencies.
pub fn bytes_to_hex_upper(env: &Env, bytes: &Bytes) -> String {
    const HEX_CHARS: &[u8] = b"0123456789ABCDEF";
    let mut hex_bytes = [0u8; 64]; // SHA256 produces 32 bytes = 64 hex chars

    let mut idx = 0;
    for byte in bytes.iter() {
        let high = HEX_CHARS[((byte >> 4) & 0x0F) as usize];
        let low = HEX_CHARS[(byte & 0x0F) as usize];
        hex_bytes[idx] = high;
        hex_bytes[idx + 1] = low;
        idx += 2;
    }

    // Create string from byte slice (safe because we only wrote ASCII hex chars)
    let hex_str = core::str::from_utf8(&hex_bytes[..idx]).unwrap_or("0");
    String::from_str(env, hex_str)
}

/// Convert a Hash<32> (SHA256 output) to hex string.
pub fn hash_to_hex_upper(env: &Env, hash: &[u8; 32]) -> String {
    const HEX_CHARS: &[u8] = b"0123456789ABCDEF";
    let mut hex_bytes = [0u8; 64]; // 32 bytes = 64 hex chars

    let mut idx = 0;
    for &byte in hash.iter() {
        let high = HEX_CHARS[((byte >> 4) & 0x0F) as usize];
        let low = HEX_CHARS[(byte & 0x0F) as usize];
        hex_bytes[idx] = high;
        hex_bytes[idx + 1] = low;
        idx += 2;
    }

    let hex_str = core::str::from_utf8(&hex_bytes[..idx]).unwrap_or("0");
    String::from_str(env, hex_str)
}
