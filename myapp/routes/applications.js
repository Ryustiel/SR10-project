// Importation des modules
const express = require('express');
const router = express.Router();
const logger = require('../logger');
const multer = require('multer');

const OffreEmploi = require('../model/offreemploi');
const Candidature = require('../model/candidature');
const Utilisateur = require('../model/utilisateur');
const Organisation = require('../model/organisation');

const isLoggedIn = require('../middleware/isLoggedIn.js');
const requireRecruitorStatus = require('../middleware/requireRecruitorStatus.js');
const requireAffiliation = require('../middleware/requireAffiliation.js');
const readNotification = require('../middleware/readNotification');
const isAdmin = require('../middleware/isAdmin');
const readReturnTo = require('../middleware/readReturnTo');


// Set storage engine
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/apply', upload.array('formFileLg'), isLoggedIn, async function(req, res, next) {
    try {
        const files = req.files;

        // Check if files exist
        //if (!files || files.length === 0) {
        //    return res.status(400).send('No files uploaded');
        //}

        // Convert the file buffers to strings or process them further
        files.forEach(file => {
            const fileString = file.buffer.toString();
            logger.warn(`File content : ${fileString}`)
            // Store the file string or process it further
        });

        const { idOffre } = req.body;
        const idCandidat = req.session.userEmail;
        const dateCandidature = new Date();

        // CREATE APPLICATION
        await Candidature.create({
            idCandidat,
            idOffre,
            dateCandidature
        });

        const nom = await OffreEmploi.getNom(idOffre);
        req.session.notification = `Vous avez postulé à ${nom}`;
        res.redirect('/jobs/browse_offers');
    } catch (error) {
        next(error);
    }
});


router.post('/cancel-application', isLoggedIn, readReturnTo, async function(req, res, next) {
    const { idCandidat, idOffre } = req.body;
    logger.warn(`Suppression avec idCandidat : ${idCandidat}, idOffre : ${idOffre} affiliation : ${req.session.userType}`);
    if (idCandidat === 'self') {
        if (await Candidature.isCandidate(req.session.userEmail, idOffre)) {
            await Candidature.delete(req.session.userEmail, idOffre);
            req.session.notification = `
            Vous ne candidatez plus à ${await OffreEmploi.getNom(idOffre)}
        `;
        } else {
            req.session.notification = `Vous n'êtes pas candidat à ${await OffreEmploi.getNom(idOffre)}`;
        }
    } else if (req.session.userType === 'recruteur') {
        if (await OffreEmploi.isUserLegitimate(idOffre, req.session.userEmail)) {
            await Candidature.delete(idCandidat, idOffre);
            req.session.notification = `Vous avez refusé la candidature de ${await Utilisateur.getNom(idCandidat)} à ${await OffreEmploi.getNom(idOffre)}`;
        }
    } else if (req.session.userAffiliation === 'administrateur') {
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