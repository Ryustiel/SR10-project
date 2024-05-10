const express = require('express');
const router = express.Router();
const model_ficheposte = require('../model/ficheposte');

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
    res.render('jobs/add_position', {
        notification: null
    });
});

router.post('/add_position', async function(req, res, next) {
    try {
        const {intitule, statutPoste, responsableHierarchique, typeMetier,
            lieuMission, rythme, salaire, description } = req.body;

        // WARNING : ADD_POSITION CURRENTLY USING DEFAULT ORGANIZATION ID 1 INSTEAD OF USER SESSION ORG ID
        const idOrganisation = '123456789';

        await model_ficheposte.create({
            intitule,
            statutPoste,
            responsableHierarchique,
            typeMetier,
            lieuMission,
            rythme,
            salaire,
            description,
            idOrganisation
        })

        res.render('jobs/add_position', {
            notification: 'Votre fiche d\'emploi a été ajoutée avec succès !'
        });

    } catch (error) {
        console.error('Add Fiche Emploi Error', error);
        res.status(500).render('error', { message: "Erreur interne du serveur", error });
    }


});

router.get('/apply', function(req, res, next) {
    // GET APPLICATION DETAILS
    res.render('jobs/apply');
});

module.exports = router;