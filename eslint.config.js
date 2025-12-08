import js from '@eslint/js'
import globals from 'globals'
import pluginVue from 'eslint-plugin-vue'
import pluginQuasar from '@quasar/app-webpack/eslint'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'

// the following is optional, if you want prettier too:
import prettierSkipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default defineConfigWithVueTs(
  {
    /**
     * Ignore the following files.
     * Please note that pluginQuasar.configs.recommended() already ignores
     * the "node_modules" folder for you (and all other Quasar project
     * relevant folders and files).
     *
     * ESLint requires "ignores" key to be the only one in this object
     */
    ignores: [
      "/dist",
      "/src-bex/www",
      "/src-capacitor",
      "/src-cordova",
      "/.quasar",
      "/node_modules",
      ".eslintrc.js",
      "babel.config.js",
      "/src-ssr",
    ]
  },

  pluginQuasar.configs.recommended(),
  js.configs.recommended,

  /**
   * https://eslint.vuejs.org
   *
   * pluginVue.configs.base
   *   -> Settings and rules to enable correct ESLint parsing.
   * pluginVue.configs[ 'flat/essential']
   *   -> base, plus rules to prevent errors or unintended behavior.
   * pluginVue.configs["flat/strongly-recommended"]
   *   -> Above, plus rules to considerably improve code readability and/or dev experience.
   * pluginVue.configs["flat/recommended"]
   *   -> Above, plus rules to enforce subjective community defaults to ensure consistency.
   */
  pluginVue.configs[ 'flat/essential' ],

  {
    files: ['**/*.ts', '**/*.vue'],
    rules: {
      // '@typescript-eslint/consistent-type-imports': [
      //   'error',
      //   { prefer: 'type-imports' }
      // ],
    }
  },
  // https://github.com/vuejs/eslint-config-typescript
  vueTsConfigs.recommendedTypeChecked,

  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',

      globals: {
        ...globals.browser,
        ...globals.node, // SSR, Electron, config files
        process: 'readonly', // process.env.*
        ga: 'readonly', // Google Analytics
        cordova: 'readonly',
        Capacitor: 'readonly',
        chrome: 'readonly', // BEX related
        browser: 'readonly' // BEX related
      }
    },

    // add your custom rules here
    rules: {
      'prefer-promise-reject-errors': 'off',

      quotes: ['warn', 'double', { avoidEscape: true }],

      // this rule, if on, would require explicit return type on the `render` function
      '@typescript-eslint/explicit-function-return-type': 'off',

      // in plain CommonJS modules, you can't use `import foo = require('foo')` to pass this rule, so it has to be disabled
      '@typescript-eslint/no-var-requires': 'off',

      // The core 'no-unused-vars' rules (in the eslint:recommended ruleset)
      // does not work with type definitions
      'no-unused-vars': 'off',

      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/unbound-method": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/restrict-plus-operands": "off",
      "@typescript-eslint/ban-ts-ignore": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-unsafe-declaration-merging": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/prefer-promise-reject-errors": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-redundant-type-constituents": "off",
      "vue/no-use-v-if-with-v-for": "off",
      "vue/multi-word-component-names": ["error", {
        "ignores": ["de"]
      }],

      // allow debugger during development only
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off'
    }
  },

  {
    files: [ 'src-pwa/custom-service-worker.ts' ],
    languageOptions: {
      globals: {
        ...globals.serviceworker
      }
    }
  },

  prettierSkipFormatting, // optional, if you want prettier
)
