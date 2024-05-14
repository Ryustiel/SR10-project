const express = require('express');
const router = express.Router();

const FichePoste = require('../model/ficheposte');
const OffreEmploi = require('../model/offreemploi');

const isLoggedIn = require('../middleware/isLoggedIn.js');
const isRecruitor = require('../middleware/isRecruitor.js');

router.get('/browse_offers', isLoggedIn, async function(req, res, next) {
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

router.get('/add_offer', isLoggedIn, async function(req, res, next) {
    let fiches = await FichePoste.list();

    res.render('jobs/add_offer', {
        notification: null,
        fiches: fiches
    });
});

router.post('/add_offer', isLoggedIn, async function(req, res, next) {
    try {
        let { dateValidite, listePieces, nombrePieces, idFiche } = req.body;

        let idRecruteur = req.session.userEmail;
        let etat = "non publié";

        await OffreEmploi.create({
            etat,
            dateValidite,
            listePieces,
            nombrePieces,
            idFiche,
            idRecruteur
        });

        res.render('jobs/add_offer', {
            notification: 'Votre offre d\'emploi a été ajoutée avec succès !'
        });

    } catch (error) {
        next(error);
    }
});

router.get('/add_position', isLoggedIn, isRecruitor, function(req, res, next) {
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

        await FichePoste.create({
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
        next(error);
    }

});

router.get('/apply', function(req, res, next) {
    // GET APPLICATION DETAILS
    res.render('jobs/apply');
});

module.exports = router;