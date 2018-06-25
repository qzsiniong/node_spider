require('babel-register');
const { Application } = require('./src/Application');

process.on('unhandledRejection', (error) => {
  console.error('unhandledRejection', error);
  // process.exit(1); // To exit with a 'failure' code
});

const app = new Application();
global.app = app;
app.start();

