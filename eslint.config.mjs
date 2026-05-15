export default [
  {
    files: ['source/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
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
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'warn',
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
];
