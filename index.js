const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const initDB = require('./config/db')
const app = express()

require('dotenv').config()

app.use(cors())
app.use(express.json() )

app.use(express.urlencoded({
  extended: false
})
)

app.use(morgan('dev'))

app.use("/users", require('./routes/users'))

app.use("/dimensions", require('./routes/dimensions'))

app.use("/dependencies", require('./routes/dependencies'))

app.use("/periods", require('./routes/periods'))

app.listen(process.env.port, () => {
  console.log('Server running on ' + process.env.port)
})

initDB();