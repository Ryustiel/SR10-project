const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const Utilisateur = require('../model/utilisateur'); // Vérifiez le chemin si nécessaire

// Page d'inscription avec le formulaire
router.get('/register', (req, res) => {
    res.render('register', {
        title: "Inscription",
        errors: {},
        data: {} // Pour pré-remplir le formulaire en cas d'erreur
    });
});

// Traitement du formulaire d'inscription
router.post('/register', [
    body('firstname', 'Le prénom est requis').notEmpty(),
    body('lastname', 'Le nom est requis').notEmpty(),
    body('email', 'Veuillez entrer un email valide').isEmail(),
    body('confirmEmail', 'Les emails ne correspondent pas').custom((value, { req }) => value === req.body.email),
    body('phone', 'Numéro de téléphone non valide').isMobilePhone('fr-FR'),
    body('password', 'Le mot de passe doit contenir au moins 6 caractères').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('register', {
            title: "Inscription",
            errors: errors.mapped(),
            data: req.body // Garder les valeurs saisies pour ne pas les retaper
        });
    }

    try {
        const { firstname, lastname, email, phone, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        await Utilisateur.create({
            email,
            motDePasse: hashedPassword,
            nom: lastname,
            prenom: firstname,
            telephone: phone,
            dateCreation: new Date(),
            statutCompte: 'actif',
            typeCompte: 'candidat', // Supposons que tous sont des candidats par défaut
            idOrganisation: null // Modifier selon le cas d'usage
        });

        req.session.userEmail = email; // Sauvegarder l'email dans la session pour le connecter automatiquement
        res.redirect('/dashboard'); // Redirection vers le tableau de bord après inscription réussie
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).render('error', {
            message: "Erreur interne du serveur lors de l'inscription",
            error: error // Assurez-vous que votre page d'erreur peut gérer cette structure
        });
    }
});

module.exports = router;