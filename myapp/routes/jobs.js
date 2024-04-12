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

module.exports = router;