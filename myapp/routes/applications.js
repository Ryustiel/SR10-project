// Importation des modules
const express = require('express');
const router = express.Router();
const logger = require('../logger');
const multer = require('multer');
const path = require('path');
const {body, validationResult} = require('express-validator');

const OffreEmploi = require('../model/offreemploi');
const Candidature = require('../model/candidature');
const Utilisateur = require('../model/utilisateur');
const AssociationFichier = require('../model/associationfichiers');

const isLoggedIn = require('../middleware/isLoggedIn.js');
const requireRecruitorStatus = require('../middleware/requireRecruitorStatus.js');
const readMessage = require('../middleware/readMessage.js');
const readReturnTo = require('../middleware/readReturnTo');

// Set storage engine
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Dossier pour enregistrer les fichiers
    },
    filename: async function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const formattedFilename = uniqueSuffix + '-' + file.originalname;
        cb(null, formattedFilename);
    }
});
const upload = multer({ storage: storage });

// Route to apply for a job (POST)
router.post('/apply', isLoggedIn, upload.array('files'), [
    body('idOffre').notEmpty().withMessage("ID de l'offre requis")
], async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.session.message = errors.array().map(e => e.msg).join(', ');
        req.session.messageType = 'error';
        return res.redirect('/jobs/browse_offers');
    }

    try {
        const files = req.files;

        // Check if files exist
        if (!files || files.length === 0) {
            req.session.message = 'No files uploaded';
            req.session.messageType = 'error';
            return res.redirect('/jobs/browse_offers');
        }

        const { idOffre } = req.body;
        const idCandidat = req.session.userEmail;
        const dateCandidature = new Date();

        // CREATE APPLICATION
        await Candidature.create(idCandidat, idOffre, dateCandidature, files);

        // NOTIFY
        const nom = await OffreEmploi.getNom(idOffre);
        req.session.message = `Vous avez postulé à ${nom}`;
        req.session.messageType = 'notification';
        res.redirect('/jobs/browse_offers');
    } catch (error) {
        error.status = 500;
        error.message = 'Erreur lors de la candidature :' + error.message;
        next(error);
    }
});

// Route to view attachments (POST)
router.post('/attachments', isLoggedIn, [
    body('idCandidat').notEmpty().withMessage('ID du candidat requis'),
    body('idOffre').notEmpty().withMessage("ID de l'offre requis")
], async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.session.message = errors.array().map(e => e.msg).join(', ');
        req.session.messageType = 'error';
        return res.redirect('/applications/my-applications');
    }

    try {
        const { idCandidat, idOffre } = req.body;
        if (
            req.session.userEmail === idCandidat || // Est candidat associé ?
            await OffreEmploi.isUserLegitimate(idOffre, req.session.userEmail) // Est recruteur associé ?
        ) {
            const nom_candidat = await Utilisateur.getNom(idCandidat);
            const nom_offre = await OffreEmploi.getNom(idOffre);
            const fichiers = await AssociationFichier.listFiles(idCandidat, idOffre);

            res.render('applications/attachments.ejs', {
                nom_candidat: nom_candidat,
                nom_offre: nom_offre,
                fichiers: fichiers.map(file => ({
                    Fichier: file.Fichier,
                    NomOriginal: file.NomOriginal
                }))
            });
        } else {
            let error = new Error();
            error.message = "Vous n'êtes pas autorisé à accéder à cette page.";
            error.status = 403;
            next(error);
        }
    } catch (error) {
        error.status = 500;
        error.message = "Une erreur est survenue lors de la récupération des pièces jointes :" + error.message;
        next(error);
    }
});

