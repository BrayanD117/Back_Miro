const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const initDB = require('./config/db')
const app = express()

require('dotenv').config()

const allowedOrigins = ['http://localhost:3000'];

const corsOptionsDelegate = function (req, callback) {
  let corsOptions;
  if (allowedOrigins.indexOf(req.header('Origin')) !== -1) {
    corsOptions = { origin: true, credentials: true }; // Permitir este origen
  } else {
    corsOptions = { origin: false }; // Rechazar esta petición
  }
  callback(null, corsOptions);
};

app.use(cors(corsOptionsDelegate));
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

app.use("/templates", require('./routes/templates'))

const PORT = process.env.PORT || 6000;

app.listen(PORT, () => {
  console.log('Server running on ' + PORT)
})

initDB();