#!/bin/bash
# Run unit tests for the Soroban contract
#
# I designed this script to run all tests with helpful output.
# It can also run specific tests if a pattern is provided.
#
# Usage:
#   ./test.sh              # Run all tests
#   ./test.sh create       # Run tests matching 'create'
#   ./test.sh --verbose    # Run with verbose output

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONTRACT_DIR="$SCRIPT_DIR/../split-escrow"

echo "🧪 Running Split Escrow Contract Tests"
echo "   Contract: $CONTRACT_DIR"
echo ""

cd "$CONTRACT_DIR"

# Parse arguments
VERBOSE=""
TEST_PATTERN=""

for arg in "$@"; do
    case $arg in
        --verbose|-v)
            VERBOSE="--nocapture"
            ;;
        *)
            TEST_PATTERN="$arg"
            ;;
    esac
done

# Build test command
CMD="cargo test"

if [ -n "$TEST_PATTERN" ]; then
    CMD="$CMD $TEST_PATTERN"
    echo "🔍 Running tests matching: $TEST_PATTERN"
fi

if [ -n "$VERBOSE" ]; then
    CMD="$CMD -- $VERBOSE"
    echo "📝 Verbose output enabled"
fi

echo ""
echo "Running: $CMD"
echo "─────────────────────────────────────────"
echo ""

# Run tests
$CMD

echo ""
echo "─────────────────────────────────────────"
echo "✅ All tests passed!"
