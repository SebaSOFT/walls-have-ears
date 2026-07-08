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
    isIgnored: boolean;
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

    if (
      !start ||
      typeof start.x !== 'number' ||
      typeof start.y !== 'number' ||
      !end ||
      typeof end.x !== 'number' ||
      typeof end.y !== 'number' ||
      Number.isNaN(start.x) ||
      Number.isNaN(start.y) ||
      Number.isNaN(end.x) ||
      Number.isNaN(end.y)
    ) {
      console.warn(
        `WHE | Invalid coordinates passed to drawDebugLine: key=${key}, start=${JSON.stringify(start)}, end=${JSON.stringify(end)}`,
      );
      return;
    }

    const isDebug = WHESettings.getInstance().getBoolean(WHEConstants.SETTING_DEBUG, false);
    if (!isDebug) return;

    const canvas = getGame()?.canvas;
    if (!canvas || !canvas.ready) return;
    const layer = canvas.controls || canvas.stage;
    if (!layer) return;

    try {
      // Remove existing graphic for this key to prevent overlay piling
      if (RoomAcousticService.activeDebugGraphics.has(key)) {
        const oldG = RoomAcousticService.activeDebugGraphics.get(key)!;
        if (!oldG.destroyed) {
          layer.removeChild(oldG);
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

      layer.addChild(g);
      RoomAcousticService.activeDebugGraphics.set(key, g);

      // Remove the graphics element after duration
      setTimeout(() => {
        try {
          if (RoomAcousticService.activeDebugGraphics.get(key) === g) {
            if (!g.destroyed) {
              layer.removeChild(g);
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
    const layer = canvas?.controls || canvas?.stage;
    if (layer && RoomAcousticService.activeDebugGraphics.has(key)) {
      const g = RoomAcousticService.activeDebugGraphics.get(key)!;
      if (!g.destroyed) {
        layer.removeChild(g);
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
          if (ray.isIgnored) {
            RoomAcousticService.drawDebugLine(key, ray.start, ray.end, 0x555555, 1, 0.4, 3000);
          } else if (ray.isCollision) {
            RoomAcousticService.drawDebugLine(key, ray.start, ray.end, 0x00ffff, 2, 0.6, 3000);
          } else {
            RoomAcousticService.drawDebugLine(key, ray.start, ray.end, 0x00ffff, 1, 0.2, 3000);
          }
        }
      }
      return cached.size;
    }

    const activePortals = ((getGame()?.canvas?.regions as any)?.placeables || []).filter((r: any) =>
      r.document?.behaviors?.some(
        (b: any) =>
          b.type === 'teleport' ||
          b.type === 'changeLevel' ||
          b.type === 'core.teleport' ||
          b.type === 'core.changeLevel',
      ),
    );

    const soundLayer = CONFIG.Canvas.polygonBackends.sound;
    const grid = getGame()?.canvas?.grid;
    const pixelsPerUnit = grid ? grid.size / grid.distance : 1;
    const maxPixels = maxDistance * pixelsPerUnit;
    const rays: {
      start: { x: number; y: number };
      end: { x: number; y: number };
      isCollision: boolean;
      isIgnored: boolean;
    }[] = [];
    const distances: number[] = [];
    const ignoredIndices = new Set<number>();

    for (let i = 0; i < rayCount; i++) {
      const angle = (i * 2 * Math.PI) / rayCount;
      const endPoint = {
        x: position.x + maxPixels * Math.cos(angle),
        y: position.y + maxPixels * Math.sin(angle),
      };

      // Find all collisions along this segment
      const collisions = soundLayer.testCollision(position, endPoint, { type: 'sound', mode: 'all' }) || [];
      let minDistanceUnits = maxDistance;
      let collisionPoint = endPoint;
      let isCollision = false;

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
        minDistanceUnits = minDistancePixels / pixelsPerUnit;
        collisionPoint = {
          x: position.x + minDistancePixels * Math.cos(angle),
          y: position.y + minDistancePixels * Math.sin(angle),
        };
        isCollision = true;
      }

      distances.push(minDistanceUnits);

      // Check if this ray hits any portal
      let hitsPortal = false;
      for (const portal of activePortals) {
        if (typeof portal.testPoint !== 'function') continue;
        const steps = 5;
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          const samplePoint = {
            x: position.x + (collisionPoint.x - position.x) * t,
            y: position.y + (collisionPoint.y - position.y) * t,
          };
          if (portal.testPoint(samplePoint, posZ)) {
            hitsPortal = true;
            break;
          }
        }
        if (hitsPortal) break;
      }

      if (hitsPortal) {
        ignoredIndices.add(i);
        WHEUtils.log(`[RoomAcousticService] Ray ${i} hits portal region; marked for automatic exclusion.`);
      }

      rays.push({
        start: { x: position.x, y: position.y },
        end: collisionPoint,
        isCollision,
        isIgnored: hitsPortal,
      });
    }

    // Outlier rejection (up to maxOutliers rays that are substantially different than the others)
    const maxOutliers = rayCount >= 16 ? 3 : 2;
    const remainingIndices = Array.from({ length: rayCount }, (_, i) => i).filter((i) => !ignoredIndices.has(i));

    if (remainingIndices.length > 0) {
      const activeDistances = remainingIndices.map((i) => distances[i]);
      const sorted = [...activeDistances].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];

      const candidateIndices = remainingIndices
        .map((i) => ({ index: i, distance: distances[i], dev: Math.abs(distances[i] - median) }))
        .sort((a, b) => b.dev - a.dev);

      for (let k = 0; k < Math.min(maxOutliers, candidateIndices.length); k++) {
        const candidate = candidateIndices[k];
        const remainingRays = candidateIndices.slice(k + 1).map((c) => c.distance);
        if (remainingRays.length === 0) break;

        const remMean = remainingRays.reduce((sum, r) => sum + r, 0) / remainingRays.length;
        const remDevs = remainingRays.map((r) => Math.abs(r - remMean));
        const remAvgDev = remDevs.reduce((sum, r) => sum + r, 0) / remDevs.length;

        const candidateDevFromMean = Math.abs(candidate.distance - remMean);
        const threshold = Math.max(3.0 * remAvgDev, remMean * 0.25, 2.0);

        if (candidateDevFromMean > threshold) {
          ignoredIndices.add(candidate.index);
          rays[candidate.index].isIgnored = true;
        }
      }
    }

    let sumDistances = 0;
    let countRays = 0;
    for (let i = 0; i < distances.length; i++) {
      if (ignoredIndices.has(i)) {
        WHEUtils.log(`[RoomAcousticService] Ignoring outlier/portal ray ${i} with distance ${distances[i].toFixed(1)}`);
        continue;
      }
      sumDistances += distances[i];
      countRays++;
    }

    // Draw debug rays using colors corresponding to active vs ignored/outlier status
    if (drawDebug) {
      for (let i = 0; i < rayCount; i++) {
        const ray = rays[i];
        const key = `${keyPrefix}-ray-${i}`;
        if (ray.isIgnored) {
          RoomAcousticService.drawDebugLine(key, ray.start, ray.end, 0x555555, 1, 0.4, 3000);
        } else if (ray.isCollision) {
          RoomAcousticService.drawDebugLine(key, ray.start, ray.end, 0x00ffff, 2, 0.6, 3000);
        } else {
          RoomAcousticService.drawDebugLine(key, ray.start, ray.end, 0x00ffff, 1, 0.2, 3000);
        }
      }
    }

    const avgDistance = sumDistances / (countRays || 1);
    WHEUtils.log(
      `[RoomAcousticService] Room size at ${typeLabel} (${position.x.toFixed(1)}, ${position.y.toFixed(1)}): ${avgDistance.toFixed(1)} units (${ignoredIndices.size} ray(s) ignored as outlier(s) or portal(s))`,
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
          const isObstructed =
            soundLayer.testCollision(closestCollision, listener, { type: 'sound', mode: 'any' }) ||
            CONFIG.Canvas.polygonBackends.sight.testCollision(closestCollision, listener, {
              type: 'sight',
              mode: 'any',
            }) ||
            CONFIG.Canvas.polygonBackends.move.testCollision(closestCollision, listener, { type: 'move', mode: 'any' });

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
