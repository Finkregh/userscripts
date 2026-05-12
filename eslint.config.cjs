const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.user.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        // Core Greasemonkey/Tampermonkey API
        GM_setValue: 'readonly',
        GM_getValue: 'readonly',
        GM_deleteValue: 'readonly',
        GM_listValues: 'readonly',
        GM_addStyle: 'readonly',
        GM_xmlhttpRequest: 'readonly',
        GM_registerMenuCommand: 'readonly',
        GM_unregisterMenuCommand: 'readonly',
        GM_notification: 'readonly',
        GM_openInTab: 'readonly',
        GM_getTab: 'readonly',
        GM_saveTab: 'readonly',
        GM_getTabs: 'readonly',
        GM_log: 'readonly',
        GM_getResourceText: 'readonly',
        GM_getResourceURL: 'readonly',
        GM_info: 'readonly',
        // Tampermonkey 5.3+ API
        GM_getValues: 'readonly',
        GM_setValues: 'readonly',
        // Legacy/compatibility
        unsafeWindow: 'readonly',
        // External libraries loaded via @require
        d3: 'readonly',
        chroma: 'readonly',
        UserUtils: 'readonly',
        GM_config: 'readonly',
        tippy: 'readonly',
      },
    },
    rules: {
      // Userscript-friendly rules
      'no-console': 'off',
      'no-alert': 'off',
      'no-undef': 'error',
      'no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^GM_',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['**/*.user.js'],
    rules: {
      'no-implicit-globals': 'off',
    },
  },
  {
    files: ['**/test/**/*.js'],
    languageOptions: {
      sourceType: 'module',
    },
  },
  {
    ignores: ['node_modules/', 'dist/', 'build/', '*.min.js'],
  },
];
