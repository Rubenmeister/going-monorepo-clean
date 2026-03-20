// This file ensures pnpm is used as the package manager
// It prevents accidental usage of npm or yarn

const fs = require('fs');
const path = require('path');

module.exports = {
  hooks: {
    beforeInstall(args) {
      if (process.env.npm_config_user_agent && !process.env.npm_config_user_agent.includes('pnpm')) {
        throw new Error(
          'This project uses pnpm. Please use pnpm install instead of npm install.\n' +
          'To install pnpm: npm install -g pnpm\n' +
          'Or visit: https://pnpm.io/installation'
        );
      }
    },
  },
};
