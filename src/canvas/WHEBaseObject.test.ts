import WHEBaseObject from './WHEBaseObject';
describe('WHEBaseObject', () => {
  it('should be defined', () => {
    expect(WHEBaseObject).toBeDefined();
  });
  it('should be a class', () => {
    expect(typeof WHEBaseObject).toBe('function');
  });
  it('should be able to be instantiated', () => {
    const wheBaseObject = new WHEBaseObject();
    expect(wheBaseObject).toBeInstanceOf(WHEBaseObject);
  });
});
