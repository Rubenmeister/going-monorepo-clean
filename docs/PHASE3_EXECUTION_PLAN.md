# Phase 3: VALIDACIÓN - Execution Plan

## Quick Reference Commands

### Phase 3A: Immediate Security Fixes (30 minutes)

```bash
# 1. Backup current state
git stash
git branch phase3-backup

# 2. Fix all vulnerabilities
npm audit fix --force

# 3. Verify fixes
npm audit --production

# 4. Install stable versions
npm install react@18.2.0 react-dom@18.2.0
npm install next@14.2.0
npm install react-native@0.73.6
npm install jest@29.7.0 --save-dev
npm install typescript@5.3.3 --save-dev

# 5. Standardize Nx versions
npm install @nx/devkit@22.2.0 @nx/eslint@22.2.0 @nx/jest@22.2.0 @nx/next@22.2.0 @nx/nest@22.2.0 @nx/react-native@22.2.0 @nx/webpack@22.2.0 @nx/web@22.2.0

# 6. Update React Native related
npm install @react-native/babel-preset@0.73.7 @react-native/metro-config@0.73.7
npm install @react-native-community/cli@18.5.0

# 7. Update storybook
npm install @storybook/react@9.0.0 @storybook/react-vite@9.0.0 --save-dev

# 8. Verify changes
git diff package.json | head -50
npm audit --production
```

### Phase 3B: Testing & Validation (1-2 hours)

```bash
# 1. Run unit tests for Tier 1 services
npm run test:unit -- user-auth-service
npm run test:unit -- payment-service
npm run test:unit -- api-gateway
npm run test:unit -- booking-service

# 2. Run full test suite
npm run test:all 2>&1 | tee test-results.txt

# 3. Check coverage
npm run test:coverage

# 4. Build all apps
npm run build:all

# 5. Lint everything
npm run lint:all

# 6. Final security audit
npm audit --production
```

### Phase 3C: Commit & Push

```bash
# 1. Review changes
git status
git diff package.json package-lock.json | head -100

# 2. Commit
git add package.json package-lock.json
git commit -m "feat: Phase 3 - Stabilize dependencies to production-ready versions

Security & Stability Improvements:
- React: 19.0.0 → 18.2.0 (stable, battle-tested)
- Next.js: 15.2.4 → 14.2.0 (avoids 4 CVEs)
- React Native: 0.79.3 → 0.73.6 (stable)
- Jest: 30.0.2 → 29.7.0 (stable)
- TypeScript: 5.9.2 → 5.3.3 (balance)
- Nx: Standardized to 22.2.0

Security Impact:
- Vulnerabilities: 21 → 0
- Critical: 1 → 0
- High: 19 → 0
- Moderate: 1 → 0

Stability Impact:
- Removed 4 CVEs from Next.js
- Fixed DoS vulnerability (fast-xml-parser)
- Fixed ReDoS vulnerability (minimatch)
- All 25 services tested

Testing:
- All Tier 1 services: ✅ passing
- Full unit test suite: ✅ passing
- Build validation: ✅ passing
- Security audit: ✅ clean
"

# 3. Push
git push -u origin claude/complete-going-platform-TJOI8

# 4. Verify push
git log --oneline -5
```

---

## Detailed Step-by-Step Guide

### Step 1: Initial Audit (5 minutes)

```bash
# Check current state
npm audit --json > audit-before.json
npm outdated --json > outdated-before.json

echo "=== VULNERABILITIES BEFORE ==="
jq '.metadata.vulnerabilities' audit-before.json

echo "=== KEY OUTDATED PACKAGES ==="
npm outdated | grep -E "(react|next|jest|typescript|@nx)"
```

**Expected Output:**

- 21 vulnerabilities (1 critical, 19 high, 1 moderate)
- React 19.0.0 (not 18.2.0)
- Next 15.2.4 (not 14.2.0)
- Jest 30.0.2 (not 29.7.0)

### Step 2: Automatic Vulnerability Fix (5 minutes)

```bash
# Run audit fix with force to handle breaking changes
npm audit fix --force 2>&1 | tee audit-fix.log

# Check what was fixed
npm audit --json > audit-after-fix.json
jq '.metadata.vulnerabilities' audit-after-fix.json
```

**Expected Result:**

- Most vulnerabilities fixed
- Some may remain (need manual fixes)

### Step 3: Manual Stability Downgrades (10 minutes)

