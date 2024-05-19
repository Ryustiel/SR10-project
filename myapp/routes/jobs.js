const express = require('express');
const router = express.Router();
const logger = require('../logger');

const FichePoste = require('../model/ficheposte');
const OffreEmploi = require('../model/offreemploi');
const Candidature = require('../model/candidature');

const isLoggedIn = require('../middleware/isLoggedIn.js');
const requireRecruitorStatus = require('../middleware/requireRecruitorStatus.js');
const requireAffiliation = require('../middleware/requireAffiliation.js');
const readNotification = require('../middleware/readNotification.js');


router.get('/browse_offers', isLoggedIn, readNotification, async function(req, res, next) {
    try {
        const offres = await OffreEmploi.candidateListOffers();

        res.render('jobs/browse_offers', {
            notification: req.notification,
            offres: offres
        });
    } catch (error) {
        next(error); // Passe l'erreur au gestionnaire d'erreurs d'Express
    }
});


router.get('/view_offer', function (req, res, next) {
    // RETURN BAD REQUEST
    res.redirect('/jobs/browse_offers');
});

router.post('/view_offer', isLoggedIn, async function(req, res, next) {

    const { idOffre } = req.body;
    const offre = await OffreEmploi.candidateViewOffer(idOffre);
    const isCandidate = await Candidature.isCandidate(req.session.userEmail, idOffre);

    res.render('jobs/view_offer', {
        offre: offre,
        idOffre: idOffre,
        isCandidate: isCandidate
    });
});


router.get('/add_offer', requireAffiliation, readNotification, async function(req, res, next) {
    let fiches = await FichePoste.list();

    res.render('jobs/add_offer', {
        notification: req.notification,
        fiches: fiches
    });
});


router.post('/add_offer', requireAffiliation, async function(req, res, next) {
    try {
        let { dateValidite, listePieces, nombrePieces, idFiche } = req.body;

        let idRecruteur = req.session.userEmail;
        let etat = "non publié";

        // prevents user from injecting an offer for a job he doesn't own
        if (await FichePoste.isUserLegitimate(idFiche, req.session.userAffiliation) === false) {
            res.render('jobs/add_offer', {
                notification: 'Vous n\'avez pas les droits pour ajouter une offre pour cette fiche. (sale petit hacker nul)'
            });
            return;
        }

        await OffreEmploi.create({
            etat,
            dateValidite,
            listePieces,
            nombrePieces,
            idFiche,
            idRecruteur
        });

        req.session.notification = 'Votre offre d\'emploi a été ajoutée avec succès !';
        res.redirect('/jobs/add_offer');

    } catch (error) {
        next(error);
    }
});


router.get('/add_job', requireAffiliation, function(req, res, next) {
    res.render('jobs/add_job', {
        notification: null
    });
});


router.post('/add_job', requireAffiliation, async function(req, res, next) {
    try {
        let {intitule, statutPoste, responsableHierarchique, typeMetier,
            lieuMission, rythme, salaire, description } = req.body;

        let idOrganisation = req.session.userAffiliation;

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

        res.render('jobs/add_job', {
            notification: 'Votre fiche d\'emploi a été ajoutée avec succès !'
        });

    } catch (error) {
        next(error);
    }
});


router.get('/my_offers', requireRecruitorStatus, async function(req, res, next) {
    try {
        const offers = await OffreEmploi.listRecruitorsOffers(req.session.userEmail);
        logger.info(`Offer display : ${JSON.stringify(offers)}`)

        res.render('jobs/my_offers', { offers: offers });
    } catch (error) {
        next(error);
    }
});


router.post('/my_offers', requireAffiliation, async function(req, res, next) {
    try {
        let { idOffre, action } = req.body;

        if (!await OffreEmploi.isUserLegitimate(idOffre, req.session.userEmail)) {
            // METTRE UN MESSAGE D'ERREUR
            res.redirect('/dashboard');
            return;
        }

        logger.info(`Action : ${action} on offer ${idOffre}`)

        if (action === '1') {
            await OffreEmploi.publier(idOffre);
        } else if (action === '2') {
            await OffreEmploi.depublier(idOffre);
        } else if (action === '3') {
            logger.info(`Deleting offer ${idOffre}`)
            await OffreEmploi.delete(idOffre);
        }

        res.redirect('/jobs/my_offers');

    } catch (error) {
        next(error);
    }
});


router.get('/my_jobs', requireAffiliation, async function(req, res, next) {
    try {
        let fiches = await FichePoste.listFiches(req.session.userAffiliation);

        res.render('jobs/my_jobs', {
            fiches: fiches
        });

    } catch (error) {
        next(error);
    }
});


router.post('/my_jobs', requireAffiliation, async function(req, res, next) {
    try {
        let { idFiche } = req.body;

        if (!await FichePoste.isUserLegitimate(idFiche, req.session.userAffiliation)) {
            // METTRE UN MESSAGE D'ERREUR
            res.redirect('/dashboard');
            return;
        }

        await FichePoste.delete(idFiche);
        res.redirect('/jobs/my_jobs');

    } catch (error) {
        next(error);
    }
});


router.get('/apply', function(req, res, next) {
    // GET APPLICATION DETAILS
    res.render('jobs/apply');
});

module.exports = router;