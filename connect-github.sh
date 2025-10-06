#!/bin/bash

# Script to connect your local Git repo to GitHub
# Usage: ./connect-github.sh yourusername

if [ -z "$1" ]; then
  echo "❌ Please provide your GitHub username"
  echo "Usage: ./connect-github.sh yourusername"
  exit 1
fi

USERNAME=$1
REPO_NAME="glimmr"

echo "🔗 Connecting to GitHub..."

# Add GitHub remote
git remote add origin https://github.com/$USERNAME/$REPO_NAME.git

# Verify remote was added
git remote -v

echo "✅ Remote origin added!"
echo ""
echo "🚀 Now push your code to GitHub:"
echo "   git push -u origin main"
echo ""
echo "💡 Don't forget to:"
echo "1. Create the repository on GitHub first (github.com/new)"
echo "2. Add your API keys to GitHub Secrets for CI/CD:"
echo "   - OPENAI_API_KEY"
echo "   - ANTHROPIC_API_KEY"
echo "   - MONGODB_URI (for production)"
