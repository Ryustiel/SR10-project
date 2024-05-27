const logger = require('../logger');
const express = require('express');
const router = express.Router();
const Utilisateur = require('../model/utilisateur');
const Organisation = require('../model/organisation');
//import is admin and is logged in functions from middleware folder
const isLoggedIn = require('../middleware/isLoggedIn');
const isAdmin = require('../middleware/isAdmin');
const readMessage = require('../middleware/readMessage');

router.get('/', isLoggedIn, readMessage, async (req, res,next) => {
    logger.debug("Accès au dashboard...");
    try {
        const email = req.session.userEmail;
        logger.debug(`Recherche des détails pour l'email : ${email}`);
        const userDetails = await Utilisateur.read(email);

        if (!userDetails) {
            logger.warn("Aucun utilisateur trouvé avec cet email.");
            throw new Error("Détails de l'utilisateur non trouvés.");
        }

        if (userDetails.TypeCompte.toLowerCase() === 'administrateur') {
            res.redirect('/dashboard/administrateur');
        } else {
            logger.info("Utilisateur trouvé, rendu du dashboard.");
            res.render('dashboards/dashboard', { user: userDetails, activePage: 'dashboard' });
        }

    } catch (error) {
        logger.error(`Erreur lors de l\'accès au dashboard : ${error}`);
        error.status = 500;
        error.message = "Erreur lors de l'accès au dashboard";
        next(error);
    }
});

router.get('/administrateur', isLoggedIn, isAdmin, readMessage, async (req, res,next) => {
    logger.debug("Accès au dashboard administrateur...");
    try {
        const email = req.session.userEmail;
        logger.debug(`Recherche des détails pour l'email : ${email}`);
        const userDetails = await Utilisateur.read(email);
        if (!userDetails) {
            logger.warn("Aucun utilisateur trouvé avec cet email.");
            throw new Error("Détails de l'utilisateur non trouvés.");
        }
        logger.info("Utilisateur trouvé, rendu du dashboard administrateur.");
        res.render('dashboards/administrateur', { user: userDetails, activePage: 'dashboard' });
    } catch (error) {
        logger.error(`Erreur lors de l'accès au dashboard administrateur : ${error}`);
        error.status = 500;
        error.message = "Erreur lors de l'accès au dashboard administrateur.";
        next(error);
    }
});


module.exports = router;