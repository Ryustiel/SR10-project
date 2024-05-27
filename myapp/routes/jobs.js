const express = require('express');
const router = express.Router();
const logger = require('../logger');
const {body, validationResult} = require('express-validator');

const FichePoste = require('../model/ficheposte');
const OffreEmploi = require('../model/offreemploi');
const Candidature = require('../model/candidature');

const isLoggedIn = require('../middleware/isLoggedIn.js');
const requireRecruitorStatus = require('../middleware/requireRecruitorStatus.js');
const requireAffiliation = require('../middleware/requireAffiliation.js');
const readMessage = require('../middleware/readMessage.js');

// Route to browse offers with search, pagination, sorting and filtering
router.get('/browse_offers', isLoggedIn, readMessage, async function (req, res, next) {
    const search = req.query.search || '';
    const sort = req.query.sort || 'date';
    const typeMetier = req.query.typeMetier || '';
    const minSalaire = parseFloat(req.query.minSalaire) || 0;
    const maxSalaire = parseFloat(req.query.maxSalaire) || Number.MAX_SAFE_INTEGER;
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // Number of offers per page
    const offset = (page - 1) * limit;

    try {
        const {
            offres,
            totalOffres
        } = await OffreEmploi.browseOffers(search, sort, typeMetier, minSalaire, maxSalaire, limit, offset);
        const totalPages = Math.ceil(totalOffres / limit);
        const typesMetier = await OffreEmploi.getTypesMetier();

        logger.info("Offres d'emploi récupérées avec succès.");
        res.render('jobs/browse_offers', {
            offres,
            search,
            sort,
            selectedTypeMetier: typeMetier,
            minSalaire: minSalaire || '',
            maxSalaire: maxSalaire !== Number.MAX_SAFE_INTEGER ? maxSalaire : '',
            currentPage: page,
            totalPages,
            typesMetier,
            user: req.session.userEmail
        });
    } catch (error) {
        logger.error(`Erreur lors de la récupération des offres d'emploi: ${error.message}`, {stack: error.stack});
        error.status = 500;
        error.message = "Erreur interne du serveur lors de la récupération des offres d'emploi.";
        next(error);
    }
});

// Route to view offer (GET)
router.get('/view_offer', function (req, res) {
    res.redirect('/jobs/browse_offers');
});

// Route to view offer (POST)
router.post('/view_offer', isLoggedIn, async function (req, res, next) {
    try {
        const {idOffre} = req.body;
        const offre = await OffreEmploi.candidateViewOffer(idOffre);
        const isCandidate = await Candidature.isCandidate(req.session.userEmail, idOffre);
        logger.info(`Détails de l'offre ${idOffre} récupérés avec succès.`);
        res.render('jobs/view_offer', {offre, idOffre, isCandidate});
    } catch (error) {
        logger.error(`Erreur lors de la récupération de l'offre: ${error.message}`, {stack: error.stack});
        error.status = 500;
        error.message = "Erreur interne du serveur lors de la récupération de l'offre.";
        next(error);
    }
});

// Route to add offer (GET)
router.get('/add_offer', requireAffiliation, readMessage, async function (req, res, next) {
    try {
        const fiches = await FichePoste.list();
        logger.info("Fiches de poste récupérées avec succès.");
        res.render('jobs/add_offer', {fiches});
    } catch (error) {
        logger.error(`Erreur lors de la récupération des fiches de poste: ${error.message}`, {stack: error.stack});
        error.status = 500;
        error.message = "Erreur interne du serveur lors de la récupération des fiches de poste.";
        next(error);
    }
});

// Route to add offer (POST)
router.post('/add_offer', requireAffiliation, [
    body('dateValidité')
        .isISO8601()
        .withMessage('Date de validité invalide. Utilisez le format jj/mm/aaaa ou aaaa/mm/jj'),
    body('listePieces').notEmpty().withMessage('Liste des pièces requises'),
    body('nombrePieces').isInt({min: 1}).withMessage('Nombre de pièces doit être un entier positif'),
    body('idFiche').notEmpty().withMessage('ID de la fiche requis')
], async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.session.message = errors.array().map(e => e.msg).join(', ');
        req.session.messageType = 'error';
        return res.redirect('/jobs/add_offer');
    }

    try {
        const {dateValidité, listePieces, nombrePieces, idFiche} = req.body;
        const idRecruteur = req.session.userEmail;
        const etat = "non publié";

        if (!await FichePoste.isUserLegitimate(idFiche, req.session.userAffiliation)) {
            req.session.message = "Vous n'avez pas les droits pour ajouter une offre sur cette fiche";
            req.session.messageType = 'error';
            return res.redirect('/jobs/add_offer');
        }

        // Format the date correctly for MySQL
        const formattedDateValidite = new Date(dateValidité).toISOString().split('T')[0];

        await OffreEmploi.create({
            etat,
            dateValidite: formattedDateValidite,
            listePieces,
            nombrePieces,
            idFiche,
            idRecruteur
        });

        req.session.message = "Votre offre d'emploi a été ajoutée avec succès !";
        req.session.messageType = 'notification';
        logger.info(`Offre d'emploi ajoutée avec succès par ${idRecruteur}.`);

        res.redirect('/jobs/add_offer');
    } catch (error) {
        logger.error(`Erreur lors de l'ajout de l'offre d'emploi: ${error.message}`, {stack: error.stack});
        error.status = 500;
        error.message = "Erreur interne du serveur lors de l'ajout de l'offre d'emploi.";
        next(error);
    }
});

// Route to add job (GET)
router.get('/add_job', requireAffiliation, readMessage, function (req, res) {
    res.render('jobs/add_job');
});

