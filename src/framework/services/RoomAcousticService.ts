import WHEUtils from '../../utils/WHEUtils';
import { getGame } from '../../foundry/getGame';
import { Point3D } from './MufflingCalculatorService';
import WHESettings from '../../settings/WHESettings';
import { WHEConstants } from '../../utils/WHEConstants';

interface CachedRoomSize {
  size: number;
  rays: {
    start: { x: number; y: number };
    end: { x: number; y: number };
    isCollision: boolean;
  }[];
}

interface CachedRebound {
  distance: number | null;
  bestReflectionPoint: { x: number; y: number } | null;
}

/**
 * Service responsible for calculating environmental acoustics, room sizes,
 * and multi-ray rebound propagation paths with in-memory caching.
 */
export default class RoomAcousticService {
  private static roomSizeCache = new Map<string, CachedRoomSize>();
  private static reboundCache = new Map<string, CachedRebound>();
  private static activeDebugGraphics = new Map<string, PIXI.Graphics>();

  /**
   * Clears all room size and rebound path calculations caches.
   */
  public static clearCache = (): void => {
    RoomAcousticService.roomSizeCache.clear();
    RoomAcousticService.reboundCache.clear();
    WHEUtils.log('[RoomAcousticService] Acoustic cache cleared.');
  };

