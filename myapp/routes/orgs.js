var express = require('express');
var router = express.Router();

const Organisation = require('../model/organisation'); // Ajustez le chemin selon votre structure de projet

router.get('/orgslist', async function(req, res, next) {
    try {
        const organizations = await Organisation.readall();
        res.render('orgsList', { title: 'Liste des Organisations', organizations: organizations });
    } catch (error) {
        next(error); // Passe l'erreur au gestionnaire d'erreurs d'Express
    }
});

module.exports = router;