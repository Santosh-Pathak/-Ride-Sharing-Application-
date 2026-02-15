/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'prettier',
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  overrides: [
    {
      files: ['**/tests/**/*.js', '**/*.test.js', '**/*.spec.js'],
      env: { jest: true },
      rules: {
        'node/no-unpublished-require': 'off',
      },
    },
    {
      files: ['scripts/**/*.js'],
      rules: {
        'no-console': 'off',
        'node/shebang': 'off',
      },
    },
  ],
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'node/no-unsupported-features/es-syntax': 'off',
    'node/no-missing-require': 'off',
    'node/no-unpublished-require': 'off',
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'coverage/',
    '*.min.js',
    'infrastructure/',
  ],
};
