const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const initDB = require('./config/db')
const app = express()

require('dotenv').config()

const allowedOrigins = ['http://localhost:3000', 'http://miro.unibague.edu.co'];

app.use(cors({
  origin: function(origin, callback){
    if(!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      console.log(origin)
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

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