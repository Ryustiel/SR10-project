var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

const Organisation = require('../model/organisation'); // Ajustez le chemin selon votre structure de projet

// Route pour obtenir la liste des organisations
router.get('/orgslist', function(req, res, next) {
    Organisation.readall(function(error, organizations) {
        if (error) {
            next(error); // Passe l'erreur au gestionnaire d'erreurs d'Express
        } else {
            res.render('orgsList', { title: 'Liste des Organisations', organizations: organizations || [] }); // Assurez-vous d'avoir une vue organizationList configurée
        }
    });
});

module.exports = router;