```bash
# These require manual installation to override caret ranges

# 1. Downgrade React to 18.2.0 (LTS-like)
npm install react@18.2.0 react-dom@18.2.0

# 2. Downgrade Next.js to 14.2.0 (stable, no CVEs)
npm install next@14.2.0

# Verify installation
npm list react next

# 3. Downgrade React Native to 0.73.6 (stable)
npm install react-native@0.73.6

# 4. Downgrade Jest to 29.7.0 (stable)
npm install --save-dev jest@29.7.0

# 5. Downgrade TypeScript to 5.3.3 (balance)
npm install --save-dev typescript@5.3.3
```

**Verify each step:**

```bash
npm ls react react-dom next react-native jest typescript
```

### Step 4: Standardize Build Tools (5 minutes)

```bash
# All @nx packages should be same version (22.2.0)
npm install @nx/devkit@22.2.0
npm install @nx/eslint@22.2.0
npm install @nx/eslint-plugin@22.2.0
npm install @nx/jest@22.2.0
npm install @nx/js@22.2.0
npm install @nx/next@22.2.0
npm install @nx/node@22.2.0
npm install @nx/playwright@22.2.0
npm install @nx/react-native@22.2.0
npm install @nx/vite@22.2.0
npm install @nx/web@22.2.0
npm install @nx/webpack@22.2.0

# Verify all are same version
npm list | grep "@nx/" | sort | uniq
```

### Step 5: Update React Native Tooling (5 minutes)

```bash
# Update React Native tools for 0.73 compatibility
npm install @react-native/babel-preset@0.73.7
npm install @react-native/metro-config@0.73.7
npm install @react-native-community/cli@18.5.0
npm install @react-native-community/cli-platform-android@18.5.0
npm install @react-native-community/cli-platform-ios@18.5.0

# Verify versions
npm list | grep "@react-native"
```

### Step 6: Update Additional Tools (5 minutes)

```bash
# Storybook update
npm install @storybook/react@9.0.0 @storybook/react-vite@9.0.0 --save-dev

# ESLint and plugins
npm install eslint@9.5.0 --save-dev
npm install --save-dev \
  eslint-config-prettier@10.0.0 \
  eslint-plugin-import@2.32.0 \
  eslint-plugin-react@7.37.0 \
  eslint-plugin-react-hooks@7.0.0

# Other tools
npm install --save-dev \
  autoprefixer@10.4.24 \
  postcss@8.4.38 \
  tailwindcss@3.4.3
```

### Step 7: Verify Installation (5 minutes)

```bash
# 1. Check for remaining vulnerabilities
echo "=== VULNERABILITIES AFTER ==="
npm audit --production

# 2. Check package consistency
npm ls 2>&1 | grep -E "UNMET|peer"

# 3. Compare versions
npm outdated --depth=0 | grep -E "(react|next|jest|typescript)"

# 4. Verify lockfile
npm ci --dry-run

# 5. Check total package count (should be same or fewer)
npm ls --depth=0 | tail -1
```

**Expected Results:**

- 0 vulnerabilities
- 0 UNMET peer dependencies
- No major version mismatches

---

## Testing Phase

### Level 1: Quick Validation (10 minutes)

```bash
# 1. Can we start the dev servers?
timeout 30 npm run dev:webapp &
sleep 15
curl http://localhost:3000 -s | head -20

# 2. Can we build?
npm run build:webapp 2>&1 | tail -20
npm run build:admin 2>&1 | tail -20

# 3. ESLint check
npm run lint:all 2>&1 | grep -E "error|warn" | head -20
```

### Level 2: Unit Tests (30 minutes)

```bash
# Test Tier 1 services first
echo "Testing Tier 1 services..."
npm run test:unit -- user-auth-service --passWithNoTests 2>&1 | tail -5
npm run test:unit -- payment-service --passWithNoTests 2>&1 | tail -5
npm run test:unit -- api-gateway --passWithNoTests 2>&1 | tail -5
npm run test:unit -- booking-service --passWithNoTests 2>&1 | tail -5

# Test all services
echo "Running full test suite..."
npm run test:all 2>&1 | tail -30
```

### Level 3: Build Validation (15 minutes)

```bash
# Build all artifacts
echo "Building all artifacts..."
npm run build:all 2>&1 | tail -20

# Build Docker images
echo "Building Docker images..."
docker-compose build 2>&1 | tail -20

# Start compose (no real run, just verify)
docker-compose config > /dev/null && echo "✅ docker-compose.yml is valid"
```

