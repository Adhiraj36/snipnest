#!/bin/bash
# ─────────────────────────────────────────────────────────────────────
# cleanup-secrets.sh — Remove secrets from git tracking & history
# Run this from the repo root BEFORE making the repo public.
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

echo "=== Step 1: Remove .env files from git index (keep on disk) ==="
git rm --cached apps/backend/.env apps/web/.env 2>/dev/null || echo "  (already untracked or not found)"

echo ""
echo "=== Step 2: Commit current changes ==="
git add -A
git commit -m "chore: secure secrets — move to .env, update .gitignore, add .env.example" || echo "  (nothing to commit)"

echo ""
echo "=== Step 3: Install git-filter-repo (if not present) ==="
if ! command -v git-filter-repo &> /dev/null; then
    echo "  Installing git-filter-repo via pip..."
    pip install git-filter-repo || pip3 install git-filter-repo
fi

echo ""
echo "=== Step 4: Scrub secrets from ALL git history ==="
echo "  This rewrites history — you'll need to force-push after this."
echo ""

# Create a file with expressions to replace in history
cat > /tmp/snipnest-replacements.txt << 'REPLACEMENTS'
# Together AI key
tgp_v1_C6YM2YccdGYYtcYMa7rAT00R_e-rzvrBdWj6Bey2vmg==>REDACTED_TOGETHER_KEY
# RapidAPI key
1b9ba05edemshf4b92bfcfcd304bp159d98jsn7a3b6ab0d8ac==>REDACTED_RAPIDAPI_KEY
# Database URL password
AVNS_aFCMFNKqiGKJZ5buU4P==>REDACTED_DB_PASSWORD
# Full database URL
postgres://avnadmin:AVNS_aFCMFNKqiGKJZ5buU4P@pg-6ac5cdd-adhirajdd20-1954.i.aivencloud.com:23264/defaultdb?sslmode=require==>REDACTED_DATABASE_URL
# JWT Secret
APple_banana_3141592653589793_one_ppiece==>REDACTED_JWT_SECRET
# Clerk backend secret key
sk_test_DAo7YyUM6rZQd13KuyiZ1iieSPhGVpiIXzfG7hobSN==>REDACTED_CLERK_BACKEND_KEY
# Clerk web secret key
sk_test_NYjcxOq41SzKXJzMubBhq3nuQ8hlWKBejLMoOAYjDl==>REDACTED_CLERK_WEB_KEY
# Clerk publishable key (not truly secret, but good practice)
pk_test_c3VidGxlLW1hbnRpcy00My5jbGVyay5hY2NvdW50cy5kZXYk==>REDACTED_CLERK_PK
# HeyGen API key
7fbef4c3-1406-11f1-a99e-066a7fa2e369==>REDACTED_HEYGEN_KEY
# HeyGen Avatar ID
dd73ea75-1218-4ef3-92ce-606d5f7fbc0a==>REDACTED_HEYGEN_AVATAR
# HeyGen Voice ID
c2527536-6d1f-4412-a643-53a3497dada9==>REDACTED_HEYGEN_VOICE
# HeyGen Context ID
5b9dba8a-aa31-11f0-a6ee-066a7fa2e369==>REDACTED_HEYGEN_CONTEXT
# Tailscale/Private IP
100.110.74.54==>REDACTED_IP
REPLACEMENTS

git filter-repo --replace-text /tmp/snipnest-replacements.txt --force

echo ""
echo "=== Step 5: Clean up ==="
rm -f /tmp/snipnest-replacements.txt

echo ""
echo "══════════════════════════════════════════════════════════════"
echo "  DONE! History has been rewritten."
echo ""
echo "  Next steps:"
echo "  1. Verify with: git log --all -p | grep -i 'tgp_v1\|sk_test\|AVNS_\|APple_banana\|rapidapi'"
echo "     (should return nothing)"
echo ""
echo "  2. Set the new remote (if needed):"
echo "     git remote add origin <your-github-url>"
echo ""
echo "  3. Force push:"
echo "     git push --force --all"
echo "     git push --force --tags"
echo ""
echo "  4. ROTATE ALL SECRETS (old ones are compromised):"
echo "     - Clerk: dashboard.clerk.com → API Keys"
echo "     - Together AI: api.together.xyz → Settings"
echo "     - RapidAPI: rapidapi.com → Dashboard → Security"
echo "     - Aiven DB: console.aiven.io → Change password"
echo "     - HeyGen: app.heygen.com → Settings → API"
echo "     - JWT Secret: generate a new random string"
echo "══════════════════════════════════════════════════════════════"
