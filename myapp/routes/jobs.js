const express = require('express');
const router = express.Router();
const logger = require('../logger');
const {body, validationResult} = require('express-validator');

const FichePoste = require('../model/ficheposte');
const OffreEmploi = require('../model/offreemploi');
const Candidature = require('../model/candidature');
const Organisation = require('../model/organisation');

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
    const excludeOrganisationId = req.session.userAffiliation;
    const userRole = req.session.userType;
    const placeholder = "Rechercher par intitulé";

    try {
        const {
            offres,
            totalOffres
        } = await OffreEmploi.browseOffers(search, sort, typeMetier, minSalaire, maxSalaire, limit, offset, excludeOrganisationId, userRole);
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
            user: req.session.userEmail,
            userRole: userRole,
            placeholder
        });
    } catch (error) {
        logger.error(`Erreur lors de la récupération des offres d'emploi: ${error.message}`, { stack: error.stack });
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
        const { idOffre } = req.body;
        const offre = await OffreEmploi.candidateViewOffer(idOffre);
        const isCandidate = await Candidature.isCandidate(req.session.userEmail, idOffre);
        logger.info(`Détails de l'offre ${idOffre} récupérés avec succès.`);
        res.render('jobs/offer_details', { offre, idOffre, isCandidate });
    } catch (error) {
        logger.error(`Erreur lors de la récupération de l'offre: ${error.message}`, { stack: error.stack });
        next(error);
    }
});

// Route to add offer (GET)
router.get('/add_offer', requireAffiliation, readMessage, async function (req, res, next) {
    try {
        const fiches = await FichePoste.listFichesForOrganization(req.session.userAffiliation);
        logger.info("Fiches de poste récupérées avec succès.");
        res.render('jobs/add_offer', { fiches });
    } catch (error) {
        logger.error(`Erreur lors de la récupération des fiches de poste: ${error.message}`, { stack: error.stack });
        next(error);
    }
});

// Route to add offer (POST)
router.post('/add_offer', requireAffiliation, [
    body('dateValidité')
        .isISO8601()
        .withMessage('Date de validité invalide. Utilisez le format jj/mm/aaaa ou aaaa/mm/jj')
        .custom((value) => {
            const inputDate = new Date(value);
            const currentDate = new Date();
            // Comparer uniquement les dates (ignorer les heures)
            if (inputDate.setHours(0,0,0,0) < currentDate.setHours(0,0,0,0)) {
                throw new Error('La date de validité doit être postérieure ou égale à la date actuelle.');
            }
            return true;
        }),
    body('listePieces').notEmpty().withMessage('Liste des pièces requises'),
    body('nombrePieces').isInt({ min: 1 }).withMessage('Nombre de pièces doit être un entier positif'),
    body('idFiche').notEmpty().withMessage('ID de la fiche requis')
], async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.session.message = errors.array().map(e => e.msg).join(', ');
        req.session.messageType = 'error';
        return res.redirect('/jobs/add_offer');
    }

    try {
        const { dateValidité, listePieces, nombrePieces, idFiche } = req.body;
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
        logger.error(`Erreur lors de l'ajout de l'offre d'emploi: ${error.message}`, { stack: error.stack });
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
        next(error);
    }
});

