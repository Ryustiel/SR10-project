const express = require('express');
const router = express.Router();
const logger = require('../logger');
const multer = require('multer');

const OffreEmploi = require('../model/offreemploi');
const Candidature = require('../model/candidature');

const isLoggedIn = require('../middleware/isLoggedIn.js');
const requireRecruitorStatus = require('../middleware/requireRecruitorStatus.js');
const requireAffiliation = require('../middleware/requireAffiliation.js');
const readNotification = require('../middleware/readNotification');

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


router.post('/cancel-application', isLoggedIn, async function(req, res, next) {
    const { idOffre, idCandidat } = req.body;
    if (idCandidat === 'self') {
        if (await Candidature.isCandidate(req.session.userEmail, idOffre)) {
            await Candidature.delete(req.session.userEmail, idOffre);
            req.session.notification = `
            Vous ne candidatez plus à ${await OffreEmploi.getNom(idOffre)}
        `;
            res.redirect('/jobs/browse_offers');
        } else {
            req.session.notification = `Vous n'êtes pas candidat à ${await OffreEmploi.getNom(idOffre)}`;
            res.redirect('/jobs/browse_offers');
        }
    } else if (req.session.userAffiliation === 'recruiter') {
        await Candidature.delete(idCandidat, idOffre);
        // TODO : A SECURISER
    }
        else {
        req.session.notification = 'Vous n\'êtes pas autorisé à annuler cette candidature'
        res.redirect('/jobs/browse_offers');
    }
});


router.get('/my-applications', isLoggedIn, readNotification, async function(req, res, next) {

    const candidatures = await Candidature.getApplicationsCandidat(req.session.userEmail);

    res.render('applications/my_applications.ejs', {
        notification: req.notification,
        candidatures: candidatures
    });
});


router.get('/incoming-applications', async function(req, res, next) {
    const candidatures = await Candidature.getApplicationsRecruteur(req.session.userEmail);

    res.render('applications/incoming_applications.ejs', {
        notification: req.notification,
        candidatures: candidatures
    });
});


router.get('/recruitor-requests', function(req, res, next) {
    res.render('applications/browse_received.ejs', { title: 'Requêtes Recruteur' });
});
router.get('/organization-requests', function(req, res, next) {
    res.render('applications/browse_received.ejs', { title: 'Requêtes Organisations' });
});
router.get('/applicants', function(req, res, next) {
    res.render('applications/browse_received.ejs', { title: 'Requêtes Emploi' });
});

router.get('/offers', function(req, res, next) {
    res.render('applications/browse_sent.ejs', { title: 'Mes Offres' });
});
router.get('/job-descriptions', function(req, res, next) {
    res.render('applications/browse_sent.ejs', { title: 'Mes Fiches Emploi' });
});

module.exports = router;