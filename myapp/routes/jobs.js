var express = require('express');
var router = express.Router();

const OffreEmploi = require('../model/offreemploi'); // Ajustez le chemin selon votre structure

router.get('/jobslist', async function(req, res, next) {
    try {
        const offres = await OffreEmploi.readall();
        res.render('jobsList', { title: 'Liste des Offres d\'Emploi', offres: offres });
    } catch (error) {
        next(error); // Passe l'erreur au gestionnaire d'erreurs d'Express
    }
});

router.post('/view', function(req, res, next) {
    // GET OFFER DATA
    res.render('jobs/view_offer');
});

router.get('/add_offer', function(req, res, next) {
    // VIEW EXISTING POSITIONS
    // CHECK FOR ROLE ?
    res.render('jobs/add_offer');
});

router.get('/add_position', function(req, res, next) {
    res.render('jobs/add_position');
});

router.get('/apply', function(req, res, next) {
    // GET APPLICATION DETAILS
    res.render('jobs/apply');
});

module.exports = router;