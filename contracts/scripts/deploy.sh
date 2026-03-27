#!/bin/bash
# Deploy the Soroban contract to Stellar network
#
# I designed this script to support both testnet and mainnet deployment.
# It requires the ADMIN_SECRET_KEY environment variable to be set.
#
# Usage:
#   ./deploy.sh          # Deploy to testnet (default)
#   ./deploy.sh testnet  # Deploy to testnet
#   ./deploy.sh mainnet  # Deploy to mainnet (use with caution!)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WASM_PATH="$SCRIPT_DIR/../split-escrow/target/wasm32-unknown-unknown/release/split_escrow.wasm"

# Default to testnet
NETWORK="${1:-testnet}"

echo "🚀 StellarSplit Contract Deployment"
echo "   Network: $NETWORK"
echo ""

# Validate network
if [ "$NETWORK" != "testnet" ] && [ "$NETWORK" != "mainnet" ]; then
    echo "❌ Error: Invalid network '$NETWORK'"
    echo "   Valid options: testnet, mainnet"
    exit 1
fi

# Check if ADMIN_SECRET_KEY is set
if [ -z "$ADMIN_SECRET_KEY" ]; then
    echo "❌ Error: ADMIN_SECRET_KEY environment variable is not set"
    echo ""
    echo "To deploy, set your secret key:"
    echo "  export ADMIN_SECRET_KEY='S...your_secret_key...'"
    echo ""
    echo "⚠️  Never commit your secret key to version control!"
    exit 1
fi

# Check if soroban CLI is installed
if ! command -v soroban &> /dev/null; then
    echo "❌ Error: soroban CLI is not installed"
    echo ""
    echo "Install it with:"
    echo "  cargo install soroban-cli"
    exit 1
fi

# Check if WASM file exists
if [ ! -f "$WASM_PATH" ]; then
    echo "❌ Error: Contract WASM not found at $WASM_PATH"
    echo ""
    echo "Build the contract first:"
    echo "  ./build.sh"
    exit 1
fi

# Mainnet warning
if [ "$NETWORK" = "mainnet" ]; then
    echo "⚠️  WARNING: You are deploying to MAINNET!"
    echo "   This will use real XLM for fees."
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Deployment cancelled."
        exit 0
    fi
fi

echo "📦 Deploying contract..."
echo ""

# Deploy the contract
CONTRACT_ID=$(soroban contract deploy \
    --wasm "$WASM_PATH" \
    --source "$ADMIN_SECRET_KEY" \
    --network "$NETWORK")

echo ""
echo "✅ Deployment successful!"
echo ""
echo "📋 Contract Details:"
echo "   Network:     $NETWORK"
echo "   Contract ID: $CONTRACT_ID"
echo ""
echo "💾 Save this contract ID for future interactions."
echo ""

# Save contract ID to file
CONTRACT_FILE="$SCRIPT_DIR/../.contract-id-$NETWORK"
echo "$CONTRACT_ID" > "$CONTRACT_FILE"
echo "📁 Contract ID saved to: $CONTRACT_FILE"
