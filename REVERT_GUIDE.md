# Revert Guide

If a merge to `main` causes problems, you can revert it safely. This guide explains how.

## Latest merge (Mar 2025)

**Merge commit:** `d536b1b` — *Merge branch 'langchain-setup': outline loading, memory fixes, scrap chapter*

## How to revert this merge

```bash
# 1. Make sure you're on main and it's clean
git checkout main
git pull origin main

# 2. Revert the merge (undoes all changes from langchain-setup merge)
git revert -m 1 d536b1b --no-edit

# 3. Push the revert
git push origin main
```

`-m 1` tells Git to keep the first parent (main) and undo the second parent (langchain-setup). The revert creates a new commit that reverses the merge.

## Future merges

When merging any branch into `main`:

1. **Use `--no-ff`** so you get a merge commit:
   ```bash
   git merge <branch> --no-ff -m "Merge branch '<branch>': <description>"
   ```

2. **Revert any merge** using the merge commit hash:
   ```bash
   git revert -m 1 <merge_commit_hash> --no-edit
   ```

3. **Re-apply later:** If you revert and later want the changes back, merge the branch again. Git will replay the commits; or `git revert` the revert commit.
