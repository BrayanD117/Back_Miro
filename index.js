const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const initDB = require('./config/db')
const app = express()

app.use(cors())
app.use(express.json() )

app.use(express.urlencoded({
  extended: false
})
)

app.use(morgan('dev'))

app.use("/users", require('./routes/users'))

app.listen(process.env.port, () => {
  console.log('Online =D')
})

initDB();