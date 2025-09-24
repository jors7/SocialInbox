#!/bin/bash

echo "🚀 Push to GitHub Helper"
echo "======================="
echo ""
echo "This script will help you push your code to GitHub."
echo "Make sure you've already created the repository on GitHub!"
echo ""

# Get GitHub username
read -p "Enter your GitHub username: " USERNAME
read -p "Enter your repository name [socialinbox]: " REPO_NAME
REPO_NAME=${REPO_NAME:-socialinbox}

echo ""
echo "📦 Adding remote repository..."
git remote add origin "https://github.com/$USERNAME/$REPO_NAME.git"

echo "🔗 Remote added. Pushing code..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Success! Your code is now on GitHub!"
    echo "🌐 Visit: https://github.com/$USERNAME/$REPO_NAME"
    echo ""
    echo "📋 Next steps:"
    echo "1. Add repository secrets for deployment"
    echo "2. Set up branch protection rules (optional)"
    echo "3. Configure Vercel deployment"
else
    echo ""
    echo "❌ Push failed. Common issues:"
    echo "1. Repository doesn't exist on GitHub yet"
    echo "2. Authentication required - you may need to set up a personal access token"
    echo "3. Repository name mismatch"
    echo ""
    echo "To set up authentication:"
    echo "- Create a personal access token: https://github.com/settings/tokens"
    echo "- Use the token as your password when prompted"
fi