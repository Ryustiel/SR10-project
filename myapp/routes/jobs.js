const express = require('express');
const router = express.Router();
const model_ficheposte = require('../model/ficheposte');
const model_offreemploi = require('../model/offreemploi');

const OffreEmploi = require('../model/offreemploi'); // Ajustez le chemin selon votre structure

router.get('/browse_offers', async function(req, res, next) {
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
    res.render('jobs/add_offer', {
        notification: null,
        res_string: 'test'
    });
});

router.post('/add_offer', async function(req, res, next) {
    try {
        let { dateValidite, listePieces, nombrePieces, idFiche } = req.body;

        let idRecruteur = 0; // GET IT
        let etat = "Ouverte";

        await model_offreemploi.create({
            etat,
            dateValidite,
            listePieces,
            nombrePieces,
            idFiche,
            idRecruteur
        });

        res.render('jobs/add_position', {
            notification: 'Votre fiche d\'emploi a été ajoutée avec succès !'
        });

    } catch (error) {
        console.error('Add Fiche Emploi Error', error);
        res.status(500).render('error', { message: "Erreur interne du serveur", error });
    }

});


router.get('/add_position', function(req, res, next) {
    res.render('jobs/add_position', {
        notification: null
    });
});

router.post('/add_position', async function(req, res, next) {
    try {
        let {intitule, statutPoste, responsableHierarchique, typeMetier,
            lieuMission, rythme, salaire, description } = req.body;

        // WARNING : ADD_POSITION CURRENTLY USING DEFAULT ORGANIZATION ID 1 INSTEAD OF USER SESSION ORG ID
        let idOrganisation = '123456789';

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
        });

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