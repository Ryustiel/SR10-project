const express = require('express');
const router = express.Router();
const userModel = require('../model/utilisateur');
const isLoggedIn = require("../middleware/isLoggedIn");
const isAdmin = require("../middleware/isAdmin");
const {canViewProfile, canEditProfile} = require("../middleware/profile_properties");
const logger = require('../logger');
const bcrypt = require('bcryptjs');
const {body, validationResult} = require('express-validator');
const {renderProfileView} = require("../middleware/renderProfileView"); // Ensure the correct import path
const pool = require('../model/db'); // Import the database connection
const readMessage = require('../middleware/readMessage'); // Import the new middleware

// Route to list users with search and pagination
router.get('/userslist', isLoggedIn, isAdmin, readMessage, async (req, res, next) => {
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 5; // Number of users per page
    const offset = (page - 1) * limit;
    const placeholder = "Rechercher par email";
    try {
        const {users, totalUsers} = await userModel.readAllWithPagination(search, limit, offset);
        const totalPages = Math.ceil(totalUsers / limit);

        logger.info("Liste des utilisateurs récupérée avec succès.");
        res.render('users/userslist', {
            title: 'Liste des Utilisateurs',
            users: users || [],
            search,
            currentPage: page,
            totalPages,
            placeholder
        });
    } catch (error) {
        logger.error(`Erreur lors de la récupération de la liste des utilisateurs : ${error}`);
        error.status = 500;
        error.message = "Erreur interne du serveur lors de la récupération de la liste des utilisateurs";
        next(error);
    }
});


// Route pour afficher le profil de l'utilisateur avec un argument par défaut
router.get('/profile', isLoggedIn, async (req, res,next) => {
    const userId = req.session.userEmail;
    logger.info(`Accès au profil de l'utilisateur ${userId}`);
    await renderProfileView(req, res, userId,next);
});

// Route pour afficher le profil d'un utilisateur spécifique
router.post('/profile', isLoggedIn, canViewProfile, async (req, res,next) => {
    const userId = req.body.userId || req.session.userEmail;
    logger.info(`Accès au profil de l'utilisateur ${userId}`);
    await renderProfileView(req, res, userId,next);
});

// Route pour mettre à jour l'email de l'utilisateur
router.post('/update-email', isLoggedIn, canEditProfile, [
    body('newEmail').isEmail().withMessage('Email invalide.')
], async (req, res,next) => {
    const errors = validationResult(req);
    const userId = req.body.userId || req.session.userEmail;
    if (!errors.isEmpty()) {
        req.session.message = errors.array().map(e => e.msg).join(', ');
        req.session.messageType = 'error';
        return res.redirect('/users/profile');
    }
    try {
        const {newEmail} = req.body;

        // Start a transaction
        await pool.query('START TRANSACTION');

        // Update the user's email
        await userModel.update(userId, {Email: newEmail});

        // Commit the transaction
        await pool.query('COMMIT');

        if (userId === req.session.userEmail) {
            req.session.userEmail = newEmail;
        }
        req.session.message = "Email mis à jour avec succès.";
        req.session.messageType = 'notification';
        res.send(`
            <form id="redirectForm" method="post" action="/users/profile">
                <input type="hidden" name="userId" value="${newEmail}">
            </form>
            <script>document.getElementById('redirectForm').submit();</script>
        `);
    } catch (error) {
        // Rollback the transaction in case of error
        await pool.query('ROLLBACK');
        logger.error(`Une erreur s\'est produite lors de la mise à jour de l\'adresse e-mail : ${error}`);
        error.status = 500; // Assurez-vous que l'erreur a une propriété status
        error.message = 'Une erreur s\'est produite lors de la mise à jour de l\'adresse e-mail.';
        next(error); // Passez l'erreur au middleware de gestion des erreurs
    }
});

// Route pour mettre à jour le téléphone de l'utilisateur
router.post('/update-telephone', isLoggedIn, canEditProfile, [
    body('newTelephone').isMobilePhone('fr-FR').withMessage('Numéro de téléphone mobile invalide.')
], async (req, res,next) => {
    const errors = validationResult(req);
    const userId = req.body.userId || req.session.userEmail;
    if (!errors.isEmpty()) {
        req.session.message = errors.array().map(e => e.msg).join(', ');
        req.session.messageType = 'error';
        return res.redirect('/users/profile');
    }
    try {
        const {newTelephone} = req.body;
        await userModel.update(userId, {Telephone: newTelephone});
        req.session.message = "Téléphone mis à jour avec succès.";
        req.session.messageType = 'notification';
        res.send(`
            <form id="redirectForm" method="post" action="/users/profile">
                <input type="hidden" name="userId" value="${userId}">
            </form>
            <script>document.getElementById('redirectForm').submit();</script>
        `);
    } catch (error) {
        logger.error(`Erreur lors de la mise à jour du téléphone de l'utilisateur : ${error}`);
        error.status = 500;
        error.message = "Erreur lors de la mise à jour du téléphone de l'utilisateur.";
        next(error);
    }
});

