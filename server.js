const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { createServer } = require("http")
const { Server } = require("socket.io")

process.on('uncaughtException', (err) => {
  console.error(err.name);
  console.error(err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('DB connection success'))

// const timedFunction = () => {
//   var now = new Date();
//   var millisTill10 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0, 0) - now;
  
//   if (millisTill10 < 0) {
//     millisTill10 += 86400000; // it's after 10am, try again tomorrow.
//   }

//   console.log('\nCounting down to 10am:');
//   console.log(`${Math.ceil(millisTill10 / 1000 / 60)} minutes remaining.\n`);

//   setTimeout(function() {
//     console.log("It's 10am!")
//   }, millisTill10);
// }

const port = process.env.PORT || 5000;

const server = app.listen(port, () => {
  // timedFunction();
  console.log(`App running on port ${port}...`);
});

// const httpServer = createServer(app)
// const io = new Server(httpServer, {
//   cors: true,
//   origins: ["http://localhost:8080"],
// })

// io.on("connection", (socket) => {
//   console.log(socket)
// })

// httpServer.listen(port)

process.on('unhandledRejection', (err) => {
  console.error(err.name);
  console.error(err.message);

  server.close(() => {
    process.exit(1);
  });
});