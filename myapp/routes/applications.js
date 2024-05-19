const express = require('express');
const router = express.Router();
const logger = require('../logger');
const Utilisateur = require('../model/utilisateur');
const Organisation = require('../model/organisation');
const isLoggedIn = require('../middleware/isLoggedIn');
const isAdmin = require('../middleware/isAdmin');

// Routes existantes pour les candidatures, offres, et descriptions de poste
router.get('/my-applications', function(req, res, next) {
    res.render('applications/browse_sent.ejs', { title: 'Mes Candidatures' });
});

router.get('/offers', function(req, res, next) {
    res.render('applications/browse_sent.ejs', { title: 'Mes Offres' });
});

router.get('/job-descriptions', function(req, res, next) {
    res.render('applications/browse_sent.ejs', { title: 'Mes Fiches Emploi' });
});

module.exports = router;