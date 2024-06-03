const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const {body, validationResult} = require('express-validator');
const Utilisateur = require('../model/utilisateur');
const logger = require('../logger');
const readMessage = require('../middleware/readMessage');

// Route GET pour afficher le formulaire d'inscription
router.get('/', readMessage, (req, res) => {
    res.render('auth/register', {
        title: "Inscription",
        data: req.session.formData || {} // Utiliser les données de session si disponibles
    });
    delete req.session.formData; // Supprimer les données de session après le rendu
});

// Validation et processing de l'inscription
router.post('/', [
    body('firstname', 'Le prénom est requis').notEmpty().trim().escape(),
    body('lastname', 'Le nom est requis').notEmpty().trim().escape(),
    body('email', 'Veuillez entrer un email valide').isEmail().trim().escape(),
    body('confirmEmail', 'Les emails ne correspondent pas')
        .custom((value, {req}) => value === req.body.email).trim().escape(),
    body('phone', 'Numéro de téléphone non valide').isMobilePhone('fr-FR'),
    body('password', 'Le mot de passe doit contenir au moins 12 caractères, incluant une majuscule, une minuscule, un chiffre et un caractère spécial.')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{12,}$/).trim().escape(),
    body('confirmPassword', 'Les mots de passe ne correspondent pas').trim().escape()
        .custom((value, {req}) => value === req.body.password)
], async (req, res,next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.session.message = errors.array().map(error => error.msg).join(', ');
        req.session.messageType = 'error';
        req.session.formData = {
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: req.body.email,
            confirmEmail: req.body.confirmEmail,
            phone: req.body.phone
        };
        logger.warn(`Erreur de validation lors de l'inscription : ${JSON.stringify(errors.array())}`);
        return res.redirect('/register');
    }

    const {firstname, lastname, email, phone, password} = req.body;
    try {
        // Vérifier si l'email existe déjà
        const existingUser = await Utilisateur.read(email);
        if (existingUser) {
            req.session.message = 'Un utilisateur avec cet email existe déjà.';
            req.session.messageType = 'error';
            req.session.formData = {
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                email: req.body.email,
                confirmEmail: req.body.confirmEmail,
                phone: req.body.phone
            };
            logger.warn(`Tentative d'inscription avec un email existant : ${email}`);
            return res.redirect('/register');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await Utilisateur.create({
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
        req.session.userType = await Utilisateur.getType(email);
        req.session.userAffiliation = await Utilisateur.getOrganisationId(email);
        req.session.notification = '';
        req.session.space = 'candidat';
        logger.info(`Nouveau utilisateur inscrit : ${email}`);
        req.session.message = `Bienvenue ${firstname} ${lastname}, votre compte a été créé avec succès.`;
        req.session.messageType = 'notification';
        res.redirect('/dashboard');
    } catch (error) {
        logger.error(`Erreur lors de l\'enregistrement de l\'utilisateur : ${error}`);
        error.status = 500;
        error.message = 'Erreur lors de l\'enregistrement de l\'utilisateur.';
        next(error);
    }
});

module.exports = router;
