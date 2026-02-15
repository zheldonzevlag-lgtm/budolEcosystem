module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/apps/admin/app/$1',
  },
  testMatch: [
    '<rootDir>/scripts/test_scripts/**/*.test.{ts,js}',
    '<rootDir>/../scripts/test_scripts/**/*.test.{ts,js}',
    '<rootDir>/services/**/*.test.{ts,js}'
  ],
};
