const { loadEnvFile } = require("process");
const mongoose = require('mongoose')

loadEnvFile();

const DB_URI = process.env.DB_URI

console.log(DB_URI)

module.exports = () =>  {

    mongoose.connect(DB_URI)
  .then(() => console.log('Connected!'));
}