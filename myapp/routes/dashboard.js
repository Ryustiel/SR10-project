const express = require('express');
const router = express.Router();
const Utilisateur = require('../model/utilisateur');

function isLoggedIn(req, res, next) {
    if (req.session.userEmail) {
        next();
    } else {
        res.redirect('/login');
    }
}

router.get('/', isLoggedIn, async (req, res) => {
    try {
        const email = req.session.userEmail;
        const userDetails = await Utilisateur.read(email);
        res.render('dashboard', { user: userDetails });
    } catch (error) {
        res.status(500).send("Erreur de serveur.");
    }
});

module.exports = router;