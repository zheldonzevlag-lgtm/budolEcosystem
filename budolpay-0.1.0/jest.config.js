module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/apps/admin/app/$1',
  },
  testMatch: ['**/scripts/test_scripts/**/*.test.ts'],
};
