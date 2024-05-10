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
        res.render('login', { title: "Connexion" });
    }
});

// Traitement du formulaire de connexion
router.post('/', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation basique des entrées
        if (!email || !password) {
            logger.warn("Tentative de connexion sans email ou mot de passe");
            return res.render('login', { title: "Connexion", errorMessage: 'Email et mot de passe requis.' });
        }

        const utilisateur = await Utilisateur.read(email);

        if (!utilisateur) {
            logger.warn(`Tentative de connexion échouée pour l'utilisateur non trouvé: ${email}`);
            return res.render('login', { title: "Connexion", errorMessage: 'Utilisateur non trouvé' });
        }

        const match = await bcrypt.compare(password, utilisateur.MotDePasse);
        if (match) {
            req.session.userEmail = email;
            logger.info(`Utilisateur connecté : ${email}`);
            res.redirect('/dashboard');
        } else {
            logger.warn(`Tentative de connexion échouée pour mot de passe incorrect: ${email}`);
            res.render('login', { title: "Connexion", errorMessage: 'Mot de passe incorrect' });
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