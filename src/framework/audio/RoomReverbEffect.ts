const BaseClass: any =
  typeof GainNode !== 'undefined'
    ? GainNode
    : class {
        public gain: any;
        constructor(_context: any) {
          this.gain = { value: 1.0 };
        }
        public connect(_destination: any, _outputNum?: number, _inputNum?: number): any {
          return {};
        }
        public disconnect(): void {
          return;
        }
      };

/**
 * Lightweight, self-contained Web Audio API algorithmic reverb chain.
 * Implements a feedback delay loop with a low-pass filter for absorption.
 * Compatible with Foundry VTT V14 Sound effects pipeline by extending GainNode.
 */
export default class RoomReverbEffect extends BaseClass {
  public output: any;

  private delayNode: any;
  private feedbackNode: any;
  private filterNode: any;
  private wetGainNode: any;
  private dryGainNode: any;

  constructor(context: AudioContext) {
    super(context);
    this.gain.value = 1.0; // Input node gain is 1.0

    if (typeof context.createGain === 'function') {
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

      // Connect Dry Path (using 'this' as the input node via super.connect)
      super.connect(this.dryGainNode);
      this.dryGainNode.connect(this.output);

      // Connect Wet Path (using 'this' as the input node via super.connect)
      super.connect(this.delayNode);
      this.delayNode.connect(this.filterNode);
      this.filterNode.connect(this.wetGainNode);
      this.wetGainNode.connect(this.output);

      // Feedback loop from filter back to delay
      this.filterNode.connect(this.feedbackNode);
      this.feedbackNode.connect(this.delayNode);
    } else {
      // Mock properties for JSDOM tests
      this.output = {
        connect: () => {
          return {};
        },
        disconnect: () => {
          return;
        },
      };
      this.dryGainNode = { gain: { value: 1.0 } };
      this.wetGainNode = { gain: { value: 0.0 } };
      this.delayNode = { delayTime: { value: 0.0 } };
      this.feedbackNode = { gain: { value: 0.0 } };
      this.filterNode = { frequency: { value: 3000 } };
    }
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

  /**
   * Overrides the native connect method to route the external connection from the output node.
   */
  public connect(destination: AudioNode | AudioParam, outputNum?: number, inputNum?: number): any {
    return this.output.connect(destination as any, outputNum, inputNum);
  }

  /**
   * Overrides the native disconnect method to disconnect both internal and external connections.
   */
  public disconnect(): void {
    super.disconnect();
    this.output.disconnect();
  }
}
