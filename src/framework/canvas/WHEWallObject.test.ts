import WHEWallObject from './WHEWallObject';
describe('WHEWallObject', () => {
  it('should be defined', () => {
    expect(WHEWallObject).toBeDefined();
  });
  it('should be a class', () => {
    expect(typeof WHEWallObject).toBe('function');
  });
  it('should be able to be instantiated', () => {
    const wheWallObject = new WHEWallObject();
    expect(wheWallObject).toBeInstanceOf(WHEWallObject);
  });
});
