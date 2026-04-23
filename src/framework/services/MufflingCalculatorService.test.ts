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
        { edges: new Set([{ object: { center: { x: 50, y: 50 } } }]) },
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
  });
});
