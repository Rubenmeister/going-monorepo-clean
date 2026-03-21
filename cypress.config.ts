import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 30000,
    responseTimeout: 30000,
    pageLoadTimeout: 60000,
    video: true,
    videoUploadOnPasses: false,
    screenshotOnRunFailure: true,
    setupNodeEvents(on, config) {
      // Event listeners can be implemented here
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        table(data) {
          console.table(data);
          return null;
        },
      });
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    chromeWebSecurity: false,
    numTestsKeptInMemory: 0,
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
  },
  env: {
    API_BASE_URL: 'http://localhost:3000/api',
    ADMIN_API_URL: 'http://localhost:3001/api',
    DRIVER_APP_URL: 'http://localhost:3002',
    PASSENGER_APP_URL: 'http://localhost:3000',
    TEST_TIMEOUT: 30000,
  },
});
