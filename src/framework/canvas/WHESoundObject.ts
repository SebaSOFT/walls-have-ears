import WHEBaseObject from './WHEBaseObject';

export default class WHESoundObject extends WHEBaseObject {
  /**
   * Construct a WHESoundObject object
   * @param {string} soundId the sound ID for this sound
   * @param {number} mufflingLevel the muffling level for this sound or 0 to be unmuffled
   */
  constructor(
    private readonly soundId: string,
    private mufflingLevel: number,
  ) {
    super();
  }

  /**
   * Returns true if any muffling is applied
   * @returns {boolean} TRUE if any muffling is applied
   */
  public isMuffled(): boolean {
    return this.mufflingLevel > 0;
  }

  /**
   * The sound ID corresponding to the current sound
   * @returns {null|string} the sound ID or null
   */
  public getId(): string | null {
    return this.soundId;
  }

  /**
   * Gets the muffling Level for this sound
   * @returns {number}  muffling level or 0 if not muffled
   */
  public getMufflingLevel(): number {
    return this.mufflingLevel;
  }

  /**
   * Sets the muffling level for this sound
   * @param {number} mufflingLevel a positive float number that represents the muffling
   */
  public setMufflingLevel(mufflingLevel: number): void {
    if (mufflingLevel < 0) {
      mufflingLevel = 0;
    }
    this.mufflingLevel = mufflingLevel;
  }
}
