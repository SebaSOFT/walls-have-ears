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
});
