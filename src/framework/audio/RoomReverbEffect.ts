/**
 * Lightweight, self-contained Web Audio API algorithmic reverb chain.
 * Implements a feedback delay loop with a low-pass filter for absorption.
 * Compatible with Foundry VTT V14 Sound effects pipeline.
 */
export default class RoomReverbEffect {
  public input: AudioNode;
  public output: AudioNode;

  private delayNode: DelayNode;
  private feedbackNode: GainNode;
  private filterNode: BiquadFilterNode;
  private wetGainNode: GainNode;
  private dryGainNode: GainNode;

  constructor(context: AudioContext) {
    this.input = context.createGain();
    this.output = context.createGain();

    this.dryGainNode = context.createGain();
    this.wetGainNode = context.createGain();
    this.delayNode = context.createDelay(2.0); // max delay 2 seconds
    this.feedbackNode = context.createGain();
    this.filterNode = context.createBiquadFilter();

    // Configure nodes
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.value = 3000;
    this.dryGainNode.gain.value = 1.0;
    this.wetGainNode.gain.value = 0.0;
    this.feedbackNode.gain.value = 0.0;

    // Connect Dry Path
    this.input.connect(this.dryGainNode);
    this.dryGainNode.connect(this.output);

    // Connect Wet Path (Feedback Loop)
    // input -> delay -> filter -> wetGain -> output
    this.input.connect(this.delayNode);
    this.delayNode.connect(this.filterNode);
    this.filterNode.connect(this.wetGainNode);
    this.wetGainNode.connect(this.output);

    // Feedback loop from filter back to delay
    this.filterNode.connect(this.feedbackNode);
    this.feedbackNode.connect(this.delayNode);
  }

  /**
   * Dynamically update parameters of the Web Audio nodes.
   * @param {object} options - The parameters to update.
   * @param {number} options.delayTime - The delay time in seconds.
   * @param {number} options.feedback - The feedback gain multiplier (0.0 to 0.95).
   * @param {number} options.dampening - The cutoff frequency in Hz.
   * @param {number} options.wetGain - The mix ratio for the wet path (0.0 to 1.0).
   * @param {number} options.dryGain - The mix ratio for the dry path (0.0 to 1.0).
   */
  public update(options: { delayTime: number; feedback: number; dampening: number; wetGain: number; dryGain: number }) {
    this.delayNode.delayTime.value = options.delayTime;
    this.feedbackNode.gain.value = options.feedback;
    this.filterNode.frequency.value = options.dampening;
    this.wetGainNode.gain.value = options.wetGain;
    this.dryGainNode.gain.value = options.dryGain;
  }

  public connect(destination: AudioNode) {
    this.output.connect(destination);
  }

  public disconnect() {
    this.output.disconnect();
  }
}
