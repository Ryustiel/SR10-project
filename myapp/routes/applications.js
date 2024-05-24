// Importation des modules
const express = require('express');
const router = express.Router();
const logger = require('../logger');
const multer = require('multer');
const path = require('path');

const OffreEmploi = require('../model/offreemploi');
const Candidature = require('../model/candidature');
const Utilisateur = require('../model/utilisateur');
const Organisation = require('../model/organisation');
const AssociationFichier = require('../model/associationfichiers')

const isLoggedIn = require('../middleware/isLoggedIn.js');
const requireRecruitorStatus = require('../middleware/requireRecruitorStatus.js');
const requireAffiliation = require('../middleware/requireAffiliation.js');
const readNotification = require('../middleware/readNotification');
const isAdmin = require('../middleware/isAdmin');
const readReturnTo = require('../middleware/readReturnTo');


// Set storage engine
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Folder to save the files
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

router.post('/apply', upload.array('formFileLg'), isLoggedIn, async function(req, res, next) {
    try {
        const files = req.files;

        // Check if files exist
        if (!files || files.length === 0) {
            return res.status(400).send('No files uploaded');
        }

        // Process and save files
        const filenames = files.map(file => file.filename);
        logger.info(`uploaded ${files.length} files as ${JSON.stringify(filenames)}`);

        const { idOffre } = req.body;
        const idCandidat = req.session.userEmail;
        const dateCandidature = new Date();

        // CREATE APPLICATION
        await Candidature.create(
            idCandidat,
            idOffre,
            dateCandidature,
            filenames
        );

        // NOTIFY
        const nom = await OffreEmploi.getNom(idOffre);
        req.session.notification = `Vous avez postulé à ${nom}`;
        res.redirect('/jobs/browse_offers');
    } catch (error) {
        next(error);
    }
});


router.post('/attachments', isLoggedIn, async function(req, res, next) {
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
            fichiers: fichiers
        });
    } else {
        res.status(403).send('Unauthorized');
    }
});


router.get('/download-attachment', isLoggedIn, async function(req, res, next) {
    const { fichier } = req.query;
    const result = await AssociationFichier.readFichier(fichier);
    if (!result) {
        res.status(403).send('Unauthorized');
    } else {
        logger.warn(`DOWNLOAD ATTACHMENT : ${JSON.stringify(result)}`);
        if (
            req.session.userEmail === result.IdCandidat || // Est candidat associé ?
            await OffreEmploi.isOrganisationLegitimate(result.IdOffre, req.session.userEmail) // Fait partie de l'organisation associée ?
        ) {
            const filePath = path.join(__dirname, '..', 'uploads', fichier);
            res.download(filePath, fichier);
        } else {
            res.status(403).send('Unauthorized');
        }
    }
});


router.post('/cancel-application', isLoggedIn, readReturnTo, async function(req, res, next) {
    const { idCandidat, idOffre } = req.body;
    logger.info(`Tentative de Suppression avec idCandidat : ${idCandidat}, idOffre : ${idOffre} affiliation : ${req.session.userType}`);
    // GESTION DES PERMISSIONS DES UTILISATEURS
    if (idCandidat === 'self') {
        if (await Candidature.isCandidate(req.session.userEmail, idOffre)) {
            // ne supprime que si l'utilisateur a crée la candidature
            await Candidature.delete(req.session.userEmail, idOffre);
            req.session.notification = `
            Vous ne candidatez plus à ${await OffreEmploi.getNom(idOffre)}
        `;
        } else {
            req.session.notification = `Vous n'êtes pas candidat à ${await OffreEmploi.getNom(idOffre)}`;
        }
    } else if (req.session.userType === 'recruteur') {
        if (await OffreEmploi.isUserLegitimate(idOffre, req.session.userEmail)) {
            // ne supprime que si le recruteur est proprietaire de l'offre
            await Candidature.delete(idCandidat, idOffre);
            req.session.notification = `Vous avez refusé la candidature de ${await Utilisateur.getNom(idCandidat)} à ${await OffreEmploi.getNom(idOffre)}`;
        }
    } else if (req.session.userAffiliation === 'administrateur') {
        // la suppression est permise inconditionnellement
        await Candidature.delete(idCandidat, idOffre);
    } else {
        req.session.notification = 'Vous n\'êtes pas autorisé à annuler cette candidature'
    }

    res.redirect(req.returnTo);
});


router.get('/my-applications', isLoggedIn, readNotification, async function(req, res, next) {

    const candidatures = await Candidature.getApplicationsCandidat(req.session.userEmail);

    req.session.returnTo = "/applications/my-applications";
    res.render('applications/my_applications.ejs', {
        notification: req.notification,
        candidatures: candidatures
    });
});


router.get('/incoming-applications', requireRecruitorStatus, readNotification, async function(req, res, next) {
    const candidatures = await Candidature.getApplicationsRecruteur(req.session.userEmail);

    req.session.returnTo = "/applications/incoming-applications";
    res.render('applications/incoming_applications.ejs', {
        notification: req.notification,
        candidatures: candidatures
    });
});


module.exports = router;