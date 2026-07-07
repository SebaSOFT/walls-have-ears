import RoomAcousticService from './RoomAcousticService';
import { getGame } from '../../foundry/getGame';
import { Point3D } from './MufflingCalculatorService';

jest.mock('../../foundry/getGame');
jest.mock('../../utils/WHEUtils', () => ({
  log: jest.fn(),
}));

describe('RoomAcousticService', () => {
  let mockGame: any;

  beforeEach(() => {
    RoomAcousticService.clearCache();
    mockGame = {
      canvas: {
        grid: {
          size: 5,
          distance: 5,
        },
      },
    };
    (getGame as jest.Mock).mockReturnValue(mockGame);

    (global as any).CONFIG = {
      Canvas: {
        polygonBackends: {
          sound: { testCollision: jest.fn() },
        },
      },
    };
  });

  describe('calculateRoomSize', () => {
    test('returns max distance when no collisions occur', () => {
      const position = { x: 100, y: 100 };
      (CONFIG.Canvas.polygonBackends.sound.testCollision as jest.Mock).mockReturnValue([]);

      const size = RoomAcousticService.calculateRoomSize(position, 50, 8);

      expect(size).toBe(50);
    });

    test('calculates correct average room size based on wall collisions', () => {
      const position = { x: 100, y: 100 };

      // Mock collisions: for even indices, collide at 20 units distance (20 pixels)
      // Grid is 5 pixels per 5 units, so 1 unit = 1 pixel.
      (CONFIG.Canvas.polygonBackends.sound.testCollision as jest.Mock).mockImplementation((start: any, end: any) => {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const angle = Math.atan2(dy, dx);
        const i = Math.round((angle * 8) / (2 * Math.PI));
        const index = (i + 8) % 8;

        if (index % 2 === 0) {
          // Collision at 20 units (20 pixels)
          return [{ x: start.x + 20 * Math.cos(angle), y: start.y + 20 * Math.sin(angle) }];
        }
        return [];
      });

      const size = RoomAcousticService.calculateRoomSize(position, 50, 8);

      // 4 rays at 20 units, 4 rays at 50 units. Avg = (4*20 + 4*50)/8 = 35
      expect(size).toBe(35);
    });
  });

  describe('getReboundPathDistance', () => {
    const source: Point3D = { x: 100, y: 100, z: 10 };
    const listener: Point3D = { x: 300, y: 100, z: 10 };

    test('returns shortest path distance when a rebound connects', () => {
      // Mock testCollision:
      // First call (source to endPoints): return collision at x=200, y=200 for index 1
      // Second call (collision to listener): return false (no obstruction) for that collision
      (CONFIG.Canvas.polygonBackends.sound.testCollision as jest.Mock).mockImplementation(
        (start: any, end: any, options?: any) => {
          if (options?.mode === 'any') {
            // Direct checks from wall to listener. Let's make point (200, 200) connect clean
            if (start.x === 200 && start.y === 200) {
              return false;
            }
            return true; // Others are obstructed
          }

          // Ray checks from source.
          const dx = end.x - start.x;
          const dy = end.y - start.y;
          if (dx > 100 && dx < 110 && dy > 100 && dy < 110) {
            return [{ x: 200, y: 200 }];
          }
          return [];
        },
      );

      const distance = RoomAcousticService.getReboundPathDistance(source, listener, 150, 8);

      // Emitter to Wall: (100,100) -> (200,200) = sqrt(100^2 + 100^2) = 141.42 units
      // Wall to Listener: (200,200) -> (300,100) = sqrt(100^2 + 100^2) = 141.42 units
      // Total horizontal distance = 282.84 units. No Z difference. Total units rounded = 283.
      expect(distance).toBe(283);
    });

    test('returns null when all rebound paths are obstructed', () => {
      (CONFIG.Canvas.polygonBackends.sound.testCollision as jest.Mock).mockImplementation(
        (start: any, end: any, options?: any) => {
          if (options?.mode === 'any') {
            return true; // All secondary rays obstructed
          }
          return [{ x: 200, y: 200 }]; // Rays always hit a wall
        },
      );

      const distance = RoomAcousticService.getReboundPathDistance(source, listener, 150, 8);

      expect(distance).toBeNull();
    });
  });

  describe('getEffectiveRoomSize', () => {
    const threshold = 120;

    test('returns null when both spaces are open', () => {
      const size = RoomAcousticService.getEffectiveRoomSize(150, 130, threshold);
      expect(size).toBeNull();
    });

    test('returns listener room size when only listener is enclosed', () => {
      const size = RoomAcousticService.getEffectiveRoomSize(150, 50, threshold);
      expect(size).toBe(50);
    });

    test('returns sound room size when only sound is enclosed', () => {
      const size = RoomAcousticService.getEffectiveRoomSize(30, 150, threshold);
      expect(size).toBe(30);
    });

    test('returns listener room size when both are enclosed', () => {
      const size = RoomAcousticService.getEffectiveRoomSize(30, 60, threshold);
      expect(size).toBe(60);
    });
  });
});
