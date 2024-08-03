module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/e2e/**/*.ts?(x)', '**/?(*.)+(e2e).ts?(x)'],
    testPathIgnorePatterns: ['/node_modules/'],
    setupFiles: ['./jest.setup.js']
  };
  