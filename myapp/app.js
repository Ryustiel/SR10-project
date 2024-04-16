// main components of the app
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// importing routers
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const orgsRouter = require('./routes/organizations');
const jobsRouter = require('./routes/jobs');
const applicationsRouter = require('./routes/applications');

// app setup
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// middleware setup
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// adding routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/organizations', orgsRouter);
app.use('/jobs', jobsRouter);
app.use('/applications', applicationsRouter);
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
