var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

const OffreEmploi = require('../model/offreemploi'); // Ajustez le chemin selon votre structure

// Route pour obtenir la liste des offres d'emploi
router.get('/browse', function(req, res, next) {
    OffreEmploi.readall(function(error, offres) {
        if (error) {
            next(error); // Passe l'erreur au gestionnaire d'erreurs d'Express
        } else {
            res.render('jobs/browse_offers', { title: 'Liste des Offres d\'Emploi', offres: offres || [] }); // Assurez-vous d'avoir une vue jobList configurée
        }
    });
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