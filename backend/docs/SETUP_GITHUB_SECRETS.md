# GitHub Secrets Setup Guide

This guide explains how to configure GitHub repository secrets for CI/CD deployment to staging and production servers.

## Overview

The project uses **two environments**:
- **STAGING**: `89.23.99.74` (develop branch)
- **PRODUCTION**: `193.233.102.193` (main branch)

Each environment requires its own set of secrets for automated deployment.

---

## Prerequisites

Before setting up secrets, ensure:

1. ✅ Staging server (`89.23.99.74`) is configured using `scripts/setup-staging-server.sh`
2. ✅ Production server (`193.233.102.193`) is already configured
3. ✅ SSH keys are generated for GitHub Actions access

---

## Step 1: Generate SSH Keys

Generate separate SSH key pairs for each environment:

### For Staging

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions-staging" -f ~/.ssh/github_staging

# This creates:
# - ~/.ssh/github_staging (private key)
# - ~/.ssh/github_staging.pub (public key)
```

### For Production

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions-production" -f ~/.ssh/github_production

# This creates:
# - ~/.ssh/github_production (private key)
# - ~/.ssh/github_production.pub (public key)
```

---

## Step 2: Add Public Keys to Servers

### Staging Server

```bash
# Copy public key to staging server
cat ~/.ssh/github_staging.pub | ssh root@89.23.99.74 'cat >> /home/deploy/.ssh/authorized_keys'

# Verify connection
ssh -i ~/.ssh/github_staging deploy@89.23.99.74
```

### Production Server

```bash
# Copy public key to production server
cat ~/.ssh/github_production.pub | ssh root@193.233.102.193 'cat >> /home/deploy/.ssh/authorized_keys'

# Verify connection
ssh -i ~/.ssh/github_production deploy@193.233.102.193
```

---

## Step 3: Add Secrets to GitHub Repository

Go to your GitHub repository:
**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### Staging Secrets

| Secret Name | Value | Description |
|------------|-------|-------------|
| `STAGING_HOST` | `89.23.99.74` | Staging server IP address |
| `STAGING_USER` | `deploy` | SSH username on staging server |
| `STAGING_SSH_KEY` | `<content of ~/.ssh/github_staging>` | **Private** SSH key for staging (entire file content) |
| `STAGING_PATH` | `/home/deploy/actionable-sentiment-backend` | Deployment directory on staging server |

### Production Secrets

| Secret Name | Value | Description |
|------------|-------|-------------|
| `DEPLOY_HOST` | `193.233.102.193` | Production server IP address |
| `DEPLOY_USER` | `deploy` | SSH username on production server |
| `DEPLOY_SSH_KEY` | `<content of ~/.ssh/github_production>` | **Private** SSH key for production (entire file content) |
| `DEPLOY_PATH` | `/home/deploy/actionable-sentiment-backend` | Deployment directory on production server |

⚠️ **IMPORTANT**: When copying SSH private key content, include everything from `-----BEGIN OPENSSH PRIVATE KEY-----` to `-----END OPENSSH PRIVATE KEY-----`

---

## Step 4: How to Add a Secret in GitHub UI

1. Navigate to your repository on GitHub
2. Click **Settings** (top menu)
3. In left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret** button
5. Enter **Name** (e.g., `STAGING_HOST`)
6. Enter **Secret** value
7. Click **Add secret**
8. Repeat for each secret

### Example: Adding STAGING_SSH_KEY

```bash
# Display private key content
cat ~/.ssh/github_staging

# Copy entire output including:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ... key content ...
# -----END OPENSSH PRIVATE KEY-----
```

Paste this entire content as the value for `STAGING_SSH_KEY` secret.

---

## Step 5: Verify Secrets Configuration

After adding all secrets, you should have **8 secrets** in total:

**Staging (4 secrets):**
- ✅ STAGING_HOST
- ✅ STAGING_USER
- ✅ STAGING_SSH_KEY
- ✅ STAGING_PATH

**Production (4 secrets):**
- ✅ DEPLOY_HOST
- ✅ DEPLOY_USER
- ✅ DEPLOY_SSH_KEY
- ✅ DEPLOY_PATH

---

## Step 6: Test Deployment Workflows

### Test Staging Deployment

```bash
# Push to develop branch
git checkout develop
git push origin develop

# Check GitHub Actions tab for workflow execution
# Workflow: "Build and Deploy to Staging"
# Should deploy to 89.23.99.74
```

### Test Production Deployment

```bash
# Push to main branch (after testing on staging)
git checkout main
git merge develop
git push origin main

# Check GitHub Actions tab for workflow execution
# Workflow: "Build and Deploy to Production"
# Should deploy to 193.233.102.193
```

---

## Troubleshooting

### SSH Connection Failed

**Error:** `Permission denied (publickey)`

**Solution:**
```bash
# Check authorized_keys on server
ssh root@<SERVER_IP>
cat /home/deploy/.ssh/authorized_keys

# Verify permissions
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
```

### Workflow Fails at Deployment Step

**Check:**
1. Secret names match exactly (case-sensitive)
2. SSH key includes full content with headers/footers
3. Server is accessible from GitHub Actions runners
4. Firewall allows SSH connections (port 22)

### Docker Login Failed

**Error:** `denied: permission_denied`

**Solution:**
Ensure `GITHUB_TOKEN` has package write permissions:
1. GitHub repo → Settings → Actions → General
2. Scroll to "Workflow permissions"
3. Select "Read and write permissions"
4. Save

---

## Security Best Practices

✅ **DO:**
- Use separate SSH keys for staging and production
- Rotate SSH keys periodically (every 90 days)
- Use ed25519 keys (more secure than RSA)
- Never commit private keys to repository
- Restrict SSH key usage to specific IP ranges if possible

❌ **DON'T:**
- Share SSH keys between environments
- Use same keys for multiple projects
- Store secrets in code or configuration files
- Give SSH keys sudo access without restrictions

---

## Additional Resources

- [GitHub Actions Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [SSH Key Best Practices](https://www.ssh.com/academy/ssh/keygen)
- [Docker Registry Authentication](https://docs.docker.com/registry/authentication/)

---

## Quick Reference Commands

```bash
# View staging server status
ssh -i ~/.ssh/github_staging deploy@89.23.99.74 'docker compose -f ~/actionable-sentiment-backend/docker-compose.staging.yml ps'

# View production server status
ssh -i ~/.ssh/github_production deploy@193.233.102.193 'docker compose -f ~/actionable-sentiment-backend/docker-compose.yml ps'

# View staging logs
ssh -i ~/.ssh/github_staging deploy@89.23.99.74 'docker compose -f ~/actionable-sentiment-backend/docker-compose.staging.yml logs -f api'

# View production logs
ssh -i ~/.ssh/github_production deploy@193.233.102.193 'docker compose -f ~/actionable-sentiment-backend/docker-compose.yml logs -f api'
```

---

## Need Help?

If you encounter issues:
1. Check GitHub Actions workflow logs
2. SSH to server and check Docker logs
3. Verify all secrets are set correctly
4. Test SSH connection manually
5. Review firewall rules on server

For more details, see:
- `CLAUDE.md` - Development workflow
- `scripts/setup-staging-server.sh` - Server setup script
- `.github/workflows/deploy-staging.yml` - Staging CI/CD
- `.github/workflows/deploy.yml` - Production CI/CD
