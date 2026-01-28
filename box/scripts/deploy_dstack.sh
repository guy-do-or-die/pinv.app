#!/bin/bash
set -e

# Resolve script directory and move to 'box' root
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
cd "$SCRIPT_DIR/.."

echo "📂 Working directory: $(pwd)"

# Activate virtual environment if present
if [ -f ".venv/bin/activate" ]; then
    echo "🔌 Activating local .venv..."
    source .venv/bin/activate
else
    echo "⚠️  No .venv found, assuming system dstack/python..."
fi

# Check for dstack
if ! command -v dstack &> /dev/null; then
    echo "❌ dstack CLI not found. Please install it or check your venv."
    exit 1
fi

# Check if any project is configured
if [ -z "$(dstack project list --format plain | grep -v 'PROJECT')" ]; then
    echo "⚠️  No dstack project configured."
    echo "ℹ️  To deploy to Phala (or any TEE provider), you must add a project."
    echo "👉 Run: dstack project add --name phala --url <PHALA_OR_DSTACK_URL> --token <TOKEN>"
    echo "   (See dstack documentation for your specific provider's endpoint)"
    exit 1
fi

# Deploy
echo "🚀 Deploying PinV Box..."
dstack apply -f dstack.yml

echo "🎉 Deployment command finished."
