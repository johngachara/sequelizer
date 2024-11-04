var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
var { findOne, findAll } = require('./controllers/findAccessory');
var addAccessory = require('./controllers/addAccessories');
var updateAccessory = require('./controllers/updateAccessories');
var { deleteAccessory, deleteAll } = require('./controllers/deleteAccessories');
var { save, complete } = require('./controllers/sellAccessory');
var auth = require('./auth/jwt');
var savedTransactions = require('./controllers/savedTransactions');
var addUser = require('./controllers/addUser');
var { adminDashboard } = require('./controllers/adminDashboard');
var details = require('./controllers/adminDetails');
var { sendComplete, sendIncomplete } = require('./controllers/send_mail');
var app = express();
var authMiddleware = require('./auth/authMiddleware');
var celeryMiddleware = require('./auth/celeryMiddleware');
var celeryAuth = require('./auth/celeryAuth')
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    // Add frontend URL to this list
    const allowedOrigins =['http://localhost:3000',"https://main.gachara.store"]
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  maxAge : 0 //disabling cors caching
};

// Apply CORS middleware before your routes
app.use(cors(corsOptions));
// Add cache-disabling middleware here
app.use((req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  });
  next();
});

// Also disable Express's default ETag generation
app.disable('etag');


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/Add', authMiddleware, addAccessory);
app.use('/Find', authMiddleware, findOne);
app.use('/FindAll', authMiddleware, findAll);
app.use('/Update', authMiddleware, updateAccessory);
app.use('/Delete', authMiddleware, deleteAccessory);
app.use('/Save', authMiddleware, save);
app.use('/Complete', authMiddleware, complete);
app.use('/authenticate', auth);
app.use('/Adduser', authMiddleware, addUser);
app.use('/Sendmail', celeryMiddleware, sendComplete);
app.use('/incomplete', authMiddleware, sendIncomplete);
app.use('/Saved', authMiddleware, savedTransactions);
app.use('/celeryAuth', celeryAuth);
app.get('/Admin',authMiddleware ,adminDashboard);
app.get('/sales',authMiddleware ,details.detailedSales);
app.get('/Products',authMiddleware ,details.detailedProducts);

// CORS error handler
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({
      message: 'CORS error: Origin not allowed',
      error: err
    });
  } else {
    next(err);
  }
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
