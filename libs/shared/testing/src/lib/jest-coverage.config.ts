/**
 * Jest Coverage Configuration
 * Centralized coverage thresholds and rules for the monorepo
 */

export const COVERAGE_THRESHOLDS = {
  // Global thresholds (apply to all files)
  global: {
    branches: 60,
    functions: 60,
    lines: 60,
    statements: 60,
  },

  // Service-specific thresholds (higher for critical services)
  services: {
    payment: { branches: 75, functions: 75, lines: 75, statements: 75 },
    tracking: { branches: 70, functions: 70, lines: 70, statements: 70 },
    transport: { branches: 70, functions: 70, lines: 70, statements: 70 },
    booking: { branches: 65, functions: 65, lines: 65, statements: 65 },
    auth: { branches: 75, functions: 75, lines: 75, statements: 75 },
    security: { branches: 80, functions: 80, lines: 80, statements: 80 },
    default: { branches: 60, functions: 60, lines: 60, statements: 60 },
  },

  // Paths to exclude from coverage
  excludePaths: [
    // Main/bootstrap files
    '**/main.ts',
    '**/index.ts',
    '**/*.module.ts',
    '**/*.d.ts',

    // Generated files
    '**/*.generated.ts',
    '**/generated/**',

    // Test helpers and fixtures
    '**/__tests__/fixtures/**',
    '**/__tests__/helpers/**',
    '**/test-helpers/**',
    '**/*.test.utils.ts',
    '**/*.test.data.ts',

    // Storybook and UI demos
    '**/*.stories.ts',
    '**/*.stories.tsx',
    '**/stories/**',

    // Configuration and setup
    '**/jest.setup.ts',
    '**/jest.teardown.ts',
    '**/*.config.ts',
    '**/*.config.js',

    // Third-party and mock files
    '**/node_modules/**',
    '**/__mocks__/**',

    // Database migrations and seeds
    '**/migrations/**',
    '**/seeds/**',

    // Deprecated code
    '**/deprecated/**',
  ],

  // Files that MUST have high coverage
  criticalPaths: [
    // Domain logic
    '**/*domain/**/*.ts',
    '**/*use-cases/**/*.ts',

    // Repository implementations
    '**/*repository*.ts',

    // Services and gateways
    '**/*service.ts',
    '**/*gateway.ts',

    // Security-critical modules
    '**/security/**/*.ts',
    '**/auth/**/*.ts',

    // Pagination and database utilities
    '**/pagination*.ts',
    '**/redis-pool*.ts',
  ],
};

export const JEST_CONFIG_TEMPLATE = (serviceName: string) => ({
  displayName: serviceName,
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        tsconfig: `<rootDir>/tsconfig.spec.json`,
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/*.d.ts',
    '!src/**/__mocks__/**',
    '!src/**/*.stories.ts',
  ],
  coverageDirectory: `../../coverage/${serviceName}`,
  coverageReporters: ['text', 'text-summary', 'html', 'lcov', 'json'],
});

/**
 * Get coverage threshold for a service
 */
export function getCoverageThreshold(serviceName: string) {
  const serviceKey = serviceName
    .toLowerCase()
    .replace('-service', '')
    .replace('-e2e', '');

  return (
    COVERAGE_THRESHOLDS.services[serviceKey] ||
    COVERAGE_THRESHOLDS.services.default
  );
}

/**
 * Build coveragePathIgnorePatterns from exclude paths
 */
export function buildCoveragePathIgnorePatterns(): string[] {
  return COVERAGE_THRESHOLDS.excludePaths.map((path) => {
    // Convert glob patterns to regex
    return path
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\//g, '\\/')
      .replace(/\./g, '\\.');
  });
}

/**
 * Check if a path should be covered (critical coverage)
 */
export function isCriticalPath(filePath: string): boolean {
  return COVERAGE_THRESHOLDS.criticalPaths.some((pattern) => {
    const regex = new RegExp(
      pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*')
    );
    return regex.test(filePath);
  });
}
