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
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(budolshap-0.1.0)/)',
  ],
};
