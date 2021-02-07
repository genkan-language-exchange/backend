const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../../models/userModel');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('DB connection success'))

// READ JSON FILE
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'))

// EMPTY CURRENT COLLECTION
const deleteData = async () => {
  try {
    await User.deleteMany()
    console.log('Database cleared')
  } catch (error) {
    console.log(error)
  }
  process.exit()
}

// IMPORT INTO DB

const importData = async () => {
  try {
    await User.create(users)
    console.log('Data loaded')
  } catch (error) {
    console.log(error)
  }
  process.exit()
}

if (process.argv[2] === "--import") {
  importData()
}

if (process.argv[2] === "--delete") {
  deleteData()
}

console.log(process.argv)

// node dev-data/data/import-dev-data --import
// node dev-data/data/import-dev-data --delete