// Route pour réinitialiser le mot de passe de l'utilisateur (Admin)
router.post('/reset-password', isLoggedIn, isAdmin, async (req, res,next) => {
    const userId = req.body.userId || req.session.userEmail;
    try {
        const defaultPassword = 'password'; // Mot de passe par défaut
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        await userModel.update(userId, {MotDePasse: hashedPassword});
        req.session.message = "Mot de passe réinitialisé avec succès.";
        req.session.messageType = 'notification';
        res.send(`
            <form id="redirectForm" method="post" action="/users/profile">
                <input type="hidden" name="userId" value="${userId}">
            </form>
            <script>document.getElementById('redirectForm').submit();</script>
        `);
    } catch (error) {
        logger.error(`Une erreur est survenue lors de la réinitialisation du mot de passe : ${error}`);
        error.status = 500;
        error.message = "Une erreur est survenue lors de la réinitialisation du mot de passe.";
        next(error);
    }
});

// Route pour mettre à jour le mot de passe de l'utilisateur
router.post('/update-password', isLoggedIn, [
    body('currentPassword', 'Votre mot de passe actuel est requis').notEmpty(),
    body('newPassword', 'Le nouveau mot de passe doit contenir au moins 12 caractères, incluant une majuscule, une minuscule, un chiffre et un caractère spécial.')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{12,}$/),
    body('confirmPassword', 'Les mots de passe ne correspondent pas').custom((value, {req}) => value === req.body.newPassword)
], async (req, res,next) => {
    const errors = validationResult(req);
    const userId = req.session.userEmail;
    if (!errors.isEmpty()) {
        req.session.message = errors.array().map(e => e.msg).join(', ');
        req.session.messageType = 'error';
        return res.redirect('/users/profile');
    }

    try {
        const {currentPassword, newPassword} = req.body;
        const user = await userModel.read(userId);
        const match = await bcrypt.compare(currentPassword, user.MotDePasse);
        if (!match) {
            req.session.message = "Le mot de passe actuel est incorrect.";
            req.session.messageType = 'error';
            return res.redirect('/users/profile');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await userModel.update(userId, {MotDePasse: hashedPassword});
        req.session.message = "Mot de passe mis à jour avec succès.";
        req.session.messageType = 'notification';
        res.redirect(`/users/profile`);
    } catch (error) {
        logger.error(`Erreur lors de la mise à jour du mot de passe: ${error}`);
        error.status = 500;
        error.message = "Errur lors de la mise à jour du mot de passe."
        next(error);
    }
});

// Route pour supprimer un utilisateur
router.post('/delete', isLoggedIn, isAdmin, async (req, res, next) => {
    const userId = req.body.userId;
    const search = req.body.search || '';
    const page = req.body.page || 1;
    try {
        await userModel.delete(userId);
        req.session.message = "Utilisateur supprimé avec succès.";
        req.session.messageType = 'notification';
        res.redirect(`/users/userslist?search=${encodeURIComponent(search)}&page=${page}`);
    } catch (error) {
        logger.error(`Erreur lors de la suppression de l'utilisateur: ${error}`);
        error.status = 500;
        error.message = "Erreur lors de la suppression de l'utilisateur.";
        next(error);
    }
});

// Route pour promouvoir un utilisateur en administrateur
router.post('/make-admin', isLoggedIn, isAdmin, async (req, res, next) => {
    const userId = req.body.userId;
    const search = req.body.search || '';
    const page = req.body.page || 1;
    try {
        await userModel.update(userId, {TypeCompte: 'administrateur'});
        req.session.message = "Utilisateur promu en administrateur avec succès.";
        req.session.messageType = 'notification';
        res.redirect(`/users/userslist?search=${encodeURIComponent(search)}&page=${page}`);
    } catch (error) {
        logger.error(`Erreur lors de la promotion de l'utilisateur. ${error}`);
        error.status = 500;
        error.message = "Erreur lors de la promotion de l'utilisateur.";
        next(error);
    }
});

//export router and functions
module.exports = router;