// Route to list user's offers (GET)
router.get('/my_offers', requireRecruitorStatus, readMessage, async function (req, res, next) {
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // Number of offers per page
    const offset = (page - 1) * limit;
    const idOrganisation = req.session.userAffiliation;
    const placeholder = "Rechercher par intitulé";

    try {
        const offers = await OffreEmploi.listOffersForOrganisation(idOrganisation, search, limit, offset);
        const totalOffers = await OffreEmploi.countOffersForOrganisation(idOrganisation, search);
        const totalPages = Math.ceil(totalOffers / limit);

        logger.info(`Offres de l'organisation ${idOrganisation} récupérées avec succès.`);
        res.render('jobs/my_offers', {
            offers,
            search,
            currentPage: page,
            totalPages,
            placeholder // Pass the placeholder to the view
        });
    } catch (error) {
        logger.error(`Erreur lors de la récupération des offres de l'organisation: ${error.message}`, { stack: error.stack });
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

        if (!await OffreEmploi.isUserInOrganisation(idOffre, req.session.userEmail)) {
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
        next(error);
    }
});

// Route to list user's jobs (GET)
router.get('/my_jobs', requireAffiliation, readMessage, async function (req, res, next) {
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // Nombre de fiches par page
    const offset = (page - 1) * limit;
    const idOrganisation = req.session.userAffiliation;
    const placeholder = "Rechercher par intitulé";

    try {
        const fiches = await FichePoste.listFichesWithPaginationAndSearch(idOrganisation, search, limit, offset);
        const totalFiches = await FichePoste.countFichesWithSearch(idOrganisation, search);
        const totalPages = Math.ceil(totalFiches / limit);

        // Ajout des détails de l'organisation pour chaque fiche
        for (let fiche of fiches) {
            const organisation = await Organisation.read(fiche.IdOrganisation);
            fiche.OrganisationNom = organisation.Nom;
        }

        logger.info(`Fiches de l'organisation ${idOrganisation} récupérées avec succès.`);
        res.render('jobs/my_jobs', {
            fiches,
            search,
            currentPage: page,
            totalPages,
            placeholder
        });
    } catch (error) {
        logger.error(`Erreur lors de la récupération des fiches de l'organisation: ${error.message}`, { stack: error.stack });
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
        const { idFiche } = req.body;
        logger.info(`ID de la fiche reçu: ${idFiche}`);

        if (!await FichePoste.isUserLegitimate(idFiche, req.session.userAffiliation)) {
            req.session.message = "Vous n'avez pas les droits pour gérer cette fiche.";
            req.session.messageType = 'error';
            return res.redirect('/dashboard');
        }

        const hasDependents = await FichePoste.hasDependents(idFiche);
        if (hasDependents) {
            await FichePoste.deleteWithDependents(idFiche);
            req.session.message = "La fiche et ses dépendances ont été supprimées avec succès.";
            req.session.messageType = 'notification';
        } else {
            await FichePoste.delete(idFiche);
            req.session.message = 'La fiche a été supprimée avec succès.';
            req.session.messageType = 'notification';
        }
        res.redirect('/jobs/my_jobs');
    } catch (error) {
        logger.error(`Erreur lors de la suppression de la fiche: ${error.message}`, { stack: error.stack });
        next(error);
    }
});

// Route to apply for a job (GET)
router.get('/apply', readMessage, function (req, res) {
    res.render('jobs/apply');
});

// Route to check if a fiche has dependent offers
router.get('/check_dependents', async function (req, res, next) {
    try {
        const { idFiche } = req.query;
        const hasDependents = await FichePoste.hasDependents(idFiche);
        res.json({ hasDependents });
    } catch (error) {
        logger.error(`Erreur lors de la vérification des dépendances: ${error.message}`, { stack: error.stack });
        next(error);
    }
});

// Route to edit offer (GET)
function formatDateToLocalISOString(date) {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
}

// Route to edit offer (GET)
router.get('/edit_offer', requireAffiliation, readMessage, async function (req, res, next) {
    try {
        const { idOffre } = req.query;
        if (!idOffre) {
            req.session.message = 'ID de l\'offre requis.';
            req.session.messageType = 'error';
            return res.redirect('/jobs/my_offers');
        }

        const offre = await OffreEmploi.read(idOffre);
        const fiches = await FichePoste.listFichesForOrganization(req.session.userAffiliation);

        // Format the DateValidite to YYYY-MM-DD in local time
        offre.DateValiditeFormatted = formatDateToLocalISOString(new Date(offre.DateValidite));

        logger.info(`Détails de l'offre ${idOffre} récupérés avec succès.`);
        logger.info("DateValidite: " + offre.DateValidite);
        res.render('jobs/edit_offer', { offre, fiches });
    } catch (error) {
        logger.error(`Erreur lors de la récupération de l'offre: ${error.message}`, { stack: error.stack });
        next(error);
    }
});

// Route to edit offer (POST)
router.post('/edit_offer', requireAffiliation, [
    body('idOffre').notEmpty().withMessage("ID de l'offre requis"),
    body('dateValidité')
        .isISO8601()
        .withMessage('Date de validité invalide. Utilisez le format jj/mm/aaaa ou aaaa/mm/jj')
        .custom((value) => {
            const inputDate = new Date(value);
            const currentDate = new Date();
            if (inputDate.setHours(0, 0, 0, 0) < currentDate.setHours(0, 0, 0, 0)) {
                throw new Error('La date de validité doit être postérieure ou égale à la date actuelle.');
            }
            return true;
        }),
    body('listePieces').notEmpty().withMessage('Liste des pièces requises'),
    body('nombrePieces').isInt({ min: 1 }).withMessage('Nombre de pièces doit être un entier positif'),
    body('idFiche').notEmpty().withMessage('ID de la fiche requis')
], async function (req, res, next) {
    const errors = validationResult(req);
    const { idOffre } = req.body;

    if (!errors.isEmpty()) {
        req.session.message = errors.array().map(e => e.msg).join(', ');
        req.session.messageType = 'error';
        return res.redirect(`/jobs/edit_offer?idOffre=${idOffre}`);
    }

    try {
        const { dateValidité, listePieces, nombrePieces, idFiche } = req.body;

        const fields = {
            DateValidite: new Date(dateValidité).toISOString().split('T')[0],
            ListePieces: listePieces,
            NombrePieces: parseInt(nombrePieces, 10),
            IdFiche: idFiche
        };

        await OffreEmploi.update(idOffre, fields);

        req.session.message = "L'offre d'emploi a été mise à jour avec succès.";
        req.session.messageType = 'notification';
        res.redirect('/jobs/my_offers');
    } catch (error) {
        logger.error(`Erreur lors de la mise à jour de l'offre d'emploi: ${error.message}`);
        error.status = 500;
        next(error);
    }
});

// Route pour editer les fiches de postes (GET)
router.get('/edit_job', requireAffiliation, readMessage, async function (req, res, next) {
    try {
        const { idFiche } = req.query;
        if (!idFiche) {
            req.session.message = 'ID de la fiche requis.';
            req.session.messageType = 'error';
            return res.redirect('/jobs/my_jobs');
        }

        const fiche = await FichePoste.read(idFiche);
        const organisations = await Organisation.readall();

        logger.info(`Détails de la fiche ${idFiche} récupérés avec succès.`);
        res.render('jobs/edit_job', { fiche, organisations });
    } catch (error) {
        logger.error(`Erreur lors de la récupération de la fiche: ${error.message}`, { stack: error.stack });
        next(error);
    }
});

// Route pour la mise à jour d'une fiche de poste (POST)
router.post('/edit_job', requireAffiliation, [
    body('idFiche').notEmpty().withMessage("ID de la fiche requis"),
    body('intitule').notEmpty().withMessage('Intitulé requis'),
    body('statutPoste').notEmpty().withMessage('Statut du poste requis'),
    body('responsableHierarchique').notEmpty().withMessage('Responsable hiérarchique requis'),
    body('typeMetier').notEmpty().withMessage('Type de métier requis'),
    body('lieuMission').notEmpty().withMessage('Lieu de mission requis'),
    body('rythme').notEmpty().withMessage('Rythme requis'),
    body('salaire').isFloat({ min: 0 }).withMessage('Salaire doit être un nombre positif'),
    body('description').notEmpty().withMessage('Description requise'),
    body('idOrganisation').notEmpty().withMessage('ID de l\'organisation requis')
], async function (req, res, next) {
    const errors = validationResult(req);
    const { idFiche } = req.body;

    if (!errors.isEmpty()) {
        req.session.message = errors.array().map(e => e.msg).join(', ');
        req.session.messageType = 'error';
        return res.redirect(`/jobs/edit_job?idFiche=${idFiche}`);
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
            description,
            idOrganisation
        } = req.body;

        const fields = {
            intitule,
            statutPoste,
            responsableHierarchique,
            typeMetier,
            lieuMission,
            rythme,
            salaire,
            description,
            idOrganisation
        };

        await FichePoste.update(idFiche, fields);

        req.session.message = "La fiche de poste a été mise à jour avec succès.";
        req.session.messageType = 'notification';
        res.redirect('/jobs/my_jobs');
    } catch (error) {
        logger.error(`Erreur lors de la mise à jour de la fiche de poste: ${error.message}`);
        error.status = 500;
        next(error);
    }
});

module.exports = router;
