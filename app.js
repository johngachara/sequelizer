const createError = require('http-errors');
const express = require('express');
const path = require('path');
const helmet = require("helmet");
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const http = require('http');

// Import controllers
const {
  findOne: getAccessory,
  findAll: getAllAccessories
} = require('./controllers/firestoreControllers/findAccessories');
const addAccessories = require('./controllers/firestoreControllers/addAccessories');
const updateAccessories = require('./controllers/firestoreControllers/updateAccessories');
const { deleteOneAccessory } = require('./controllers/firestoreControllers/deleteAccessories');
const sellAccessories = require('./controllers/firestoreControllers/sellAccessories');
const sendSale = require('./controllers/firestoreControllers/sendSales');

// Import middleware
const celeryMiddleware = require('./auth/celeryMiddleware');
const celeryAuth = require('./auth/celeryAuth');
const authenticate = require('./auth/firestoreJWT');
const firestoreMiddleware = require('./auth/firestoreVerify');

// Initialize express app
const app = express();

// Security configurations
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      styleSrc: ["'self'"]
    }
  },
  crossOriginResourcePolicy: { policy: "same-site" }
};

const corsConfig = {
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

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');


app.set('trust proxy', 1);
// Disable various caching mechanisms
app.disable('etag');
app.disable('view cache');
app.disable('x-powered-by');

// Apply middleware
app.use(helmet(helmetConfig));
app.use(cors(corsConfig));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Cache prevention middleware
app.use((_req, res, next) => {
  res.set({
    'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
    'Vary': '*',
    'Last-Modified': new Date().toUTCString()
  });
  next();
});

// API Routes
app.use('/api/getAccessory', firestoreMiddleware, getAccessory);
app.use('/api/getAll', firestoreMiddleware, getAllAccessories);
app.use('/api/addAccessories', firestoreMiddleware, addAccessories);
app.use('/api/updateAccessories', firestoreMiddleware, updateAccessories);
app.use('/api/deleteAccessory', firestoreMiddleware, deleteOneAccessory);
app.use('/api/sellAccessories', firestoreMiddleware, sellAccessories);
app.use('/api/sendMail', celeryMiddleware, sendSale);
app.use('/api/authenticate', authenticate);
app.use('/api/celeryAuth', celeryAuth);
app.get('/ip', (request, response) => response.send(request.ip))

// Response interceptor for JSON timestamps
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

// 404 handler
app.use((req, res, next) => {
  res.status(404);

  if (req.accepts('html')) {
    res.render('error', {
      status: 404,
      message: 'Page Not Found',
      description: 'The requested resource could not be found on this server.'
    });
    return;
  }

  if (req.accepts('json')) {
    res.json({
      status: 404,
      error: 'Not Found',
      message: 'The requested resource could not be found.'
    });
    return;
  }

  res.type('txt').send('Not Found');
});

// CORS error handler
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({
      status: 403,
      error: 'Forbidden',
      message: 'CORS error: Origin not allowed'
    });
    return;
  }
  next(err);
});

// Global error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const isDev = req.app.get('env') === 'development';

  res.status(status);

  if (req.accepts('html')) {
    res.render('error', {
      status: status,
      message: status === 500 ? 'Internal Server Error' : err.message,
      description: isDev ? err.stack : 'An unexpected error occurred.',
      error: isDev ? err : {}
    });
    return;
  }

  res.json({
    status: status,
    error: status === 500 ? 'Internal Server Error' : err.message,
    details: isDev ? err.stack : undefined
  });
});


module.exports = app;