const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Utilisateur = require('../model/utilisateur');
const logger = require('../logger');

// Page de connexion
router.get('/', (req, res) => {
    if (req.session.userEmail) {
        logger.info(`Utilisateur déjà connecté : ${req.session.userEmail}`);
        res.redirect('/dashboard');
    } else {
        res.render('auth/login', { errorMessage: '' });
    }
});

// Traitement du formulaire de connexion
router.post('/', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation basique des entrées
        if (!email || !password) {
            logger.warn("Tentative de connexion sans email ou mot de passe");
            return res.render('auth/login', { errorMessage: 'Email et mot de passe requis.' });
        }

        const utilisateur = await Utilisateur.read(email);

        if (!utilisateur) {
            logger.warn(`Tentative de connexion échouée pour l'utilisateur non trouvé: ${email}`);
            return res.render('auth/login', { errorMessage: 'Utilisateur non trouvé' });
        }

        const match = await bcrypt.compare(password, utilisateur.MotDePasse);
        if (match) {
            req.session.userEmail = email;
            req.session.userType = await Utilisateur.getType(email);
            req.session.userAffiliation = await Utilisateur.getOrganisationId(email);
            req.session.notification = '';
            logger.info(`Utilisateur connecté : ${email} en tant que ${req.session.userType}`);

            const returnTo = req.session.returnTo || '/dashboard'; // redirect to previous page
            logger.info(`Redirection vers ${returnTo}, session vaut ${req.session.returnTo}`);
            req.session.returnTo = null;
            res.redirect(returnTo);
        } else {
            logger.warn(`Tentative de connexion échouée pour mot de passe incorrect: ${email}`);
            res.render('auth/login', { errorMessage: 'Mot de passe incorrect' });
        }
    } catch (error) {
        logger.error(`Erreur dans POST /login : ${error.message}`);
        res.status(500).render('error', {
            message: "Erreur interne du serveur",
            error: req.app.get('env') === 'development' ? error : {}
        });
    }
});

module.exports = router;