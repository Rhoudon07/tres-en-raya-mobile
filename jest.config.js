/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^expo-audio$': '<rootDir>/__tests__/__mocks__/expo-audio.ts',
    '^expo-haptics$': '<rootDir>/__tests__/__mocks__/expo-haptics.ts',
    '^@react-native-async-storage/async-storage$': '<rootDir>/__tests__/__mocks__/async-storage.ts',
    '\\.(wav|mp3|png|jpg|jpeg|gif)$': '<rootDir>/__tests__/__mocks__/fileMock.js',
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
};
