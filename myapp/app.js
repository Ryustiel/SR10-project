// main components of the app
var express = require('express');
var app = express();
var sessions = require('express-session');
var cookieParser = require('cookie-parser');
var path = require('path');
var logger = require('morgan');

// Importations des routeurs
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var orgsRouter = require('./routes/orgs');
var jobsRouter = require('./routes/jobs');
var loginRouter = require('./routes/login');
var dashboardRouter = require('./routes/dashboard');
var registerRouter = require('./routes/register');
const applicationsRouter = require('./routes/applications');

// Configurations
app.use(sessions({
  secret: "idjijoekozkdjjsqlkdsqkd",
  saveUninitialized: true,
  cookie: {maxAge: 1000 * 60 * 60 * 2, httpOnly: true, sameSite: 'Strict'},
  resave: false
}));

// middleware setup
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// adding routes
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Routage
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/orgs', orgsRouter);
app.use('/jobs', jobsRouter);
app.use('/applications', applicationsRouter);
app.use('/dashboard', dashboardRouter);
app.use('/', loginRouter);
app.use('/', registerRouter);

// Gestion des erreurs
app.use(function(req, res, next) {
  var createError = require('http-errors');
  next(createError(404));
});

app.use(function(err, req, res, next) {
    // Capture le statut de l'erreur ou utilisez 500 par défaut si non spécifié
    const status = err.status || 500;

    // Environnement de développement : on montre les détails de l'erreur
    // En production, cache ces détails pour des raisons de sécurité.
    const errorDetails = req.app.get('env') === 'development' ? err : {};

    // Rendu de la page d'erreur avec les détails
    res.status(status).render('error', {
        message: err.message,
        error: {
            status: status,
            stack: errorDetails.stack || 'Pas de stacktrace disponible'
        }
    });
});

module.exports = app;
