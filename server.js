const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.error(err.name);
  console.error(err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const port = process.env.PORT || 5000;

const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  console.error(err.name);
  console.error(err.message);

  server.close(() => {
    process.exit(1);
  });
});