import WHEUtils from '../../utils/WHEUtils';
import { getGame } from '../../foundry/getGame';

export default class MufflingCalculatorService {
  /**
   * Calculates the muffling index between two points by testing for collisions.
   * It uses sight, sound, and move collision layers to determine the level of obstruction.
   * @param {foundry.canvas.Canvas.Point} earPosition - The point representing the listener (e.g., token center).
   * @param {foundry.canvas.Canvas.Point} soundPosition - The point representing the sound source.
   * @returns {number} A muffling index from -1 to 5, where -1 is no obstruction and 5 is maximum obstruction.
   */
  public static getMufflingIndexBetweenPoints = (
    earPosition: foundry.canvas.Canvas.Point,
    soundPosition: foundry.canvas.Canvas.Point,
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
      return -1;
    }

    // New windows come by default with a distance triggering of the sight,
    // which we need to filter to keep (available) windows as 0 muffling
    sightCollisions = sightCollisions.filter((impactVertex) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const wall = impactVertex.edges.first().object as Wall;

      const wallCenter = wall.center;

      const sightDistance = wall.document.threshold.sight;
      if (!sightDistance) {
        return true;
      }
      const tokenDistance = MufflingCalculatorService.getDIstanceBetweenPoints(earPosition, wallCenter);

      WHEUtils.log(`Maximum sight: ${sightDistance}`);
      WHEUtils.log(`Distance to Wall: ${tokenDistance}`);
      // If token is close to the window it should be open and not represent a sight collision
      return tokenDistance >= sightDistance;
    });

    // Then again if terrain collisions exist, you are in the same room
    const noTerrainSenseCollisions = sightCollisions.filter((impactVertex) => {
      const wall = impactVertex?.edges?.first()?.isLimited('sight');
      return !wall;
    });

    // This already takes into account open doors
    const moveCollisions = moveLayer.testCollision(earPosition, soundPosition, { type: 'move', mode: 'all' });

    // Present the results
    WHEUtils.log(`Collision walls (MOVE): ${moveCollisions.length}`);
    WHEUtils.log(`Collision walls (SIGHT): ${sightCollisions.length}`);
    WHEUtils.log(`Collision walls (SIGHT excl. terrain ): ${noTerrainSenseCollisions.length}`);

    // Estimating how much to muffle
    // See image:
    const finalMuffling = Math.floor((noTerrainSenseCollisions.length + moveCollisions.length) / 2);

    // Account for ethereal walls
    if (sightCollisions.length >= 1 && moveCollisions.length === 0) {
      WHEUtils.log('There is at least an ethereal wall');
      return 0;
    }

    return WHEUtils.clamp(finalMuffling, 0, 5) ?? 0;
  };

  /**
   * Measures the distance between two points using the canvas grid.
   * @param {foundry.canvas.Canvas.Point} poinA - The first point.
   * @param {foundry.canvas.Canvas.Point} pointB - The second point.
   * @returns {number} The calculated distance.
   */
  public static getDIstanceBetweenPoints = (
    poinA: foundry.canvas.Canvas.Point,
    pointB: foundry.canvas.Canvas.Point,
  ): number => {
    const horizontalDistance = getGame()!.canvas!.grid!.measurePath([poinA, pointB], {}).distance;

    // TODO meassure elevation
    //const elevationDiff = Math.abs(token.document.elevation - target.document.elevation);
    //const trueDistance = Math.round(Math.hypot(horizontalDistance, elevationDiff));

    WHEUtils.log('Horizontal Distance: ', horizontalDistance);

    return horizontalDistance;
  };
}
