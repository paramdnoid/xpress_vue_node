

import vue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import unusedImports from 'eslint-plugin-unused-imports'
import babelParser from '@babel/eslint-parser'

export default [
  // Frontend: Vue 3
  {
    files: ['./frontend/src/**/*.{js,ts,vue}'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: babelParser,
        requireConfigFile: false,
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      vue,
      'unused-imports': unusedImports,
    },
    rules: {
      'vue/no-unused-components': 'warn',
      'vue/multi-word-component-names': 'off',
      'unused-imports/no-unused-imports': 'warn',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  // Backend: Node.js
  {
    files: ['./backend/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      'unused-imports/no-unused-imports': 'warn',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
]