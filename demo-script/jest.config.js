module.exports = {
    verbose: true,
    roots: ['<rootDir>/src'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
        '^.+\\.jsx?$': 'babel-jest',
    },
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    testEnvironment: 'node',
    modulePaths: ['node_modules', '<rootDir>/src'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    maxWorkers: 1,
    forceExit: true,
    preset: 'ts-jest',
    // Transform ES modules from node_modules
    // transformIgnorePatterns: ['node_modules/(?!(@hdriel/whatsapp-socket)/)'],
};
