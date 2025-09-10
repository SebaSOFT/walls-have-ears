/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['./jest.setup.js'],
  transform: {
    '^.+\.(ts|js)$': 'ts-jest',
  },
  transformIgnorePatterns: ['/node_modules/'],
};