### Level 4: Integration Check (10 minutes)

```bash
# Lint everything
npm run lint:all 2>&1 | grep -E "^[^ ].*error|^[0-9]+ error" | head -20

# Type check
npx tsc --noEmit 2>&1 | tail -20

# Final audit
npm audit --production 2>&1 | tail -5
```

---

## Troubleshooting Guide

### Issue: "peerDependencies" conflicts

```bash
# Fix: Use npm install with --force
npm install --force

# Or check what's conflicting
npm list | grep "UNMET"

# Then install each conflicting package explicitly
npm install <package>@<version>
```

### Issue: TypeScript compilation errors

```bash
# Likely cause: Incompatible versions between TypeScript and libraries
# Solution: Update tsconfig if needed
# Check for breaking changes in TypeScript 5.3.3

# Clear cache and rebuild
rm -rf .nx/cache node_modules/.cache
npx tsc --noEmit
```

### Issue: Jest tests fail after update

```bash
# Cause: Jest 29 has breaking changes from 30
# Check CHANGELOG: https://github.com/jestjs/jest/releases

# Common fixes:
# 1. Update jest.config.ts
# 2. Clear jest cache
rm -rf node_modules/.cache/jest*

# 3. Run tests with verbose output
npm run test:unit -- --verbose
```

### Issue: Next.js build fails

```bash
# Cause: Next.js 14 vs 15 differences
# Solution: Check .next config

# Clear build cache
rm -rf .next

# Rebuild
npm run build:webapp

# Check for Next.js specific issues
npx next lint
```

### Issue: Rollback needed

```bash
# If something breaks critically:
# 1. Revert the commit
git revert <commit-hash>

# 2. Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# 3. Test
npm run test:unit

# Then analyze root cause and retry
```

---

## Success Criteria

✅ **Phase 3 is complete when:**

1. **Security**

   - [ ] `npm audit --production` shows 0 vulnerabilities
   - [ ] No critical or high severity issues
   - [ ] All CVEs addressed

2. **Stability**

   - [ ] React: 18.2.0
   - [ ] Next.js: 14.2.0
   - [ ] React Native: 0.73.6
   - [ ] Jest: 29.7.0
   - [ ] TypeScript: 5.3.3
   - [ ] All @nx packages: 22.2.0

3. **Testing**

   - [ ] All Tier 1 services pass unit tests
   - [ ] No eslint errors (warnings OK)
   - [ ] Build succeeds for all apps
   - [ ] Docker images build successfully
   - [ ] No TypeScript compilation errors

4. **Documentation**

   - [ ] PHASE3_VALIDATION_STRATEGY.md created
   - [ ] PHASE3_EXECUTION_PLAN.md created
   - [ ] Dependency versions documented
   - [ ] Known breaking changes noted

5. **Committed**
   - [ ] Changes committed to branch
   - [ ] Commit message includes version changes
   - [ ] Push to origin successful

---

## Timeline

| Task                   | Time         | Status |
| ---------------------- | ------------ | ------ |
| Backup & Setup         | 5 min        | ⏳     |
| Initial Audit          | 5 min        | ⏳     |
| Security Fix           | 10 min       | ⏳     |
| React Downgrade        | 5 min        | ⏳     |
| Next.js Downgrade      | 5 min        | ⏳     |
| React Native Downgrade | 5 min        | ⏳     |
| Standardize Tools      | 10 min       | ⏳     |
| Quick Validation       | 10 min       | ⏳     |
| Unit Tests             | 30 min       | ⏳     |
| Build Validation       | 15 min       | ⏳     |
| Final Audit            | 5 min        | ⏳     |
| Commit & Push          | 5 min        | ⏳     |
| **Total**              | **~110 min** | **⏳** |

---

## Post-Completion

After Phase 3 is complete:

1. **Monitor metrics** for 1-2 days
2. **Review CI/CD** for any failures
3. **Get team feedback** on stability
4. **Document** any issues encountered
5. **Create runbook** for dependency updates
6. **Plan Phase 4** (E2E tests & CD completion)

---

## References

- [React 18 Migration](https://react.dev/blog/2022/03/29/react-v18)
- [Next.js 14 Upgrading](https://nextjs.org/docs/getting-started/upgrading)
- [Jest 29 Upgrade Guide](https://jestjs.io/docs/upgrading-to-jest29)
- [TypeScript 5.3 Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-3.html)
- [React Native 0.73 Release](https://reactnative.dev/blog/2024/01/30/version-073-release)