  /**
   * Helper to draw a dashed line onto a PIXI.Graphics object.
   */
  public static drawDashedLine = (
    graphics: PIXI.Graphics,
    start: { x: number; y: number },
    end: { x: number; y: number },
    dashLength = 10,
    gapLength = 8,
  ): void => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) return;

    const normalX = dx / len;
    const normalY = dy / len;

    let progress = 0;
    let draw = true;

    graphics.moveTo(start.x, start.y);
    while (progress < len) {
      const currentLength = draw ? dashLength : gapLength;
      if (progress + currentLength >= len) {
        if (draw) {
          graphics.lineTo(end.x, end.y);
        }
        break;
      }
      progress += currentLength;
      const nextX = start.x + normalX * progress;
      const nextY = start.y + normalY * progress;
      if (draw) {
        graphics.lineTo(nextX, nextY);
      } else {
        graphics.moveTo(nextX, nextY);
      }
      draw = !draw;
    }
  };

  /**
   * Draw temporary debug lines in the Foundry canvas if debug mode is active.
   */
  public static drawDebugLine = (
    key: string,
    start: { x: number; y: number },
    end: { x: number; y: number },
    color = 0x00ffff,
    thickness = 2,
    alpha = 0.8,
    duration = 3000,
    dashed = false,
  ): void => {
    if (typeof PIXI === 'undefined') return;

    const isDebug = WHESettings.getInstance().getBoolean(WHEConstants.SETTING_DEBUG, false);
    if (!isDebug) return;

    const canvas = getGame()?.canvas;
    if (!canvas || !canvas.ready || !canvas.stage) return;

    try {
      const stage = canvas.stage;

      // Remove existing graphic for this key to prevent overlay piling
      if (RoomAcousticService.activeDebugGraphics.has(key)) {
        const oldG = RoomAcousticService.activeDebugGraphics.get(key)!;
        if (!oldG.destroyed) {
          stage.removeChild(oldG);
          oldG.destroy();
        }
        RoomAcousticService.activeDebugGraphics.delete(key);
      }

      const g = new PIXI.Graphics();
      g.lineStyle(thickness, color, alpha);

      if (dashed) {
        RoomAcousticService.drawDashedLine(g, start, end);
      } else {
        g.moveTo(start.x, start.y);
        g.lineTo(end.x, end.y);
      }

      stage.addChild(g);
      RoomAcousticService.activeDebugGraphics.set(key, g);

      // Remove the graphics element after duration
      setTimeout(() => {
        try {
          if (RoomAcousticService.activeDebugGraphics.get(key) === g) {
            if (!g.destroyed) {
              stage.removeChild(g);
              g.destroy();
            }
            RoomAcousticService.activeDebugGraphics.delete(key);
          }
        } catch {
          // ignore
        }
      }, duration);
    } catch (e) {
      console.error('WHE | Error drawing debug ray:', e);
    }
  };

  /**
   * Clear a specific debug line immediately.
   */
  public static clearDebugLine = (key: string): void => {
    if (typeof PIXI === 'undefined') return;
    const canvas = getGame()?.canvas;
    const stage = canvas?.stage;
    if (stage && RoomAcousticService.activeDebugGraphics.has(key)) {
      const g = RoomAcousticService.activeDebugGraphics.get(key)!;
      if (!g.destroyed) {
        stage.removeChild(g);
        g.destroy();
      }
      RoomAcousticService.activeDebugGraphics.delete(key);
    }
  };

  /**
   * Casts radial rays in N directions from a given starting point.
   * Calculates the average distance to wall collisions.
   * @param {Point3D | foundry.canvas.Canvas.Point} position - The starting point coordinates.
   * @param {number} maxDistance - The maximum range to cast rays.
   * @param {number} rayCount - The number of radial rays to cast.
   * @param {boolean} drawDebug - Whether to draw the visual debug rays on cache hit/miss.
   * @param {string} keyPrefix - The prefix used to register the unique graphic debug keys.
   * @returns {number} The average distance to wall collisions in grid units.
   */
  public static calculateRoomSize = (
    position: Point3D | foundry.canvas.Canvas.Point,
    maxDistance: number,
    rayCount = 8,
    drawDebug = true,
    keyPrefix = 'room',
  ): number => {
    const posZ = 'z' in position ? (position as Point3D).z : 0;
    const cacheKey = `${position.x.toFixed(1)},${position.y.toFixed(1)},${posZ.toFixed(1)},${maxDistance.toFixed(1)},${rayCount}`;
    const typeLabel = drawDebug ? 'Sound' : 'Listener';

    if (RoomAcousticService.roomSizeCache.has(cacheKey)) {
      const cached = RoomAcousticService.roomSizeCache.get(cacheKey)!;
      if (drawDebug) {
        for (let i = 0; i < cached.rays.length; i++) {
          const ray = cached.rays[i];
          const key = `${keyPrefix}-ray-${i}`;
          if (ray.isCollision) {
            RoomAcousticService.drawDebugLine(key, ray.start, ray.end, 0x00ffff, 2, 0.6, 3000);
          } else {
            RoomAcousticService.drawDebugLine(key, ray.start, ray.end, 0x00ffff, 1, 0.2, 3000);
          }
        }
      }
      return cached.size;
    }

    const soundLayer = CONFIG.Canvas.polygonBackends.sound;
    let sumDistances = 0;
    const grid = getGame()?.canvas?.grid;
    const pixelsPerUnit = grid ? grid.size / grid.distance : 1;
    const maxPixels = maxDistance * pixelsPerUnit;
    const rays: { start: { x: number; y: number }; end: { x: number; y: number }; isCollision: boolean }[] = [];

    for (let i = 0; i < rayCount; i++) {
      const angle = (i * 2 * Math.PI) / rayCount;
      const endPoint = {
        x: position.x + maxPixels * Math.cos(angle),
        y: position.y + maxPixels * Math.sin(angle),
      };

      // Find all collisions along this segment
      const collisions = soundLayer.testCollision(position, endPoint, { type: 'sound', mode: 'all' }) || [];

      if (collisions.length > 0) {
        // Find closest collision
        let minDistanceSq = Infinity;
        for (const collision of collisions) {
          const dx = collision.x - position.x;
          const dy = collision.y - position.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < minDistanceSq) {
            minDistanceSq = distSq;
          }
        }
        const minDistancePixels = Math.sqrt(minDistanceSq);
        const minDistanceUnits = minDistancePixels / pixelsPerUnit;
        sumDistances += minDistanceUnits;

        const collisionPoint = {
          x: position.x + minDistancePixels * Math.cos(angle),
          y: position.y + minDistancePixels * Math.sin(angle),
        };

        rays.push({ start: { x: position.x, y: position.y }, end: collisionPoint, isCollision: true });

        // Draw debug ray to collision point
        if (drawDebug) {
          const key = `${keyPrefix}-ray-${i}`;
          RoomAcousticService.drawDebugLine(key, position, collisionPoint, 0x00ffff, 2, 0.6, 3000);
        }
      } else {
        // No collision, ray travelled maximum distance
        sumDistances += maxDistance;

        rays.push({ start: { x: position.x, y: position.y }, end: endPoint, isCollision: false });

        // Draw faint debug ray to max limit
        if (drawDebug) {
          const key = `${keyPrefix}-ray-${i}`;
          RoomAcousticService.drawDebugLine(key, position, endPoint, 0x00ffff, 1, 0.2, 3000);
        }
      }
    }

    const avgDistance = sumDistances / rayCount;
    WHEUtils.log(
      `[RoomAcousticService] Room size at ${typeLabel} (${position.x.toFixed(1)}, ${position.y.toFixed(1)}): ${avgDistance.toFixed(1)} units`,
    );

    RoomAcousticService.roomSizeCache.set(cacheKey, { size: avgDistance, rays });
    return avgDistance;
  };

  /**
   * Checks for a rebound path between source and listener by tracing rays from
   * the source's collision points to the listener.
   * Returns the shortest path distance, or null if no rebound path exists.
   * @param {Point3D | foundry.canvas.Canvas.Point} source - The sound source position.
   * @param {Point3D | foundry.canvas.Canvas.Point} listener - The listener position.
   * @param {number} maxDistance - The maximum range to check for reflections.
   * @param {number} rayCount - The number of radial rays to test.
   * @returns {number | null} The shortest rebound path distance in units, or null if none connects.
   */
  public static getReboundPathDistance = (
    source: Point3D | foundry.canvas.Canvas.Point,
    listener: Point3D | foundry.canvas.Canvas.Point,
    maxDistance: number,
    rayCount = 8,
  ): number | null => {
    const srcZ = 'z' in source ? (source as Point3D).z : 0;
    const lstZ = 'z' in listener ? (listener as Point3D).z : 0;
    const cacheKey = `${source.x.toFixed(1)},${source.y.toFixed(1)},${srcZ.toFixed(1)},${listener.x.toFixed(1)},${listener.y.toFixed(1)},${lstZ.toFixed(1)},${maxDistance.toFixed(1)},${rayCount}`;

    if (RoomAcousticService.reboundCache.has(cacheKey)) {
      const cached = RoomAcousticService.reboundCache.get(cacheKey)!;
      return cached.distance;
    }

    const soundLayer = CONFIG.Canvas.polygonBackends.sound;
    const grid = getGame()?.canvas?.grid;
    const pixelsPerUnit = grid ? grid.size / grid.distance : 1;
    const maxPixels = maxDistance * pixelsPerUnit;

    let shortestReboundDistance = Infinity;
    let bestReflectionPoint: { x: number; y: number } | null = null;

    for (let i = 0; i < rayCount; i++) {
      const angle = (i * 2 * Math.PI) / rayCount;
      const endPoint = {
        x: source.x + maxPixels * Math.cos(angle),
        y: source.y + maxPixels * Math.sin(angle),
      };

      // Check where the ray hits a wall
      const collisions = soundLayer.testCollision(source, endPoint, { type: 'sound', mode: 'all' }) || [];

      if (collisions.length > 0) {
        // Find the closest collision point (the reflection wall point)
        let minDistanceSq = Infinity;
        let closestCollision: any = null;
        for (const collision of collisions) {
          const dx = collision.x - source.x;
          const dy = collision.y - source.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < minDistanceSq) {
            minDistanceSq = distSq;
            closestCollision = collision;
          }
        }

        if (closestCollision) {
          // Now cast a direct ray from the reflection point to the listener
          const isObstructed = soundLayer.testCollision(closestCollision, listener, { type: 'sound', mode: 'any' });

          if (!isObstructed) {
            // We found a clean rebound path!
            const sourceToWallPixels = Math.sqrt(minDistanceSq);

            const wallToListenerDx = listener.x - closestCollision.x;
            const wallToListenerDy = listener.y - closestCollision.y;
            const wallToListenerPixels = Math.hypot(wallToListenerDx, wallToListenerDy);

            const totalPixels = sourceToWallPixels + wallToListenerPixels;
            const totalUnits = totalPixels / pixelsPerUnit;

            // Add 3D Z offset if applicable
            let elevationDiff = 0;
            if ('z' in source && 'z' in listener) {
              elevationDiff = Math.abs((source as Point3D).z - (listener as Point3D).z);
            }
            const total3DUnits = Math.round(Math.hypot(totalUnits, elevationDiff));

            if (total3DUnits < shortestReboundDistance) {
              shortestReboundDistance = total3DUnits;
              bestReflectionPoint = closestCollision;
            }
          }
        }
      }
    }

    let result: number | null = null;
    if (shortestReboundDistance !== Infinity) {
      WHEUtils.log(`[RoomAcousticService] Found rebound path with distance: ${shortestReboundDistance} units`);
      result = shortestReboundDistance;
    }

    RoomAcousticService.reboundCache.set(cacheKey, { distance: result, bestReflectionPoint });
    return result;
  };

  /**
   * Gets the cached best reflection point if it exists in the rebound cache.
   */
  public static getCachedBestReflectionPoint = (
    source: Point3D | foundry.canvas.Canvas.Point,
    listener: Point3D | foundry.canvas.Canvas.Point,
    maxDistance: number,
    rayCount = 8,
  ): { x: number; y: number } | null => {
    const srcZ = 'z' in source ? (source as Point3D).z : 0;
    const lstZ = 'z' in listener ? (listener as Point3D).z : 0;
    const cacheKey = `${source.x.toFixed(1)},${source.y.toFixed(1)},${srcZ.toFixed(1)},${listener.x.toFixed(1)},${listener.y.toFixed(1)},${lstZ.toFixed(1)},${maxDistance.toFixed(1)},${rayCount}`;
    return RoomAcousticService.reboundCache.get(cacheKey)?.bestReflectionPoint ?? null;
  };

  /**
   * Determines the combined effective room size for reverberation calculation.
   * If both are open, returns null. If only listener is enclosed, returns listenerRoomSize.
   * If only source is enclosed, returns soundRoomSize. If both are enclosed, returns listenerRoomSize.
   * @param {number} soundRoomSize - The average size of the source room.
   * @param {number} listenerRoomSize - The average size of the listener room.
   * @param {number} threshold - The exterior threshold to classify nature vs indoor.
   * @returns {number | null} The effective room size in units, or null if open nature environment.
   */
  public static getEffectiveRoomSize = (
    soundRoomSize: number,
    listenerRoomSize: number,
    threshold: number,
  ): number | null => {
    const isSoundEnclosed = soundRoomSize < threshold;
    const isListenerEnclosed = listenerRoomSize < threshold;

    if (!isSoundEnclosed && !isListenerEnclosed) {
      return null; // Nature/open space (no reverb)
    }

    if (isListenerEnclosed) {
      // Listener environment dominates perception
      return listenerRoomSize;
    }

    return soundRoomSize;
  };
}
