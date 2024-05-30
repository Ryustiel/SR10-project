const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const {body, validationResult} = require('express-validator');
const Utilisateur = require('../model/utilisateur');
const logger = require('../logger');
const readReturnTo = require('../middleware/readReturnTo');
const readMessage = require('../middleware/readMessage');

// Route GET pour afficher le formulaire de connexion
router.get('/', readMessage, (req, res) => {
    if (req.session.userEmail) {
        logger.info(`Utilisateur déjà connecté : ${req.session.userEmail}`);
        res.redirect('/dashboard');
    } else {
        res.render('auth/login');
    }
});

// Validation et processing de la connexion
router.post('/', readReturnTo, [
    body('email', 'Veuillez entrer un email valide').isEmail().trim().escape(),
    body('password', 'Le mot de passe est requis').notEmpty().trim().escape()
], async (req, res,next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.session.message = errors.array().map(error => error.msg).join(', ');
        req.session.messageType = 'error';
        logger.warn(`Erreur de validation lors de la connexion : ${JSON.stringify(errors.array())}`);
        return res.redirect('/');
    }

    const {email, password} = req.body;
    try {
        const utilisateur = await Utilisateur.read(email);

        if (!utilisateur) {
            logger.warn(`Tentative de connexion échouée pour l'utilisateur non trouvé: ${email}`);
            req.session.message = 'Utilisateur non trouvé';
            req.session.messageType = 'error';
            return res.redirect('/');
        }

        const match = await bcrypt.compare(password, utilisateur.MotDePasse);
        if (match) {
            req.session.userEmail = email;
            req.session.userType = await Utilisateur.getType(email);
            req.session.userAffiliation = await Utilisateur.getOrganisationId(email);
            req.session.notification = '';
            req.session.space = 'candidat';
            logger.info(`Utilisateur connecté : ${email} en tant que ${req.session.userType}`);

            res.redirect(req.returnTo || '/dashboard');
        } else {
            logger.warn(`Tentative de connexion échouée pour mot de passe incorrect: ${email}`);
            req.session.message = 'Mot de passe incorrect';
            req.session.messageType = 'error';
            res.redirect('/');
        }
    } catch (error) {
        logger.error(`Erreur lors de la connexion : ${error.message}`, {stack: error.stack});
        error.status = 500;
        error.message = 'Erreur lors de la connexion';
        next(error);
    }
});

module.exports = router;
