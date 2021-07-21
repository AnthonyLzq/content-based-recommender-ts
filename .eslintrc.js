module.exports = {
  extends: ['prettier'],
  plugins: ['eslint-plugin-import'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  env: {
    mocha: true
  },
  rules: {
    'no-console': 0,
    'no-underscore-dangle': 0,
    'class-methods-use-this': 0,
    semi: [2, 'never'],
    'arrow-parens': ['error', 'as-needed'],
    'comma-dangle': ['error', 'never'],
    'keyword-spacing': ['error', { after: true, before: true }],
    'max-len': [
      'error',
      {
        code: 80,
        ignoreComments: true,
        ignoreRegExpLiterals: true,
        ignoreTemplateLiterals: true,
        ignoreTrailingComments: true,
        ignoreStrings: true,
        ignoreUrls: true
      }
    ],
    'newline-before-return': 'error',
    'no-extra-parens': 'error',
    'object-curly-spacing': ['error', 'always'],
    'prefer-const': 'error',
    'space-before-function-paren': [
      'error',
      {
        anonymous: 'always',
        named: 'never',
        asyncArrow: 'always'
      }
    ],
    curly: ['error', 'multi']
  }
}
