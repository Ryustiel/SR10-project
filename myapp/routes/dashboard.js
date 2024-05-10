const logger = require('../logger');
const express = require('express');
const router = express.Router();
const Utilisateur = require('../model/utilisateur');

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

router.get('/', isLoggedIn, async (req, res) => {
    logger.debug("Accès au dashboard...");
    try {
        const email = req.session.userEmail;
        logger.debug(`Recherche des détails pour l'email : ${email}`);
        const userDetails = await Utilisateur.read(email);

        if (!userDetails) {
            logger.warn("Aucun utilisateur trouvé avec cet email.");
            throw new Error("Détails de l'utilisateur non trouvés.");
        }

        logger.info("Utilisateur trouvé, rendu du dashboard.");
        res.render('dashboards/dashboard', { user: userDetails });
    } catch (error) {
        logger.error("Erreur lors de l'accès au dashboard:", error);
        res.status(500).render('error', { message: "Erreur de serveur.", error });
    }
});

module.exports = router;