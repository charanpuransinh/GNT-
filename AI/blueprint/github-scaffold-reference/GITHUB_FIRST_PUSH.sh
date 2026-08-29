#!/usr/bin/env bash
set -euo pipefail

# Run from the repository root after copying this scaffold into your local GNT directory.

git init
git branch -M main

# Optional: connect your GitHub repository.
# Replace OWNER/REPO with the actual GitHub repository.
git remote add origin https://github.com/OWNER/REPO.git

git add .
git status

git commit -m "chore: initialize GNT repository architecture scaffold"
git push -u origin main
