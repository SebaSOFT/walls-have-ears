import WHEUtils from '../../utils/WHEUtils';
import { getGame } from '../../foundry/getGame';
import WHESettings from '../../settings/WHESettings';
import { WHEConstants } from '../../utils/WHEConstants';

export interface Point3D extends foundry.canvas.Canvas.Point {
  z: number;
}

export default class MufflingCalculatorService {
  /**
   * Calculates the muffling index between two points by testing for collisions.
   * It uses sight, sound, and move collision layers to determine the level of obstruction.
   * @param {Point3D | foundry.canvas.Canvas.Point} earPosition - The point representing the listener (e.g., token center).
   * @param {Point3D | foundry.canvas.Canvas.Point} soundPosition - The point representing the sound source.
   * @param {boolean} ignorePortals - If true, acoustic portals will not be checked (prevents recursion).
   * @param {number[]} surfaceElevations - Optional pre-calculated elevations for performance optimization.
   * @param {any[]} portals - Optional pre-fetched V14 regions for performance optimization.
   * @returns {number} A muffling index from -1 to 5, where -1 is no obstruction and 5 is maximum obstruction.
   */
  public static getMufflingIndexBetweenPoints = (
    earPosition: Point3D | foundry.canvas.Canvas.Point,
    soundPosition: Point3D | foundry.canvas.Canvas.Point,
    ignorePortals: boolean = false,
    surfaceElevations?: number[],
    portals?: any[],
  ): number => {
    const sightLayer = CONFIG.Canvas.polygonBackends.sight;
    const soundLayer = CONFIG.Canvas.polygonBackends.sound;
    const moveLayer = CONFIG.Canvas.polygonBackends.move;

    // First, there should not be any sound interruption
    const hasSoundOccluded = soundLayer.testCollision(earPosition, soundPosition, { type: 'sound', mode: 'any' });

    if (!hasSoundOccluded) {
      WHEUtils.log('This sound has no walls, direct access', hasSoundOccluded);
      return -1;
    }

    // If you don't see it, it's muffled
    let sightCollisions = sightLayer.testCollision(earPosition, soundPosition, { type: 'sight', mode: 'all' });

    if (!sightCollisions) {
      WHEUtils.log('There are no walls!');
      // Even if no sight walls, there might be move walls or floors
      sightCollisions = [];
    }

    // New windows come by default with a distance triggering of the sight,
    // which we need to filter to keep (available) windows as 0 muffling
    sightCollisions = sightCollisions.filter((impactVertex) => {
      const edge = (impactVertex.edges as any).first?.() ?? impactVertex.edges.values().next().value;
      const wall = edge?.object as Wall;

      if (!wall) {
        return false;
      }

      const wallCenter = wall.center;

      const sightDistance = (wall.document as any)?.threshold?.sight;
      if (!sightDistance) {
        return true;
      }
      const tokenDistance = MufflingCalculatorService.getDistanceBetweenPoints(earPosition, wallCenter);

      WHEUtils.log(`Maximum sight: ${sightDistance}`);
      WHEUtils.log(`Distance to Wall: ${tokenDistance}`);
      // If token is close to the window it should be open and not represent a sight collision
      return tokenDistance >= sightDistance;
    });

    // This already takes into account open doors
    const moveCollisions = moveLayer.testCollision(earPosition, soundPosition, { type: 'move', mode: 'all' }) || [];

    // Accumulate muffling: 0.5 for each sight or move collision
    let wallMufflingSum = (sightCollisions.length + moveCollisions.length) * 0.5;

    WHEUtils.log(`Sight collisions: ${sightCollisions.length}`);
    WHEUtils.log(`Move collisions: ${moveCollisions.length}`);

    // 3D Surface Logic
    if ('z' in earPosition && 'z' in soundPosition) {
      const zMin = Math.min(earPosition.z, soundPosition.z);
      const zMax = Math.max(earPosition.z, soundPosition.z);

      const activeElevations = surfaceElevations ?? MufflingCalculatorService.getSurfaceElevations();

      const units = getGame()?.canvas?.scene?.grid?.units || 'ft';
      WHEUtils.log(`Total active elevations found: ${activeElevations.length} in range [${zMin}${units}, ${zMax}${units}]`);

      const elevationsBetween = activeElevations
        .filter((e: number) => e > zMin && e < zMax)
        .sort((a: number, b: number) => a - b);

      if (elevationsBetween.length > 0) {
        WHEUtils.log(`Elevations between: ${elevationsBetween.map((e) => `${e}${units}`).join(', ')}`);
        const floorThickness = WHESettings.getInstance().getNumber(WHEConstants.SETTING_FLOOR_THICKNESS, 10);
        let mergedFloors = 0;
        let lastElevation = -Infinity;

        for (const elevation of elevationsBetween) {
          if (elevation > lastElevation + floorThickness) {
            mergedFloors++;
            lastElevation = elevation;
          }
        }
        wallMufflingSum += mergedFloors;
      } else if (activeElevations.length > 0) {
        WHEUtils.log('No elevations found between the points range.');
      }
    }

    // Estimating how much to muffle
    let finalMuffling = Math.floor(wallMufflingSum);

    // Special case: Ethereal path (no move-blocking walls or floors)
    const hasMoveBlockingWalls = moveCollisions.length > 0;
    const hasFloors =
      'z' in earPosition &&
      'z' in soundPosition &&
      wallMufflingSum > (sightCollisions.length + moveCollisions.length) * 0.5;

    if (!hasMoveBlockingWalls && !hasFloors && sightCollisions.length > 0) {
      WHEUtils.log('Ethereal path detected, forcing 0 muffling');
      finalMuffling = 0;
    }

    WHEUtils.log(`Collision walls (MOVE): ${moveCollisions.length}`);
    WHEUtils.log(`Collision walls (SIGHT): ${sightCollisions.length}`);
    WHEUtils.log(`Wall Muffling Sum: ${wallMufflingSum}`);

    // Acoustic Portal Logic
    if (finalMuffling > 0 && 'z' in earPosition && 'z' in soundPosition && !ignorePortals) {
      const activePortals =
        portals ??
        ((getGame()?.canvas?.regions as any)?.placeables || []).filter((r: any) =>
          r.document?.behaviors?.some(
            (b: any) =>
              b.type === 'teleport' ||
              b.type === 'changeLevel' ||
              b.type === 'core.teleport' ||
              b.type === 'core.changeLevel',
          ),
        );

      if (activePortals.length > 0) {
        let bestMuffling = finalMuffling;

        for (const portal of activePortals) {
          const portalBottom = portal.document?.elevation?.bottom ?? 0;
          let portalTop = portal.document?.elevation?.top ?? portalBottom;

          if (!Number.isFinite(portalTop)) {
            portalTop = portalBottom;
          }

          const portalZ = (portalBottom + portalTop) / 2;

          const portalPoint: Point3D = { x: portal.center.x, y: portal.center.y, z: portalZ };

          const muffling1 = MufflingCalculatorService.getMufflingIndexBetweenPoints(
            earPosition,
            portalPoint,
            true,
            surfaceElevations,
            portals,
          );

          // Optimization: skip second raycast if the first leg is already equal or worse
          if (muffling1 >= bestMuffling) continue;

          const muffling2 = MufflingCalculatorService.getMufflingIndexBetweenPoints(
            portalPoint,
            soundPosition,
            true,
            surfaceElevations,
            portals,
          );

          const totalPortalMuffling = muffling1 + muffling2;
          if (totalPortalMuffling < bestMuffling) {
            WHEUtils.log('Acoustic Portal found a better path via Region', portal.id);
            bestMuffling = totalPortalMuffling;
          }
        }

        finalMuffling = bestMuffling;
      }
    }

    return WHEUtils.clamp(finalMuffling, 0, 5) ?? 0;
  };

