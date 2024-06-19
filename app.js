var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var connection = require('./controllers/connection')
var {findOne,findAll} = require('./controllers/findAccessory')
var addAccessory = require('./controllers/addAccessories')
var updateAccessory = require('./controllers/updateAccessories')
var {deleteAccessory,deleteAll} = require('./controllers/deleteAccessories')
var {save,complete} = require('./controllers/sellAccessory')
var auth = require('./auth/jwt')
var savedTransactions = require('./controllers/savedTransactions')
var addUser = require('./controllers/addUser')
var {sendComplete,sendIncomplete} = require('./controllers/send_mail');
var app = express();
//const initializeFirebaseSDK = require("./firebase/firebase");
//initializeFirebaseSDK();
var sendMessage = require('./firebase/sendNotification')
var authMiddleware = require('./auth/authMiddleware')
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(cors())
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', indexRouter);
//app.use('/users', usersRouter);
app.use('/Add', addAccessory);
app.use('/Find', findOne);
app.use('/FindAll',authMiddleware, findAll);
app.use('/Update',updateAccessory);
app.use('/Delete',deleteAccessory);
app.use('/DeleteAll',deleteAll);
app.use('/Save',save);
app.use('/Complete',complete);
app.use('/authenticate',auth);
app.use('/Adduser',addUser);
app.use('/Sendmail',sendComplete);
app.use('/incomplete',sendIncomplete)
app.use('/Saved',savedTransactions)
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
