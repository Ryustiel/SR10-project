const logger = require("../logger");

function isLoggedIn(req, res, next) {
    logger.debug("Vérification de l'état de connexion de l'utilisateur...");
    if (req.session.userEmail) {
        logger.debug(`Utilisateur connecté avec l'email : ${req.session.userEmail}`);
        next();
    } else {
        logger.warn("Aucun utilisateur connecté, redirection vers /login");
        res.redirect('/login');
    }
}


module.exports = isLoggedIn;