  /**
   * Retrieves all surface elevations from the current scene (supporting Levels and V14 native levels).
   * @returns {number[]} An array of sorted elevation values.
   */
  public static getSurfaceElevations = (surfaces?: any): number[] => {
    let activeSurfaces: any = surfaces ?? [];

    if (!Array.isArray(activeSurfaces) || activeSurfaces.length === 0) {
      activeSurfaces = (getGame()?.canvas?.scene as any)?.getSurfaces?.() || [];
    }

    // Fallback for native V14 levels if no surfaces found (e.g. not using Levels module)
    if ((activeSurfaces.length ?? activeSurfaces.size ?? 0) === 0) {
      activeSurfaces = (getGame()?.canvas?.scene as any)?.levels ?? [];
    }

    // Normalize to array of documents/objects (handle Collections and Sets)
    const surfaceArray: any[] = Array.isArray(activeSurfaces)
      ? activeSurfaces
      : activeSurfaces.contents ?? Array.from(activeSurfaces.values?.() ?? activeSurfaces);

    return surfaceArray
      .map((s: any) => {
        const doc = s.document ?? s;
        const e = s.elevation ?? doc.elevation;
        // In V14 elevation can be an object {bottom, top}
        const val = typeof e === 'object' ? (e?.bottom ?? e?.top ?? 0) : (e ?? 0);
        return Number(val);
      })
      .filter((e: number) => !isNaN(e));
  };


  /**
   * Measures the distance between two points using the canvas grid.
   * @param {Point3D | foundry.canvas.Canvas.Point} pointA - The first point.
   * @param {Point3D | foundry.canvas.Canvas.Point} pointB - The second point.
   * @returns {number} The calculated distance.
   */
  public static getDistanceBetweenPoints = (
    pointA: Point3D | foundry.canvas.Canvas.Point,
    pointB: Point3D | foundry.canvas.Canvas.Point,
  ): number => {
    const horizontalDistance = getGame()!.canvas!.grid!.measurePath([pointA, pointB], {}).distance;

    let elevationDiff = 0;
    if ('z' in pointA && 'z' in pointB) {
      elevationDiff = Math.abs((pointA as Point3D).z - (pointB as Point3D).z);
    }

    const trueDistance = Math.round(Math.hypot(horizontalDistance, elevationDiff));

    WHEUtils.log('True Distance: ', trueDistance);

    return trueDistance;
  };
}
