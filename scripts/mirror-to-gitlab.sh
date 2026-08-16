#!/usr/bin/env bash
# ==============================================================================
# mirror-to-gitlab.sh
# 
# Automatically creates (if needed), signs, and mirrors the current Git repository
# to a matching GitLab repository on gitlab.com using glab / git with GPG verification.
#
# Usage:
#   ./scripts/mirror-to-gitlab.sh [gitlab-username/repo]
#
# Examples:
#   ./scripts/mirror-to-gitlab.sh
#   ./scripts/mirror-to-gitlab.sh shaileshpatel17/mcp-httpserver-proxy
# ==============================================================================

set -euo pipefail

GITLAB_USER="${1:-shaileshpatel17}"

# Infer repository name from git remote or folder
REPO_NAME=$(basename -s .git "$(git config --get remote.origin.url 2>/dev/null || pwd)")

if [[ "${GITLAB_USER}" == *"/"* ]]; then
  FULL_TARGET="${GITLAB_USER}"
else
  FULL_TARGET="${GITLAB_USER}/${REPO_NAME}"
fi

echo "================================================================="
echo "🦊 Mirroring Repository to GitLab: ${FULL_TARGET}"
echo "================================================================="

# Create repository on GitLab only if it doesn't exist yet (via glab)
if command -v glab &>/dev/null; then
  if ! glab repo view "${FULL_TARGET}" &>/dev/null; then
    echo "🔍 Creating repository on GitLab: ${FULL_TARGET}..."
    glab repo create "${FULL_TARGET}" --public || true
    # Ensure allow_force_push is enabled for mirrored repo
    glab api --method PATCH "projects/${FULL_TARGET//\//%2F}/protected_branches/main" --field allow_force_push=true 2>/dev/null || true
  else
    echo "✔ Repository already exists on GitLab: ${FULL_TARGET}"
  fi
fi

# Configure gitlab remote
GITLAB_SSH_URL="git@gitlab.com:${FULL_TARGET}.git"

if git remote | grep -q "^gitlab$"; then
  echo "⚙️ Updating existing 'gitlab' remote URL..."
  git remote set-url gitlab "${GITLAB_SSH_URL}"
else
  echo "⚙️ Adding 'gitlab' remote..."
  git remote add gitlab "${GITLAB_SSH_URL}"
fi

# Re-sign head commit with personal GPG key for GitLab verification
echo "✍️ Signing head commit with GPG key for GitLab verification..."
SIGNED_COMMIT=$(git commit-tree HEAD^{tree} -p HEAD^ -S -m "$(git log -1 --pretty=%B)" 2>/dev/null || echo "")

if [[ -n "${SIGNED_COMMIT}" ]]; then
  echo "🚀 Pushing signed commit to GitLab main..."
  git push gitlab "${SIGNED_COMMIT}:refs/heads/main" --force
else
  echo "🚀 Pushing main branch to GitLab..."
  git push gitlab main:main --force
fi

git push gitlab --tags --force

echo ""
echo "================================================================="
echo "🎉 SUCCESS: Mirror is live & verified at: https://gitlab.com/${FULL_TARGET}"
echo "================================================================="
