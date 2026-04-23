import MufflingCalculatorService, { Point3D } from './MufflingCalculatorService';
import { getGame } from '../../foundry/getGame';
import WHESettings from '../../settings/WHESettings';

jest.mock('../../foundry/getGame');
jest.mock('../../utils/WHEUtils', () => ({
  log: jest.fn(),
  clamp: jest.fn((num, min, max) => Math.min(Math.max(num, min), max)),
}));
jest.mock('../../settings/WHESettings');

describe('MufflingCalculatorService', () => {
  let mockGame: any;

  beforeEach(() => {
    mockGame = {
      canvas: {
        grid: {
          measurePath: jest.fn(),
        },
        scene: {
          getSurfaces: jest.fn(),
        },
      },
      settings: {
        get: jest.fn(),
      },
    };
    (getGame as jest.Mock).mockReturnValue(mockGame);

    (global as any).CONFIG = {
      Canvas: {
        polygonBackends: {
          sight: { testCollision: jest.fn() },
          sound: { testCollision: jest.fn() },
          move: { testCollision: jest.fn() },
        },
      },
    };

    (WHESettings.getInstance as jest.Mock).mockReturnValue({
      getNumber: jest.fn().mockReturnValue(10),
    });
  });

  describe('getDistanceBetweenPoints', () => {
    test('calculates 3D distance correctly when z coordinates are present', () => {
      const pointA: Point3D = { x: 0, y: 0, z: 10 };
      const pointB: Point3D = { x: 30, y: 40, z: 40 };

      mockGame.canvas.grid.measurePath.mockReturnValue({ distance: 50 });

      const distance = MufflingCalculatorService.getDistanceBetweenPoints(pointA, pointB);

      expect(distance).toBe(58);
    });
  });

  describe('getMufflingIndexBetweenPoints', () => {
    const earPos: Point3D = { x: 0, y: 0, z: 10 };
    const soundPos: Point3D = { x: 100, y: 100, z: 10 };

    beforeEach(() => {
      // Default: sound is NOT occluded (means no walls at all)
      (CONFIG.Canvas.polygonBackends.sound.testCollision as jest.Mock).mockReturnValue(false);
    });

    test('returns -1 when sound is not occluded', () => {
      const result = MufflingCalculatorService.getMufflingIndexBetweenPoints(earPos, soundPos);
      expect(result).toBe(-1);
    });

    test('Natural walls: single wall = 0 muffling', () => {
      // Sound IS occluded
      (CONFIG.Canvas.polygonBackends.sound.testCollision as jest.Mock).mockReturnValue(true);
      // Sight hit 0 walls (transparent for first natural wall)
      (CONFIG.Canvas.polygonBackends.sight.testCollision as jest.Mock).mockReturnValue([]);
      // Move hit 1 wall
      (CONFIG.Canvas.polygonBackends.move.testCollision as jest.Mock).mockReturnValue([
        { edges: new Set([{ object: { center: { x: 50, y: 50 }, document: { threshold: { sight: 0 } } } }]) },
      ]);

      const result = MufflingCalculatorService.getMufflingIndexBetweenPoints(earPos, soundPos);
      expect(result).toBe(0);
    });

    test('Natural walls: two walls = 1 muffling', () => {
      (CONFIG.Canvas.polygonBackends.sound.testCollision as jest.Mock).mockReturnValue(true);
      // Two natural walls: first is transparent, second is hit
      (CONFIG.Canvas.polygonBackends.sight.testCollision as jest.Mock).mockReturnValue([
        {
          edges: new Set([{ object: { center: { x: 70, y: 70 }, document: { threshold: { sight: 0 } } } }]),
        },
      ]);
      // Both hit move
      (CONFIG.Canvas.polygonBackends.move.testCollision as jest.Mock).mockReturnValue([
        { edges: new Set([{}]) },
        { edges: new Set([{}]) },
      ]);

      const result = MufflingCalculatorService.getMufflingIndexBetweenPoints(earPos, soundPos);
      expect(result).toBe(1);
    });

    test('3D floor crossings: single floor = +1 muffling', () => {
      (CONFIG.Canvas.polygonBackends.sound.testCollision as jest.Mock).mockReturnValue(true);
      (CONFIG.Canvas.polygonBackends.sight.testCollision as jest.Mock).mockReturnValue([]);
      (CONFIG.Canvas.polygonBackends.move.testCollision as jest.Mock).mockReturnValue([]);

      const ear3D = { x: 0, y: 0, z: 10 };
      const sound3D = { x: 100, y: 100, z: 20 };

      mockGame.canvas.scene.getSurfaces.mockReturnValue([{ elevation: 15 }]);

      const result = MufflingCalculatorService.getMufflingIndexBetweenPoints(ear3D, sound3D);
      expect(result).toBe(1);
    });

    test('Floor thickness merging: two floors at 10ft and 12ft with 10ft rule = +1 muffling', () => {
      (CONFIG.Canvas.polygonBackends.sound.testCollision as jest.Mock).mockReturnValue(true);
      (CONFIG.Canvas.polygonBackends.sight.testCollision as jest.Mock).mockReturnValue([]);
      (CONFIG.Canvas.polygonBackends.move.testCollision as jest.Mock).mockReturnValue([]);

      const ear3D = { x: 0, y: 0, z: 5 };
      const sound3D = { x: 100, y: 100, z: 25 };

      mockGame.canvas.scene.getSurfaces.mockReturnValue([{ elevation: 10 }, { elevation: 12 }]);

      const result = MufflingCalculatorService.getMufflingIndexBetweenPoints(ear3D, sound3D);
      expect(result).toBe(1);
    });

    test('Acoustic Portal: should find a better path via a portal region bypassing a wall', () => {
      const earPos3D: Point3D = { x: 0, y: 0, z: 0 };
      const soundPos3D: Point3D = { x: 100, y: 0, z: 10 }; // z diff to trigger portal logic

      mockGame.canvas.regions = { placeables: [] };
      mockGame.canvas.scene.getSurfaces.mockReturnValue([]);

      // Portal region at (50, 100, 5)
      const portalRegion = {
        id: 'portal1',
        center: { x: 50, y: 100 },
        document: {
          elevation: { bottom: 0, top: 10 },
          behaviors: [{ type: 'teleport' }],
        },
      };
      mockGame.canvas.regions.placeables = [portalRegion];

      // Mock wall that actually passes the filter
      const mockWall = { center: { x: 50, y: 0 }, document: { threshold: { sight: 0 } } };

      // Mock testCollision to distinguish between direct and portal paths
      (CONFIG.Canvas.polygonBackends.sound.testCollision as jest.Mock).mockReturnValue(true);

      (CONFIG.Canvas.polygonBackends.sight.testCollision as jest.Mock).mockImplementation((p1, p2) => {
        // Direct path from (0,0) to (100,0) hits a wall
        if (p1.x === 0 && p2.x === 100) return [{ edges: new Set([{ object: mockWall }]) }];
        // Path to/from portal doesn't hit a wall
        return [];
      });

      (CONFIG.Canvas.polygonBackends.move.testCollision as jest.Mock).mockImplementation((p1, p2) => {
        if (p1.x === 0 && p2.x === 100) return [{ edges: new Set([{ object: mockWall }]) }];
        return [];
      });

      // Direct path: 1 sight + 1 move = 1.0 sum -> final 1.
      // Portal path: 0 + 0 = 0.

      const result = MufflingCalculatorService.getMufflingIndexBetweenPoints(earPos3D, soundPos3D);

      expect(result).toBe(0);
    });

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

      expect(result).toBe(0);
    });

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
  });
});
