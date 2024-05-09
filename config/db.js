require('dotenv').config()
//const { loadEnvFile } = require("process");
const mongoose = require('mongoose')

const DB_URI = process.env.DB_URI

module.exports = () =>  {

    mongoose.connect(DB_URI)
  .then(() => console.log('Connected!'));
}