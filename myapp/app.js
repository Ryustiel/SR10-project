const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const sessions = require('express-session');
const logger = require('./logger');

// Création de l'application Express
const app = express();

// Affichage de l'accès aux pages dans le logging
app.use((req, res, next) => {
    logger.info(`Requête reçue: ${req.method} ${req.url} de ${req.ip}`);
    next();
});

// Configuration des sessions
app.use(sessions({
    secret: "jddjzodkezjfzoc,azzqc@€ecjzakexzm,ac45z1525z45",
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 2, // Durée de vie du cookie : 2 heures
        httpOnly: true, // Le cookie ne sera pas accessible par les scripts côté client
        sameSite: 'Lax' // Protection simple
    },
    resave: false
}));

// Ajout du parsing JSON et URL-encoded pour gérer les données POST
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Gestion des cookies
app.use(cookieParser());

// Serveur de fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Vue engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Routes Importation
var indexRouter = require('./routes/index');

// Appliquer les routes
app.use('/', indexRouter);

// Gestion des erreurs - Capture des routes non traitées
app.use(function(req, res, next) {
    res.status(404).render('error', {
        message: "La page que vous avez demandée n'existe pas."
    });
});

// Gestion des erreurs - Middleware d'erreur
app.use(function(err, req, res, next) {
    // Log de l'erreur
    logger.error(`Erreur : ${err.status || 500} - ${err.message}, Stack: ${err.stack}`);

    // Réponse de l'erreur
    res.status(err.status || 500).render('error', {
        message: "Une erreur est survenue sur le serveur.",
        error: req.app.get('env') === 'development' ? err : {}
    });
});

module.exports = app;