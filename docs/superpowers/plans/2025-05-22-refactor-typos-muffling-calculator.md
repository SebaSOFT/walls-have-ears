# Refactor MufflingCalculatorService Typos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix typos in `MufflingCalculatorService.ts` and its usages to improve code quality and maintainability.

**Architecture:** Rename `getDIstanceBetweenPoints` to `getDistanceBetweenPoints` and `poinA` to `pointA` across the codebase.

**Tech Stack:** TypeScript, Jest

---

### Task 1: Refactor `MufflingCalculatorService.ts`

**Files:**

- Modify: `src/framework/services/MufflingCalculatorService.ts`

- [ ] **Step 1: Rename `poinA` to `pointA` in JSDoc and method signature.**
- [ ] **Step 2: Rename `getDIstanceBetweenPoints` to `getDistanceBetweenPoints`.**
- [ ] **Step 3: Update all internal references within the file.**

### Task 2: Update `MufflingCalculatorService.test.ts`

**Files:**

- Modify: `src/framework/services/MufflingCalculatorService.test.ts`

- [ ] **Step 1: Update test descriptions and method calls to use `getDistanceBetweenPoints`.**
- [ ] **Step 2: Run tests to verify they pass.**

Run: `yarn test src/framework/services/MufflingCalculatorService.test.ts`
Expected: PASS

### Task 3: Update `SoundManager.ts`

**Files:**

- Modify: `src/framework/audio/SoundManager.ts`

- [ ] **Step 1: Update `getDIstanceBetweenPoints` call to `getDistanceBetweenPoints`.**

### Task 4: Update `WHEFramework.ts`

**Files:**

- Modify: `src/framework/WHEFramework.ts`

- [ ] **Step 2: Update `getDIstanceBetweenPoints` call to `getDistanceBetweenPoints`.**

### Task 5: Final Verification

- [ ] **Step 1: Run all tests to ensure no regressions.**

Run: `yarn test`
Expected: PASS

- [ ] **Step 2: Run lint to ensure no linting errors.**

Run: `yarn lint`
Expected: PASS
