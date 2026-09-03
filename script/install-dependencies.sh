#!/usr/bin/env bash
set -euo pipefail

echo "Installing MAD dependencies..."

forge install --no-git foundry-rs/forge-std@v1.16.2
forge install --no-git OpenZeppelin/openzeppelin-contracts@v5.7.0

echo "MAD dependencies installed."
