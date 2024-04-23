const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Utilisateur = require('../model/utilisateur'); // Assurez-vous que ce chemin est correct

router.get('/login', (req, res) => {
    if (req.session.userEmail) {
        res.redirect('/dashboard');
    } else {
        res.render('login', { title: "Connexion" });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const utilisateur = await Utilisateur.read(email);

        if (!utilisateur) {
            return res.render('login', { title: "Connexion", errorMessage: 'Utilisateur non trouvé' });
        }

        const match = await bcrypt.compare(password, utilisateur.MotDePasse);
        if (match) {
            req.session.userEmail = email;
            res.redirect('/dashboard');
        } else {
            res.render('login', { title: "Connexion", errorMessage: 'Mot de passe incorrect' });
        }
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).render('error', { message: "Erreur interne du serveur", error });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

module.exports = router;