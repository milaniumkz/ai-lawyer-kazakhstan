# GitHub Private Repository Setup

## Goal

Host this project in a private GitHub repository so Codex online can edit, run checks and prepare builds from any device.

## Do Not Commit Secrets

Do not store server passwords, SSH private keys, Apple API keys, OpenAI keys, `.env` files, certificates or Android/iOS signing keys as repository files.

Use GitHub Actions/Codex secrets instead:

- `OPENAI_API_KEY`
- `PUBLIC_SERVER_URL`
- `SERVER_HOST`
- `SERVER_USER`
- `SERVER_SSH_PORT`
- `SERVER_SSH_PRIVATE_KEY`
- `SERVER_APP_ROOT`
- `ASC_KEY_ID`
- `ASC_ISSUER_ID`
- `ASC_PRIVATE_KEY`
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEY_PROPERTIES`

Keep non-secret placeholders in `.env.example`.

## Recommended Repository

- Name: `ai-lawyer-kazakhstan`
- Visibility: private
- Default branch: `main`

## Create And Push

After GitHub authentication is available locally:

```bash
gh repo create ai-lawyer-kazakhstan --private --source=. --remote=origin --push
```

If the repository already exists:

```bash
git remote add origin git@github.com:<owner>/ai-lawyer-kazakhstan.git
git push -u origin main
```

## Server Access

Use SSH keys, not the root password:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/ai-lawyer-kz-deploy -C ai-lawyer-kz-deploy
ssh-copy-id -i ~/.ssh/ai-lawyer-kz-deploy.pub root@89.207.250.217
```

Then save the private key value in GitHub secret `SERVER_SSH_PRIVATE_KEY`.

## Codex Online

Connect the private GitHub repository in Codex online and expose only the required secrets to the workspace. Codex should clone the repository and run the existing gates:

```bash
npm ci
npm run check
npm run build
```

Flutter builds use:

```bash
/Volumes/PD1000/job/flutter/bin/flutter analyze apps/mobile
/Volumes/PD1000/job/flutter/bin/flutter test apps/mobile
```
