const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: ['node_modules/', '.expo/', 'dist/', 'scripts/'],
  },
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
];
