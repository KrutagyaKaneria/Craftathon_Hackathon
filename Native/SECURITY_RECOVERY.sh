#!/bin/bash
# Security Recovery Script for DriveGuard

echo "🔒 DriveGuard Security Recovery"
echo "================================"

# Check if exposed credentials exist
echo "Checking for exposed credentials..."

# Check git log for commits containing credentials
echo ""
echo "1. Check git history for MongoDB credentials:"
git log --all --source --remotes -S "arjundivraniyacg_db_user" -- || echo "No exposed credentials found in git history"

echo ""
echo "2. Check current files for exposed credentials:"
grep -r "NS1zvZ8zPAVbJU9h" . --exclude-dir=node_modules --exclude-dir=.git || echo "No exposed credentials in current files"

echo ""
echo "⚠️  IMMEDIATE ACTIONS REQUIRED:"
echo "1. CHANGE YOUR MONGODB ATLAS PASSWORD IMMEDIATELY"
echo "   - Go to: https://cloud.mongodb.com/v2"
echo "   - Navigate to Database Access"
echo "   - Edit the exposed user and set a new password"
echo ""
echo "2. Generate new JWT secrets in .env:"
echo "   JWT_SECRET=$(openssl rand -hex 32)"
echo "   JWT_REFRESH_SECRET=$(openssl rand -hex 32)"
echo ""
echo "3. Force push to remove history (if already committed):"
echo "   git push --force origin main"
echo ""
echo "4. Use git-filter-branch or BFG to remove from history:"
echo "   bfg --replace-text passwords.txt"
echo ""
echo "✅ Files updated:"
echo "   - .env.example: Credentials replaced with placeholders"
echo "   - .gitignore: Enhanced with security rules"
echo "   - safeStorage.ts: Added memory fallback for AsyncStorage"
