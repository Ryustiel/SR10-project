var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

const OffreEmploi = require('../model/offreemploi'); // Ajustez le chemin selon votre structure

// Route pour obtenir la liste des offres d'emploi
router.get('/jobslist', function(req, res, next) {
    OffreEmploi.readall(function(error, offres) {
        if (error) {
            next(error); // Passe l'erreur au gestionnaire d'erreurs d'Express
        } else {
            res.render('jobsList', { title: 'Liste des Offres d\'Emploi', offres: offres || [] }); // Assurez-vous d'avoir une vue jobList configurée
        }
    });
});

module.exports = router;