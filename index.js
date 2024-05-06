const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const { loadEnvFile } = require("process");
const initDB = require('./config/db')

loadEnvFile();

const app = express()

const port = 3000

app.set("port", process.env.PORT)

app.use(cors())
app.use(express.json() )

app.use(express.urlencoded({
  extended: false
})
)

app.use(morgan('dev'))

app.use("/users", require('./routes/users'))


app.listen(port, () => {
    console.log('Online =D')
})

initDB();