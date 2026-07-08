import RoomReverbEffect from './RoomReverbEffect';

describe('RoomReverbEffect', () => {
  let context: any;

  beforeEach(() => {
    context = {
      createGain: jest.fn().mockImplementation(() => ({
        gain: { value: 1.0 },
        connect: jest.fn(),
        disconnect: jest.fn(),
      })),
      createDelay: jest.fn().mockImplementation(() => ({
        delayTime: { value: 0.0 },
        connect: jest.fn(),
        disconnect: jest.fn(),
      })),
      createBiquadFilter: jest.fn().mockImplementation(() => ({
        type: 'lowpass',
        frequency: { value: 3000 },
        connect: jest.fn(),
        disconnect: jest.fn(),
      })),
    };
  });

  test('constructs and initializes audio node chains', () => {
    const reverb = new RoomReverbEffect(context);
    expect(reverb).toBeDefined();
    expect(context.createGain).toHaveBeenCalled();
    expect(context.createDelay).toHaveBeenCalledWith(2.0);
    expect(context.createBiquadFilter).toHaveBeenCalled();
  });

  test('updates audio node parameter values', () => {
    const reverb = new RoomReverbEffect(context);
    reverb.update({
      delayTime: 0.5,
      feedback: 0.8,
      dampening: 2500,
      wetGain: 0.6,
      dryGain: 0.4,
    });

    expect(reverb['delayNode'].delayTime.value).toBe(0.5);
    expect(reverb['feedbackNode'].gain.value).toBe(0.8);
    expect(reverb['filterNode'].frequency.value).toBe(2500);
    expect(reverb['wetGainNode'].gain.value).toBe(0.6);
    expect(reverb['dryGainNode'].gain.value).toBe(0.4);
  });

  test('connects output node to destination', () => {
    const reverb = new RoomReverbEffect(context);
    const destination = {};
    reverb.connect(destination as any);

    expect(reverb.output.connect).toHaveBeenCalledWith(destination, undefined, undefined);
  });

  test('disconnects output node without calling super.disconnect()', () => {
    const reverb = new RoomReverbEffect(context);
    const spySuperDisconnect = jest.spyOn(Object.getPrototypeOf(RoomReverbEffect.prototype), 'disconnect');

    reverb.disconnect();

    expect(reverb.output.disconnect).toHaveBeenCalled();
    // Verify super.disconnect (the gain node's internal disconnect) was not called to prevent losing internal routing
    expect(spySuperDisconnect).not.toHaveBeenCalled();
  });
});
