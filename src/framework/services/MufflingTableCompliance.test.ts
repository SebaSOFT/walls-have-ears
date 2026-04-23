import MufflingCalculatorService, { Point3D } from './MufflingCalculatorService';
import { getGame } from '../../foundry/getGame';

jest.mock('../../foundry/getGame');
jest.mock('../../utils/WHEUtils', () => ({
  log: jest.fn(),
  clamp: jest.fn((num, min, max) => Math.min(Math.max(num, min), max)),
}));
jest.mock('../../settings/WHESettings', () => ({
  getInstance: jest.fn().mockReturnValue({
    getNumber: jest.fn().mockReturnValue(10),
  }),
}));

describe('Muffling Table Compliance Tests', () => {
  let mockGame: any;
  const earPos: Point3D = { x: 0, y: 0, z: 10 };
  const soundPos: Point3D = { x: 100, y: 100, z: 10 };

  beforeEach(() => {
    mockGame = {
      canvas: {
        grid: {
          measurePath: jest.fn().mockReturnValue({ distance: 100 }),
        },
        scene: {
          getSurfaces: jest.fn().mockReturnValue([]),
        },
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
  });

  const mockScenario = (sightCount: number, moveCount: number) => {
    (CONFIG.Canvas.polygonBackends.sound.testCollision as jest.Mock).mockReturnValue(sightCount > 0 || moveCount > 0);
    
    const sightResults = Array(sightCount).fill({
      edges: new Set([{ object: { center: { x: 50, y: 50 }, document: { threshold: { sight: 0 } } } }])
    });
    (CONFIG.Canvas.polygonBackends.sight.testCollision as jest.Mock).mockReturnValue(sightResults);

    const moveResults = Array(moveCount).fill({
      edges: new Set([{}])
    });
    (CONFIG.Canvas.polygonBackends.move.testCollision as jest.Mock).mockReturnValue(moveResults);
  };

  test('Table: <,S,S,S,> (3 Solid Walls) -> Muffling: 3', () => {
    // Solid Wall = 1 Sight + 1 Move
    mockScenario(3, 3);
    expect(MufflingCalculatorService.getMufflingIndexBetweenPoints(earPos, soundPos)).toBe(3);
  });

  test('Table: <,W,W,W,> (3 Windows) -> Muffling: 1', () => {
    // Window = 0 Sight + 1 Move
    mockScenario(0, 3);
    expect(MufflingCalculatorService.getMufflingIndexBetweenPoints(earPos, soundPos)).toBe(1);
  });

  test('Table: <,W,S,S,> (1 Window, 2 Solid) -> Muffling: 2', () => {
    // Window (0S, 1M) + Solid (1S, 1M) + Solid (1S, 1M) = 2 Sight, 3 Move
    mockScenario(2, 3);
    expect(MufflingCalculatorService.getMufflingIndexBetweenPoints(earPos, soundPos)).toBe(2);
  });

  test('Table: <,T,S,S,> (1 Terrain, 2 Solid) -> Muffling: 2', () => {
    // Terrain (0S, 1M) + Solid (1S, 1M) + Solid (1S, 1M) = 2 Sight, 3 Move
    // (Note: In current implementation Terrain is treated like Window/Ethereal if it blocks one layer)
    mockScenario(2, 3);
    expect(MufflingCalculatorService.getMufflingIndexBetweenPoints(earPos, soundPos)).toBe(2);
  });

  test('Table: <,,T,T,> (2 Terrain Walls) -> Muffling: 1', () => {
    // 0 Sight, 2 Move
    mockScenario(0, 2);
    expect(MufflingCalculatorService.getMufflingIndexBetweenPoints(earPos, soundPos)).toBe(1);
  });

  test('Table: <,,W,W,> (2 Windows) -> Muffling: 1', () => {
    // 0 Sight, 2 Move
    mockScenario(0, 2);
    expect(MufflingCalculatorService.getMufflingIndexBetweenPoints(earPos, soundPos)).toBe(1);
  });

  test('Table: <,,,S,> (1 Solid Wall) -> Muffling: 1', () => {
    // 1 Sight, 1 Move
    mockScenario(1, 1);
    expect(MufflingCalculatorService.getMufflingIndexBetweenPoints(earPos, soundPos)).toBe(1);
  });

  test('Table: <,,,W,> (1 Window) -> Muffling: 0', () => {
    // 0 Sight, 1 Move -> floor(0.5) = 0
    mockScenario(0, 1);
    expect(MufflingCalculatorService.getMufflingIndexBetweenPoints(earPos, soundPos)).toBe(0);
  });

  test('Table: <,,,T,> (1 Terrain Wall) -> Muffling: 0', () => {
    // 0 Sight, 1 Move -> floor(0.5) = 0
    mockScenario(0, 1);
    expect(MufflingCalculatorService.getMufflingIndexBetweenPoints(earPos, soundPos)).toBe(0);
  });

  test('Table: <,,,E,> (1 Ethereal Wall) -> Muffling: 0', () => {
    // 1 Sight, 0 Move -> floor(0.5) = 0
    mockScenario(1, 0);
    expect(MufflingCalculatorService.getMufflingIndexBetweenPoints(earPos, soundPos)).toBe(0);
  });

  test('Table: <,,E,E,> (2 Ethereal Walls) -> Muffling: 0', () => {
    // Special Case from table: 2 Ethereal (1.0 sum) should be 0 per "Final Muffling" column
    mockScenario(2, 0);
    const result = MufflingCalculatorService.getMufflingIndexBetweenPoints(earPos, soundPos);
    expect(result).toBe(0);
  });
});
