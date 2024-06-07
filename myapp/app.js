const express = require('express');
const path = require('path');
const sessions = require('express-session');
const logger = require('./logger');
const sessionMiddleware = require('./middleware/session');

// Création de l'application Express
const app = express();
app.set('port', 8080);
app.listen(app.get('port'));
// Serveur de fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Affichage de l'accès aux pages dans le logging
app.use((req, res, next) => {
    logger.info(`Requête reçue: ${req.method} ${req.url} de ${req.ip}`);
    next();
});

// Configuration des sessions
app.use(sessions({
    secret: "jddjzodkezjfzoc,azzqc@€ecjzakexzm,ac45z1525z45",
    saveUninitialized: true,
    cookie: {maxAge: 1000 * 60 * 15, httpOnly: true, sameSite: 'Lax'}, // 15 minutes d'inactivité
    resave: false,
    rolling: true // Reset the cookie Max-Age on every request
}));

// Ajout du parsing JSON et URL-encoded pour gérer les données POST
app.use(express.json());
app.use(express.urlencoded({extended: false}));


// Vue engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//Session states Middleware
app.use(sessionMiddleware);

// Middleware pour vérifier les sessions et les rôles
app.all("*", function (req, res, next) {
    const nonSecurePaths = ["/login", "/register"];
    const adminPaths = []; // Liste des URLs admin

    if (nonSecurePaths.includes(req.path)) return next();

    if (adminPaths.includes(req.path)) {
        if (req.session.userType === "administrateur") return next();
        else {
            req.session.message = "Vous n'avez pas les droits pour accéder à cette page. L'incident sera signalé.";
            req.session.messageType = "error";
            logger.error(`Accès non autorisé par ${req.ip} à ${req.path}`);
            return res.redirect("/");
        }
    } else {
        if (req.session.userEmail) {
            return next();
        } else {
            logger.error(`Tentative de connexion sans être authentifié par ${req.ip} à ${req.path}`);
            req.session.returnTo = req.originalUrl || '/';
            return res.redirect("/login");
        }
    }
});

// Routes Importation
const indexRouter = require('./routes/index');

// Appliquer les routes
app.use('/', indexRouter);

// Gestion des erreurs - Capture des routes non traitées (404)
app.use(function (req, res, next) {
    const error = new Error("La page que vous avez demandée n'existe pas.");
    error.status = 404;
    next(error);
});

// Gestion des erreurs - Middleware d'erreur
app.use(function (err, req, res, next) {
    // Log de l'erreur
    logger.error(`Erreur : ${err.status || 500} - ${err.message}, Stack: ${err.stack}`);
    // Réponse de l'erreur
    res.status(err.status || 500).render('error', {
        message: err.message || "Une erreur est survenue sur le serveur.",
        error: req.app.get('env') === 'development' ? err : { status: err.status }
    });
});

module.exports = app;
