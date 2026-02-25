import { defineConfig } from 'eslint/config';
import globals from 'globals';
import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import reactPlugin from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default defineConfig([
  {
    ignores: [
      '.next/*',
      'node_modules/*',
      'scripts/*.md',
      'scripts/*.ps1',
      'scripts/*.sh',
      'scripts/*.sql',
      'scripts/*.json',
      'scripts/*.bat',
      'documentation/**',
      'backups/**',
      'scripts/check-raw-lalamove-api.js',
      'fix-order-driver-data.js',
      'scripts/test_scripts/fix-order-driver-data.js',
      'scripts/test_scripts_2/check-raw-lalamove-api.js',
      'scripts/test-order-data.json',
      'scripts/ultimate-test-data.json',
      'scripts/victory-order-data.json',
      'scripts/order-shipping-data.json',
      'scripts/final-verification-data.json',
      'scripts/final-order-data.json',
      'scripts/current-order-data.json'
    ],
  },
  js.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {},
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
    },
  },
  {
    plugins: {
      react: reactPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      'react/prop-types': 'off',
    },
  },
  {
    plugins: {
      'react-hooks': hooksPlugin,
    },
    rules: hooksPlugin.configs.recommended.rules,
  },
  {
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
  {
    files: [
      '**/*.test.{js,jsx,ts,tsx}',
      '**/*.spec.{js,jsx,ts,tsx}',
      '**/__tests__/**/*.{js,jsx,ts,tsx}',
      'scripts/test_scripts/**/*.{js,jsx,ts,tsx}'
    ],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
  {
          files: ['app/api/**/*.js', 'lib/**/*.js', 'services/**/*.js', 'components/**/*.js', 'app/**/*.js', 'components/**/*.jsx', 'app/**/*.jsx'],
          rules: {
            'no-unused-vars': 'off',
            'no-empty': 'off',
            'no-loss-of-precision': 'off',
            'no-undef': 'off',
            'no-useless-escape': 'off',
            'react/no-unknown-property': 'off',
            'react/no-unescaped-entities': 'off',
            'react/jsx-no-target-blank': 'off',
            'react-hooks/exhaustive-deps': 'off',
            'react-hooks/rules-of-hooks': 'off',
            'react-hooks/immutability': 'off',
            'react-hooks/set-state-in-effect': 'off',
            'react-hooks/purity': 'off',
            '@next/next/no-img-element': 'off',
          },
        },
  {
          files: ['hooks/**/*.js', 'hooks/**/*.jsx'],
          rules: {
            'react-hooks/set-state-in-effect': 'off',
            'react-hooks/purity': 'off',
          },
        },
  {
          files: ['scripts/**/*.js', 'scripts/*.js', 'scripts/**/*.cjs', 'scripts/*.cjs', 'test-*.js', 'quick-test.js', 'debug-*.js', 'scripts/**/*.mjs', 'scripts/*.mjs', '*.js', '*.cjs'],
          rules: {
            'no-unused-vars': 'off',
            'no-console': 'off',
            'no-loss-of-precision': 'off',
            'no-useless-escape': 'off',
            'no-empty': 'off',
          },
        },
  {
          files: [
            '**/*.test.{js,jsx,ts,tsx}',
            '**/*.spec.{js,jsx,ts,tsx}',
            '**/__tests__/**/*.{js,jsx,ts,tsx}',
            'scripts/test_scripts/**/*.{js,jsx,ts,tsx}'
          ],
          rules: {
            'no-unused-vars': 'off',
            'react/display-name': 'off',
          },
        },
]);
