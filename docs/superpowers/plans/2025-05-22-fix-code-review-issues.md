# Fix issues found in Task 1 code review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix specific issues in `MufflingCalculatorService.ts` and its tests as requested by code review.

**Architecture:** 
- Remove the Z-inequality check for portals to allow horizontal portals.
- Safely handle infinite elevations in portals.
- Improve test mocks for walls.

**Tech Stack:** TypeScript, Jest, FoundryVTT (mocked)

---

### Task 1: Improve Test Mocks in `MufflingCalculatorService.test.ts`

**Files:**
- Modify: `src/framework/services/MufflingCalculatorService.test.ts`

- [ ] **Step 1: Update wall mocks to include `document` property**

```typescript
// Replace:
// { edges: new Set([{ object: { center: { x: 50, y: 50 } } }]) }
// With:
// { edges: new Set([{ object: { center: { x: 50, y: 50 }, document: { threshold: { sight: 0 } } } }]) }
```

- [ ] **Step 2: Run tests to ensure they still pass**

Run: `yarn test src/framework/services/MufflingCalculatorService.test.ts`
Expected: PASS

### Task 2: Remove `earPosition.z !== soundPosition.z` constraint

**Files:**
- Modify: `src/framework/services/MufflingCalculatorService.ts`
- Test: `src/framework/services/MufflingCalculatorService.test.ts`

- [ ] **Step 1: Write a failing test for horizontal portal**

```typescript
    test('Acoustic Portal: should work even if z coordinates are the same', () => {
      const earPos3D: Point3D = { x: 0, y: 0, z: 10 };
      const soundPos3D: Point3D = { x: 100, y: 0, z: 10 }; // SAME z

      mockGame.canvas.regions = { placeables: [] };
      mockGame.canvas.scene.getSurfaces.mockReturnValue([]);

      const portalRegion = {
        id: 'portal1',
        center: { x: 50, y: 100 },
        document: {
          elevation: { bottom: 0, top: 20 },
          behaviors: [{ type: 'teleport' }],
        },
      };
      mockGame.canvas.regions.placeables = [portalRegion];

      const mockWall = { center: { x: 50, y: 0 }, document: { threshold: { sight: 0 } } };

      (CONFIG.Canvas.polygonBackends.sound.testCollision as jest.Mock).mockReturnValue(true);

      (CONFIG.Canvas.polygonBackends.sight.testCollision as jest.Mock).mockImplementation((p1, p2) => {
        if (p1.x === 0 && p2.x === 100) return [{ edges: new Set([{ object: mockWall }]) }];
        return [];
      });

      (CONFIG.Canvas.polygonBackends.move.testCollision as jest.Mock).mockImplementation((p1, p2) => {
        if (p1.x === 0 && p2.x === 100) return [{ edges: new Set([{ object: mockWall }]) }];
        return [];
      });

      const result = MufflingCalculatorService.getMufflingIndexBetweenPoints(earPos3D, soundPos3D);

      expect(result).toBe(0); // Should be 0 if portal is used, but will be 1 currently because portal logic is skipped
    });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/framework/services/MufflingCalculatorService.test.ts`
Expected: FAIL (result will be 1)

- [ ] **Step 3: Remove the `z` constraint in `MufflingCalculatorService.ts`**

```typescript
<<<<
      earPosition.z !== soundPosition.z &&
====
>>>>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/framework/services/MufflingCalculatorService.test.ts`
Expected: PASS

### Task 3: Handle `Infinity` elevation in portals

**Files:**
- Modify: `src/framework/services/MufflingCalculatorService.ts`
- Test: `src/framework/services/MufflingCalculatorService.test.ts`

- [ ] **Step 1: Write a test for infinite portalTop**

```typescript
    test('Acoustic Portal: handles Infinity elevation safely', () => {
      const earPos3D: Point3D = { x: 0, y: 0, z: 0 };
      const soundPos3D: Point3D = { x: 100, y: 0, z: 10 };

      mockGame.canvas.regions = { placeables: [] };
      mockGame.canvas.scene.getSurfaces.mockReturnValue([]);

      const portalRegion = {
        id: 'portal1',
        center: { x: 50, y: 100 },
        document: {
          elevation: { bottom: 0, top: Infinity }, // INFINITY
          behaviors: [{ type: 'teleport' }],
        },
      };
      mockGame.canvas.regions.placeables = [portalRegion];

      (CONFIG.Canvas.polygonBackends.sound.testCollision as jest.Mock).mockReturnValue(true);
      (CONFIG.Canvas.polygonBackends.sight.testCollision as jest.Mock).mockReturnValue([]);
      (CONFIG.Canvas.polygonBackends.move.testCollision as jest.Mock).mockReturnValue([]);

      // This should not crash and should calculate a finite portalZ
      const result = MufflingCalculatorService.getMufflingIndexBetweenPoints(earPos3D, soundPos3D);
      expect(result).toBe(0);
    });
```

- [ ] **Step 2: Run test to verify it fails (or check for NaN/Infinity issues)**

Run: `yarn test src/framework/services/MufflingCalculatorService.test.ts`
Expected: Likely PASS but worth verifying behavior or if it results in NaN. Actually `(0 + Infinity) / 2` is `Infinity`. If it's `Infinity`, `muffling1` will be calculated with `z: Infinity`.

- [ ] **Step 3: Implement `isFinite` check for `portalTop`**

```typescript
          const portalBottom = portal.document?.elevation?.bottom ?? 0;
          let portalTop = portal.document?.elevation?.top ?? portalBottom;
          if (!Number.isFinite(portalTop)) {
            portalTop = portalBottom + 10; // Or just portalBottom
          }
          const portalZ = (portalBottom + portalTop) / 2;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/framework/services/MufflingCalculatorService.test.ts`
Expected: PASS

### Task 4: Final Verification

- [ ] **Step 1: Run all tests**

Run: `yarn test`
Expected: ALL PASS

- [ ] **Step 2: Run lint**

Run: `yarn lint`
Expected: NO ERRORS
