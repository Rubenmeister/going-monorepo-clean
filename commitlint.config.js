module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation
        'style',    // Formatting, missing semi-colons, etc
        'refactor', // Code change that neither fixes a bug nor adds a feature
        'perf',     // Performance improvement
        'test',     // Adding tests
        'build',    // Changes to build process
        'ci',       // CI configuration
        'chore',    // Maintenance
        'revert',   // Revert a commit
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'api-gateway',
        'user-auth',
        'booking',
        'tours',
        'transport',
        'payment',
        'tracking',
        'notifications',
        'host',
        'experience',
        'parcel',
        'webapp',
        'mobile-user',
        'mobile-driver',
        'dashboard',
        'shared',
        'deps',
        'ci',
        'config',
      ],
    ],
    'scope-empty': [1, 'never'],
    'subject-case': [2, 'always', 'lower-case'],
  },
};