// Route to download attachment (GET)
router.get('/download-attachment', isLoggedIn, async function (req, res, next) {
    try {
        const { fichier } = req.query;
        const result = await AssociationFichier.readFichier(fichier);
        if (!result) {
            let error = new Error();
            error.message = "Vous n'êtes pas autorisé à accéder à cette page.";
            error.status = 403;
            next(error);
        } else {
            logger.warn(`DOWNLOAD ATTACHMENT : ${JSON.stringify(result)}`);
            if (
                req.session.userEmail === result.IdCandidat || // Est candidat associé ?
                await OffreEmploi.isOrganisationLegitimate(result.IdOffre, req.session.userEmail) // Fait partie de l'organisation associée ?
            ) {
                const filePath = path.join(__dirname, '..', 'uploads', fichier);
                res.download(filePath, result.NomOriginal); // Utilisation du nom original pour le téléchargement
            } else {
                let error = new Error();
                error.message = "Vous n'êtes pas autorisé à accéder à cette page.";
                error.status = 403;
                next(error);
            }
        }
    } catch (error) {
        error.status = 500;
        error.message = 'Erreur lors du téléchargement de la pièce jointe :' + error.message;
        next(error);
    }
});

// Route to cancel application (POST)
router.post('/cancel-application', isLoggedIn, readReturnTo, [
    body('idCandidat').notEmpty().withMessage('ID du candidat requis'),
    body('idOffre').notEmpty().withMessage("ID de l'offre requis")
], async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.session.message = errors.array().map(e => e.msg).join(', ');
        req.session.messageType = 'error';
        return res.redirect(req.returnTo);
    }

    try {
        const {idCandidat, idOffre} = req.body;
        logger.info(`Tentative de Suppression avec idCandidat : ${idCandidat}, idOffre : ${idOffre} affiliation : ${req.session.userType}`);

        // GESTION DES PERMISSIONS DES UTILISATEURS
        if (idCandidat === 'self') {
            if (await Candidature.isCandidate(req.session.userEmail, idOffre)) {
                // ne supprime que si l'utilisateur a crée la candidature
                await Candidature.delete(req.session.userEmail, idOffre);
                req.session.message = `Vous ne candidatez plus à ${await OffreEmploi.getNom(idOffre)}`;
                req.session.messageType = 'notification';
            } else {
                req.session.message = `Vous n'êtes pas candidat à ${await OffreEmploi.getNom(idOffre)}`;
                req.session.messageType = 'error';
            }
        } else if (req.session.userType === 'recruteur') {
            if (await OffreEmploi.isUserLegitimate(idOffre, req.session.userEmail)) {
                // ne supprime que si le recruteur est proprietaire de l'offre
                await Candidature.delete(idCandidat, idOffre);
                req.session.message = `Vous avez refusé la candidature de ${await Utilisateur.getNom(idCandidat)} à ${await OffreEmploi.getNom(idOffre)}`;
                req.session.messageType = 'notification';
            }
        } else if (req.session.userAffiliation === 'administrateur') {
            // la suppression est permise inconditionnellement
            await Candidature.delete(idCandidat, idOffre);
            req.session.message = 'La candidature a été annulée avec succès.';
            req.session.messageType = 'notification';
        } else {
            req.session.message = "Vous n'êtes pas autorisé à annuler cette candidature";
            req.session.messageType = 'error';
        }

        res.redirect(req.returnTo);
    } catch (error) {
        error.status = 500;
        error.message = 'Une erreur est survenue lors de l\'annulation de la candidature :' + error.message;
        next(error);
    }
});

// Route to list user's applications (GET)
router.get('/my-applications', isLoggedIn, readMessage, async function(req, res, next) {
    try {
        const candidatures = await Candidature.getApplicationsCandidat(req.session.userEmail);
        req.session.returnTo = "/applications/my-applications";
        res.render('applications/my_applications.ejs', { candidatures });
    } catch (error) {
        error.status = 500;
        error.message = 'Erreur lors de la récupération des candidatures :' + error.message;
        next(error);
    }
});

// Route to list incoming applications (GET)
router.get('/incoming-applications', requireRecruitorStatus, readMessage, async function(req, res, next) {
    try {
        const candidatures = await Candidature.getApplicationsRecruteur(req.session.userEmail);
        req.session.returnTo = "/applications/incoming-applications";
        res.render('applications/incoming_applications.ejs', { candidatures });
    } catch (error) {
        error.status = 500;
        error.message = "Erreur lors de la récupération des candidatures entrantes :" + error.message;
        next(error);
    }
});

module.exports = router;
