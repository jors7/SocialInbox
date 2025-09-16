#!/bin/bash

# GitHub Repository Setup Script
# This script helps set up your GitHub repository with proper configuration

set -e

echo "🐙 SocialInbox GitHub Setup"
echo "==========================="
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git not found. Please install git first."
    exit 1
fi

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "⚠️  GitHub CLI (gh) not found."
    echo "   Install with: brew install gh"
    echo "   Or visit: https://cli.github.com/"
    echo ""
    echo "Continuing with git commands only..."
    GH_AVAILABLE=false
else
    GH_AVAILABLE=true
fi

# Function to read input with default value
read_with_default() {
    local prompt="$1"
    local default="$2"
    local input
    
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " input
        echo "${input:-$default}"
    else
        read -p "$prompt: " input
        echo "$input"
    fi
}

# Check if we're in the project root
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Initialize git repository if needed
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already initialized"
fi

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    echo "📝 Creating .gitignore..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output/

# Next.js
.next/
out/
build/
dist/

# Production
build/

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
.pnpm-debug.log*

# Local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Turbo
.turbo

# Supabase
supabase/.branches
supabase/.temp
.env.local

# IDE
.idea/
.vscode/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
EOF
    echo "✅ Created .gitignore"
fi

# Create GitHub Actions workflow
echo ""
echo "🔧 Setting up GitHub Actions..."
mkdir -p .github/workflows

cat > .github/workflows/ci.yml << 'EOF'
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-type-check:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npm run type-check

  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
        env:
          CI: true

  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build project
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
EOF

cat > .github/workflows/deploy-preview.yml << 'EOF'
name: Vercel Preview Deployment

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

on:
  push:
    branches-ignore:
      - main

jobs:
  deploy-preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      
      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Build Project Artifacts
        run: vercel build --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Deploy Project Artifacts to Vercel
        run: vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }}
EOF

cat > .github/workflows/deploy-production.yml << 'EOF'
name: Vercel Production Deployment

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

on:
  push:
    branches:
      - main

jobs:
  deploy-production:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      
      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Build Project Artifacts
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Deploy Project Artifacts to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
EOF

echo "✅ GitHub Actions workflows created"

# Create GitHub issue templates
echo ""
echo "📋 Creating issue templates..."
mkdir -p .github/ISSUE_TEMPLATE

cat > .github/ISSUE_TEMPLATE/bug_report.md << 'EOF'
---
name: Bug report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
 - OS: [e.g. macOS]
 - Browser: [e.g. chrome, safari]
 - Version: [e.g. 22]

**Additional context**
Add any other context about the problem here.
EOF

cat > .github/ISSUE_TEMPLATE/feature_request.md << 'EOF'
---
name: Feature request
about: Suggest an idea for this project
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
EOF

echo "✅ Issue templates created"

# Create pull request template
cat > .github/pull_request_template.md << 'EOF'
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?
Please describe the tests that you ran to verify your changes.

## Checklist:
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
EOF

echo "✅ Pull request template created"

# Stage all files
echo ""
echo "📝 Staging files..."
git add .

# Create initial commit
echo ""
read -p "Create initial commit? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    git commit -m "Initial commit: SocialInbox - Instagram DM Automation Platform

- Complete authentication system with Supabase Auth
- Visual flow builder with React Flow
- Instagram OAuth integration
- Real-time messaging with Supabase Realtime
- Message templates with variable support
- Broadcast campaigns with A/B testing
- Analytics dashboard
- Queue system for message processing
- Rich media support

Built with Next.js 14, TypeScript, Supabase, and Tailwind CSS"
    echo "✅ Initial commit created"
fi

# Create and setup remote repository
if [ "$GH_AVAILABLE" = true ]; then
    echo ""
    echo "🌐 Setting up GitHub repository..."
    
    # Check if user is authenticated
    if gh auth status &> /dev/null; then
        read -p "Create GitHub repository? (y/n): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            REPO_NAME=$(read_with_default "Repository name" "socialinbox")
            REPO_VISIBILITY=$(read_with_default "Repository visibility (public/private)" "private")
            
            # Create repository
            gh repo create "$REPO_NAME" --$REPO_VISIBILITY --description "Instagram DM Automation Platform - Similar to ManyChat" --source=.
            
            # Push code
            git branch -M main
            git push -u origin main
            
            echo "✅ GitHub repository created and code pushed"
            
            # Set up repository secrets
            echo ""
            echo "🔐 Setting up repository secrets..."
            echo "You'll need to add these secrets to your GitHub repository:"
            echo "  - VERCEL_TOKEN"
            echo "  - VERCEL_ORG_ID" 
            echo "  - VERCEL_PROJECT_ID"
            echo "  - NEXT_PUBLIC_SUPABASE_URL"
            echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
            echo ""
            echo "Add them at: https://github.com/$(gh api user --jq .login)/$REPO_NAME/settings/secrets/actions"
        fi
    else
        echo "⚠️  Not authenticated with GitHub CLI."
        echo "   Run: gh auth login"
        echo ""
        echo "📝 Manual steps:"
        echo "1. Create a new repository on GitHub"
        echo "2. Run: git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git"
        echo "3. Run: git branch -M main"
        echo "4. Run: git push -u origin main"
    fi
else
    echo ""
    echo "📝 Manual GitHub setup required:"
    echo "1. Create a new repository on GitHub"
    echo "2. Run: git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git"
    echo "3. Run: git branch -M main"
    echo "4. Run: git push -u origin main"
fi

# Create backup script
cat > scripts/backup-to-github.sh << 'EOF'
#!/bin/bash

# Automated GitHub Backup Script

set -e

echo "📦 Backing up to GitHub..."

# Check for uncommitted changes
if [[ $(git status --porcelain) ]]; then
    echo "📝 Uncommitted changes found. Creating backup commit..."
    
    # Stage all changes
    git add .
    
    # Create commit with timestamp
    TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
    git commit -m "Backup: $TIMESTAMP

Automated backup of current work"
    
    echo "✅ Changes committed"
else
    echo "✅ No changes to commit"
fi

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push origin main

echo "✅ Backup complete!"
EOF

chmod +x scripts/backup-to-github.sh
echo "✅ Created backup script: scripts/backup-to-github.sh"

echo ""
echo "✅ GitHub setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Add repository secrets in GitHub settings"
echo "2. Run './scripts/backup-to-github.sh' to backup your work"
echo "3. Set up branch protection rules for main branch"
echo "4. Invite collaborators if needed"