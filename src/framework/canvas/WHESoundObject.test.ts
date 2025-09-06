import WHESoundObject from './WHESoundObject';
describe('WHESoundObject', () => {
  it('should be defined', () => {
    expect(WHESoundObject).toBeDefined();
  });
  it('should be a class', () => {
    expect(typeof WHESoundObject).toBe('function');
  });
  it('should be able to be instantiated', () => {
    const wheSoundObject = new WHESoundObject('hello', 0);
    expect(wheSoundObject).toBeInstanceOf(WHESoundObject);
  });

  it('should set the soundId and mufflingLevel correctly', () => {
    const soundId = 'test-sound-id';
    const mufflingLevel = 0.5;
    const wheSoundObject = new WHESoundObject(soundId, mufflingLevel);
    expect(wheSoundObject.getId()).toBe(soundId);
    expect(wheSoundObject.getMufflingLevel()).toBe(mufflingLevel);
  });
});

describe('isMuffled', () => {
  it('should return false when mufflingLevel is 0', () => {
    const wheSoundObject = new WHESoundObject('test-id', 0);
    expect(wheSoundObject.isMuffled()).toBe(false);
  });

  it('should return true when mufflingLevel is greater than 0', () => {
    const wheSoundObject = new WHESoundObject('test-id', 0.5);
    expect(wheSoundObject.isMuffled()).toBe(true);
  });
});

describe('setMufflingLevel', () => {
  it('should update the muffling level', () => {
    const wheSoundObject = new WHESoundObject('test-id', 0.2);
    const newMufflingLevel = 0.8;
    wheSoundObject.setMufflingLevel(newMufflingLevel);
    expect(wheSoundObject.getMufflingLevel()).toBe(newMufflingLevel);
  });

  it('should clamp negative muffling level to 0', () => {
    const wheSoundObject = new WHESoundObject('test-id', 0.5);
    wheSoundObject.setMufflingLevel(-1);
    expect(wheSoundObject.getMufflingLevel()).toBe(0);
  });
});
