import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/dist',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            // ============================================
            // SCOPE RULES - What can import what
            // ============================================
            
            // Shared libs can only depend on other shared libs
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
            
            // Domain libs can depend on shared and same domain
            {
              sourceTag: 'scope:domain',
              onlyDependOnLibsWithTags: ['scope:shared', 'scope:domain'],
            },
            
            // Backend services can depend on shared and domain libs
            {
              sourceTag: 'scope:backend',
              onlyDependOnLibsWithTags: ['scope:shared', 'scope:domain'],
            },
            
            // Frontend apps can depend on shared, domain, and frontend libs
            {
              sourceTag: 'scope:frontend',
              onlyDependOnLibsWithTags: ['scope:shared', 'scope:domain', 'scope:frontend'],
            },
            
            // Mobile apps can depend on shared, domain, and mobile libs
            {
              sourceTag: 'scope:mobile',
              onlyDependOnLibsWithTags: ['scope:shared', 'scope:domain', 'scope:mobile'],
            },
            
            // ============================================
            // TYPE RULES - Layer enforcement
            // ============================================
            
            // Core/domain layer cannot depend on application/infrastructure
            {
              sourceTag: 'type:core',
              onlyDependOnLibsWithTags: ['type:core', 'type:util'],
            },
            
            // Application layer can depend on core and utils
            {
              sourceTag: 'type:application',
              onlyDependOnLibsWithTags: ['type:core', 'type:application', 'type:util'],
            },
            
            // Feature libs can depend on anything except other features
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: ['type:core', 'type:application', 'type:util', 'type:ui'],
            },
            
            // Fallback: allow all for untagged
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    rules: {},
  },
];
