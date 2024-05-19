const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const Utilisateur = require('../model/utilisateur');
const logger = require('../logger');

// Route GET pour afficher le formulaire d'inscription
router.get('/', (req, res) => {
    res.render('auth/register', {
        title: "Inscription",
        errors: {},
        data: {}
    });
});

// Route GET pour afficher le formulaire d'inscription
router.get('/', (req, res) => {
    res.render('auth/register', { title: "Inscription", errors: {}, data: {} });
});

// Validation et processing de l'inscription
router.post('/', [
    body('firstname', 'Le prénom est requis').notEmpty().trim().escape(),
    body('lastname', 'Le nom est requis').notEmpty().trim().escape(),
    body('email', 'Veuillez entrer un email valide').isEmail().normalizeEmail(),
    body('confirmEmail', 'Les emails ne correspondent pas')
        .custom((value, { req }) => value === req.body.email).trim().escape(),
    body('phone', 'Numéro de téléphone non valide').isMobilePhone('fr-FR'),
    body('password', 'Le mot de passe doit contenir au moins 8 caractères, incluant une majuscule, une minuscule, un chiffre et un caractère spécial.')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/).trim().escape(),
    body('confirmPassword', 'Les mots de passe ne correspondent pas')
        .custom((value, { req }) => value === req.body.password)
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.warn(`Erreur de validation lors de l'inscription : ${JSON.stringify(errors.array())}`);
        return res.render('auth/register', { title: "Inscription", errors: errors.mapped(), data: req.body });
    }

    const { firstname, lastname, email, phone, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await Utilisateur.create({
            nom: lastname,
            prenom: firstname,
            email,
            telephone: phone,
            motDePasse: hashedPassword,
            statutCompte: 'actif',
            typeCompte: 'candidat',
            dateCreation: new Date()
        });
        req.session.userEmail = email; // Authentification automatique après l'inscription
        logger.info(`Nouveau utilisateur inscrit: ${email}`);
        res.redirect('/dashboard');
    } catch (error) {
        logger.error(`Erreur lors de l'enregistrement de l'utilisateur: ${error}`);
        res.status(500).render('error', {
            message: "Erreur interne du serveur lors de l'inscription",
            error: {}
        });
    }
});

module.exports = router;