const express = require('express');
const router = express.Router();
const userModel = require('../model/utilisateur');
const isLoggedIn = require("../middleware/isLoggedIn");
const logger = require("../logger");
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { getUserDetailsAndOrgs } = require('../middleware/userUtils');

// Route pour lister les utilisateurs
router.get('/userslist', async (req, res, next) => {
    try {
        const result = await userModel.readall();
        res.render('usersList', { title: 'Liste des Utilisateurs', users: result || [] });
    } catch (error) {
        logger.error("Erreur lors de la récupération de la liste des utilisateurs:", error);
        next(error);
    }
});

// Route pour parcourir les utilisateurs
router.get('/browse', async (req, res, next) => {
    try {
        const result = await userModel.readall();
        res.render('users/browse_users', { users: result || [] });
    } catch (error) {
        logger.error("Erreur lors de la récupération des utilisateurs:", error);
        next(error);
    }
});

// Route pour afficher le profil utilisateur
router.get('/my_profile', isLoggedIn, async (req, res) => {
    logger.debug("Accès au profil utilisateur...");
    try {
        const email = req.session.userEmail;
        logger.debug(`Recherche des détails pour l'email : ${email}`);
        const { userDetails, organisations } = await getUserDetailsAndOrgs(email);
        res.render('users/view_profile', { user: userDetails, organisations, activePage: 'my_profile' });
    } catch (error) {
        logger.error("Erreur lors de l'accès au profil:", error);
        res.status(500).render('error', { message: "Erreur de serveur.", error: error });
    }
});

// Route pour mettre à jour l'email utilisateur
router.post('/update-email', isLoggedIn, body('newEmail').isEmail().withMessage('Email invalide.'), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.warn("Email invalide fourni.");
        const email = req.session.userEmail;
        const { userDetails, organisations } = await getUserDetailsAndOrgs(email);
        return res.status(400).render('users/view_profile', {
            user: userDetails,
            organisations: organisations,
            errorMessage: errors.array().map(e => e.msg).join(', '),
            activePage: 'my_profile'
        });
    }
    try {
        const email = req.session.userEmail;
        const { newEmail } = req.body;
        logger.debug(`Mise à jour de l'email de l'utilisateur: ${email} vers ${newEmail}`);
        await userModel.update(email, { Email: newEmail });
        req.session.userEmail = newEmail;
        res.redirect('/users/my_profile');
    } catch (error) {
        const email = req.session.userEmail;
        const { userDetails, organisations } = await getUserDetailsAndOrgs(email);
        logger.error("Erreur lors de la mise à jour de l'email:", error);
        res.status(500).render('users/view_profile', {
            user: userDetails,
            organisations: organisations,
            errorMessage: "Erreur de serveur.",
            activePage: 'my_profile'
        });
    }
});

// Route pour mettre à jour le téléphone utilisateur
router.post('/update-telephone', isLoggedIn, body('newTelephone').isMobilePhone('fr-FR').withMessage('Numéro de téléphone mobile invalide.'), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.warn("Numéro de téléphone mobile invalide fourni.");
        return res.status(400).render('error', { message: errors.array().map(e => e.msg).join(', ') });
    }
    try {
        const email = req.session.userEmail;
        const { newTelephone } = req.body;
        logger.debug(`Mise à jour du téléphone de l'utilisateur: ${email} vers ${newTelephone}`);
        await userModel.update(email, { Telephone: newTelephone });
        res.redirect('/users/my_profile');
    } catch (error) {
        logger.error("Erreur lors de la mise à jour du téléphone:", error);
        res.status(500).render('error', { message: "Erreur de serveur.", error });
    }
});

// Route pour mettre à jour le mot de passe utilisateur
router.post('/update-password', isLoggedIn, [
    body('currentPassword', 'Votre mot de passe actuel est requis').notEmpty(),
    body('newPassword', 'Le nouveau mot de passe doit contenir au moins 8 caractères, incluant une majuscule, une minuscule, un chiffre et un caractère spécial.')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/),
    body('confirmPassword', 'Les mots de passe ne correspondent pas').custom((value, { req }) => value === req.body.newPassword)
], async (req, res) => {
    const errors = validationResult(req);
    const email = req.session.userEmail;
    if (!errors.isEmpty()) {
        const { userDetails, organisations } = await getUserDetailsAndOrgs(email);
        logger.warn(`Erreur de validation lors de la mise à jour du mot de passe : ${JSON.stringify(errors.array())}`);
        return res.status(400).render('users/view_profile', {
            user: userDetails,
            organisations: organisations,
            errorMessage: errors.array().map(e => e.msg).join(', '),
            activePage: 'my_profile'
        });
    }

    try {
        const { currentPassword, newPassword } = req.body;

        // Vérification des valeurs
        if (!currentPassword || !newPassword) {
            throw new Error("Les mots de passe ne peuvent pas être vides.");
        }

        const user = await userModel.read(email);

        const match = await bcrypt.compare(currentPassword, user.MotDePasse);
        if (!match) {
            const { userDetails, organisations } = await getUserDetailsAndOrgs(email);
            return res.status(400).render('users/view_profile', {
                user: userDetails,
                organisations: organisations,
                errorMessage: "Le mot de passe actuel est incorrect.",
                activePage: 'my_profile'
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Vérification avant la mise à jour
        if (!hashedPassword) {
            throw new Error("Impossible de générer le nouveau mot de passe.");
        }

        await userModel.update(email, { MotDePasse: hashedPassword });
        logger.info(`Mot de passe mis à jour pour l'utilisateur: ${email}`);
        res.redirect('/users/my_profile');
    } catch (error) {
        logger.error("Erreur lors de la mise à jour du mot de passe :", error);
        const { userDetails, organisations } = await getUserDetailsAndOrgs(email);
        res.status(500).render('users/view_profile', {
            user: userDetails,
            organisations: organisations,
            errorMessage: "Erreur de serveur.",
            activePage: 'my_profile'
        });
    }
});

module.exports = router;