// Route to add job (POST)
router.post('/add_job', requireAffiliation, [
    body('intitule').notEmpty().withMessage('Intitulé requis'),
    body('statutPoste').notEmpty().withMessage('Statut du poste requis'),
    body('responsableHierarchique').notEmpty().withMessage('Responsable hiérarchique requis'),
    body('typeMetier').notEmpty().withMessage('Type de métier requis'),
    body('lieuMission').notEmpty().withMessage('Lieu de mission requis'),
    body('rythme').notEmpty().withMessage('Rythme requis'),
    body('salaire').isFloat({min: 0}).withMessage('Salaire doit être un nombre positif'),
    body('description').notEmpty().withMessage('Description requise')
], async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.session.message = errors.array().map(e => e.msg).join(', ');
        req.session.messageType = 'error';
        return res.redirect('/jobs/add_job');
    }

    try {
        const {
            intitule,
            statutPoste,
            responsableHierarchique,
            typeMetier,
            lieuMission,
            rythme,
            salaire,
            description
        } = req.body;
        const idOrganisation = req.session.userAffiliation;

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
        req.session.message = "Votre fiche d'emploi a été ajoutée avec succès !";
        req.session.messageType = 'notification';
        logger.info(`Fiche de poste ajoutée avec succès par ${idOrganisation}.`);
        res.redirect('/jobs/add_job');
    } catch (error) {
        logger.error(`Erreur lors de l'ajout de la fiche de poste: ${error.message}`, {stack: error.stack});
        error.status = 500;
        error.message = "Erreur interne du serveur lors de l'ajout de la fiche de poste.";
        next(error);
    }
});

// Route to list user's offers (GET)
router.get('/my_offers', requireRecruitorStatus, readMessage, async function (req, res, next) {
    try {
        const offers = await OffreEmploi.listRecruitorsOffers(req.session.userEmail);
        logger.info(`Offres de l'utilisateur ${req.session.userEmail} récupérées avec succès.`);
        res.render('jobs/my_offers', {offers});
    } catch (error) {
        logger.error(`Erreur lors de la récupération des offres de l'utilisateur: ${error.message}`, {stack: error.stack});
        error.status = 500;
        error.message = "Erreur interne du serveur lors de la récupération des offres de l'utilisateur.";
        next(error);
    }
});

// Route to manage user's offers (POST)
router.post('/my_offers', requireAffiliation, [
    body('idOffre').notEmpty().withMessage("ID de l'offre requis"),
    body('action').isIn(['1', '2', '3']).withMessage('Action invalide')
], async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.session.message = errors.array().map(e => e.msg).join(', ');
        req.session.messageType = 'error';
        return res.redirect('/jobs/my_offers');
    }

    try {
        const {idOffre, action} = req.body;

        if (!await OffreEmploi.isUserLegitimate(idOffre, req.session.userEmail)) {
            req.session.message = "Vous n'avez pas les droits pour gérer cette offre.";
            req.session.messageType = 'error';
            return res.redirect('/dashboard');
        }

        logger.info(`Action : ${action} sur l'offre ${idOffre} par ${req.session.userEmail}`);

        if (action === '1') {
            await OffreEmploi.update(idOffre, {Etat: 'publié'});
        } else if (action === '2') {
            await OffreEmploi.update(idOffre, {Etat: 'non publié'});
        } else if (action === '3') {
            await OffreEmploi.delete(idOffre);
        }

        req.session.message = "L'action sur l'offre a été réalisée avec succès.";
        req.session.messageType = 'notification';
        res.redirect('/jobs/my_offers');
    } catch (error) {
        logger.error(`Erreur lors de la gestion de l'offre: ${error.message}`, {stack: error.stack});
        error.status = 500;
        error.message = "Erreur interne du serveur lors de la gestion de l'offre.";
        next(error);
    }
});

// Route to list user's jobs (GET)
router.get('/my_jobs', requireAffiliation, readMessage, async function (req, res, next) {
    try {
        const fiches = await FichePoste.listFiches(req.session.userAffiliation);
        logger.info(`Fiches de l'organisation ${req.session.userAffiliation} récupérées avec succès.`);
        res.render('jobs/my_jobs', {fiches});
    } catch (error) {
        logger.error(`Erreur lors de la récupération des fiches de l'organisation: ${error.message}`, {stack: error.stack});
        error.status = 500;
        error.message = "Erreur interne du serveur lors de la récupération des fiches de l'organisation.";
        next(error);
    }
});

// Route to manage user's jobs (POST)
router.post('/my_jobs', requireAffiliation, [
    body('idFiche').notEmpty().withMessage('ID de la fiche requis')
], async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.session.message = errors.array().map(e => e.msg).join(', ');
        req.session.messageType = 'error';
        return res.redirect('/jobs/my_jobs');
    }

    try {
        const {idFiche} = req.body;

        if (!await FichePoste.isUserLegitimate(idFiche, req.session.userAffiliation)) {
            req.session.message = "Vous n'avez pas les droits pour gérer cette fiche.";
            req.session.messageType = 'error';
            return res.redirect('/dashboard');
        }

        await FichePoste.delete(idFiche);
        req.session.message = 'La fiche a été supprimée avec succès.';
        req.session.messageType = 'notification';
        res.redirect('/jobs/my_jobs');
    } catch (error) {
        logger.error(`Erreur lors de la suppression de la fiche: ${error.message}`, { stack: error.stack });
        error.status = 500;
        error.message = "Erreur interne du serveur lors de la suppression de la fiche.";
        next(error);
    }
});

// Route to apply for a job (GET)
router.get('/apply', readMessage, function (req, res) {
    res.render('jobs/apply');
});

module.exports = router;
