const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const initDB = require('./config/db');
const app = express();

require('dotenv').config();

const allowedOrigins = ['http://localhost:3000', 'https://miro.unibague.edu.co'];

// Configurar Express para entender que está detrás de un proxy inverso
app.set('trust proxy', true); 

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      console.log(origin);
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

app.use(express.urlencoded({
  extended: false
}));

app.use(morgan('dev'));

if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      next();
    } else {
      res.redirect(`https://${req.headers.host}${req.url}`);
    }
  });
}

const apiRouter = express.Router();

apiRouter.use("/users", require('./routes/users'));
apiRouter.use("/dimensions", require('./routes/dimensions'));
apiRouter.use("/dependencies", require('./routes/dependencies'));
apiRouter.use("/periods", require('./routes/periods'));
apiRouter.use("/templates", require('./routes/templates'));
apiRouter.use("/pTemplates", require('./routes/publishedTemplates'));
apiRouter.use("/validators", require('./routes/validators'));

app.use('/api/p', apiRouter);

const PORT = process.env.PORT || 6000;

app.listen(PORT, () => {
  if (process.env.NODE_ENV === 'production') {
    console.log('Server running in production mode on ' + PORT);
  } else {
    console.log('Server running in development mode on ' + PORT);
  }
});



initDB();
