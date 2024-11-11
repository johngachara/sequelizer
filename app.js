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
var celeryAuth = require('./auth/celeryAuth');
var {findOne : getAccessory,findAll:getAllAccessories} = require('./controllers/firestoreControllers/findAccessories')
var addAccessories = require('./controllers/firestoreControllers/addAccessories')
var updateAccessories = require('./controllers/firestoreControllers/updateAccessories')
var{deleteAllAccessories,deleteOneAccessory} = require('./controllers/firestoreControllers/deleteAccessories')
var sellAccessories = require('./controllers/firestoreControllers/sellAccessories')
var copyData = require('./controllers/firestoreControllers/copyData')
var authenticate = require('./auth/firestoreJWT')
var firestoreMiddleware = require('./auth/firestoreVerify')
const {verify} = require("jsonwebtoken");
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.disable('etag');
app.disable('view cache');
app.set('x-powered-by', false);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowedOrigins = ['http://localhost:3000', "https://main.gachara.store"];
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 0 // disabling cors caching
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Enhanced cache prevention middleware
app.use((_req, res, next) => {
  res.set({
    'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
    'Clear-Site-Data': '"cache", "cookies", "storage"',
    'Vary': '*',
    'Last-Modified': new Date().toUTCString()
  });
  next();
});
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/Add', authMiddleware, addAccessory);
app.use('/api/getAccessory',firestoreMiddleware, getAccessory);
app.use('/api/getAll',firestoreMiddleware,getAllAccessories)
app.use('/api/addAccessories',firestoreMiddleware, addAccessories);
app.use('/api/updateAccessories',firestoreMiddleware,updateAccessories)
app.use('/api/deleteAccessory',firestoreMiddleware,deleteOneAccessory)
//app.use('/api/copyData',copyData)
//app.use('/api/deleteAllAccessories',firestoreMiddleware,deleteAllAccessories)
app.use('/api/sellAccessories',firestoreMiddleware,sellAccessories)
app.use('/api/authenticate',authenticate)
// app.use('/Find', authMiddleware, findOne);
// app.use('/FindAll', authMiddleware, findAll);
// app.use('/Update', authMiddleware, updateAccessory);
// app.use('/Delete', authMiddleware, deleteAccessory);
// app.use('/Save', authMiddleware, save);
// app.use('/Complete', authMiddleware, complete);
// app.use('/authenticate', auth);
// app.use('/Adduser', authMiddleware, addUser);
// app.use('/Sendmail', celeryMiddleware, sendComplete);
// app.use('/incomplete', authMiddleware, sendIncomplete);
// app.use('/Saved', authMiddleware, savedTransactions);
// app.use('/celeryAuth', celeryAuth);
// app.get('/Admin', authMiddleware, adminDashboard);
// app.get('/sales', authMiddleware, details.detailedSales);
// app.get('/Products', authMiddleware, details.detailedProducts);

// Response interceptor for fresh JSON responses
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    const responseData = {
      ...data,
      _timestamp: Date.now()
    };
    return originalJson.call(this, responseData);
  };
  next();
});

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

// 404 handler
app.use(function(req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;