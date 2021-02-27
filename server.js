const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.error(err.name);
  console.error(err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const port = process.env.PORT || 5000;

const timedFunction = () => {
  var now = new Date();
  var millisTill10 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0, 0) - now;
  
  if (millisTill10 < 0) {
    millisTill10 += 86400000; // it's after 10am, try again tomorrow.
  }

  console.log('\nCounting down to 10am:');
  console.log(`${Math.ceil(millisTill10 / 1000 / 60)} minutes remaining.\n`);

  setTimeout(function() {
    console.log("It's 10am!")
  }, millisTill10);
}

const server = app.listen(port, () => {
  timedFunction();
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  console.error(err.name);
  console.error(err.message);

  server.close(() => {
    process.exit(1);
  });
});