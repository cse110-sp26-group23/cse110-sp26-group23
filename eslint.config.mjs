import jsdoc from 'eslint-plugin-jsdoc';

export default [
  {
    files: ['source/**/*.js'],
    plugins: { jsdoc },
    settings: {
      jsdoc: { mode: 'jsdoc' },
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
      },
    },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.name="require"]',
          message: 'CommonJS require() is not allowed. Use ES module import instead.',
        },
        {
          selector: 'MemberExpression[object.name="module"][property.name="exports"]',
          message: 'CommonJS module.exports is not allowed. Use named ES module exports.',
        },
        {
          selector: 'AssignmentExpression[left.object.name="exports"]',
          message: 'CommonJS exports.* is not allowed. Use named ES module exports.',
        },
        {
          selector: 'ExportDefaultDeclaration',
          message: 'Default exports are not allowed. Use named exports (see docs/testing.md).',
        },
      ],
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'warn',
      'jsdoc/valid-types': 'error',
      'jsdoc/check-tag-names': 'error',
      'jsdoc/require-param-type': 'error',
      'jsdoc/require-returns-type': 'error',
    },
  },
  {
    files: ['source/tests/**/*.test.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        spyOn: 'readonly',
        xit: 'readonly',
        xdescribe: 'readonly',
        fit: 'readonly',
        fdescribe: 'readonly',
        jasmine: 'readonly',
      },
    },
  },
  {
    files: ['e2e/**/*.spec.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { process: 'readonly', console: 'readonly' },
    },
  },
  {
    // Playwright's defineConfig uses a default export, which the base block
    // forbids via no-restricted-syntax. Scope the exception to this one file.
    files: ['playwright.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { process: 'readonly' },
    },
    rules: { 'no-restricted-syntax': 'off' },
  },
];
