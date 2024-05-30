// Importation des modules
const express = require('express');
const router = express.Router();
const logger = require('../logger');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const fs = require('fs');
const archiver = require('archiver');
const PDFDocument = require('pdfkit');

const OffreEmploi = require('../model/offreemploi');
const Candidature = require('../model/candidature');
const Utilisateur = require('../model/utilisateur');
const AssociationFichier = require('../model/associationfichiers');
const Organisation = require('../model/organisation');

const isLoggedIn = require('../middleware/isLoggedIn.js');
const requireRecruitorStatus = require('../middleware/requireRecruitorStatus.js');
const readMessage = require('../middleware/readMessage.js');
const readReturnTo = require('../middleware/readReturnTo');

// Set storage engine
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Dossier pour enregistrer les fichiers
    },
    filename: function (req, file, cb) {
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
        logger.error(`Erreur lors de la candidature : ${error.message}`);
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
            await OffreEmploi.isUserInOrganisation(idOffre, req.session.userEmail) // Est membre de l'organisation associée ?
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
        logger.error(`Erreur lors de la récupération des pièces jointes : ${error.message}`);
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
            logger.info(`Téléchargement de la pièce jointe : ${fichier}`);
            if (
                req.session.userEmail === result.IdCandidat || // Est candidat associé ?
                await OffreEmploi.isUserInOrganisation(result.IdOffre, req.session.userEmail) // Fait partie de l'organisation associée ?
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
        logger.error(`Erreur lors du téléchargement de la pièce jointe : ${error.message}`);
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
        const { idCandidat, idOffre } = req.body;
        logger.info(`Tentative de Suppression avec idCandidat : ${idCandidat}, idOffre : ${idOffre}, affiliation : ${req.session.userType}`);

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
            if (await OffreEmploi.isUserInOrganisation(idOffre, req.session.userEmail)) {
                // ne supprime que si le recruteur est membre de l'organisation de l'offre
                await Candidature.delete(idCandidat, idOffre);
                req.session.message = `Vous avez refusé la candidature de ${await Utilisateur.getNom(idCandidat)} à ${await OffreEmploi.getNom(idOffre)}`;
                req.session.messageType = 'notification';
            } else {
                req.session.message = 'Vous n\'êtes pas autorisé à annuler cette candidature';
                req.session.messageType = 'error';
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
        logger.error(`Erreur lors de l'annulation de la candidature : ${error.message}`);
        error.status = 500;
        error.message = 'Erreur lors de l\'annulation de la candidature :' + error.message;
        next(error);
    }
});

// Route to list user's applications (GET)
router.get('/my-applications', isLoggedIn, readMessage, async function (req, res, next) {
    try {
        const candidatures = await Candidature.getApplicationsCandidat(req.session.userEmail);
        req.session.returnTo = "/applications/my-applications";
        res.render('applications/my_applications.ejs', { candidatures });
    } catch (error) {
        logger.error(`Erreur lors de la récupération des candidatures : ${error.message}`);
        error.status = 500;
        error.message = 'Erreur lors de la récupération des candidatures :' + error.message;
        next(error);
    }
});

// Route to list incoming applications (GET)
router.get('/incoming-applications', requireRecruitorStatus, readMessage, async function (req, res, next) {
    try {
        const idOrganisation = req.session.userAffiliation;
        const candidatures = await Candidature.getApplicationsForOrganisation(idOrganisation);
        req.session.returnTo = "/applications/incoming-applications";
        res.render('applications/incoming_applications.ejs', { candidatures });
    } catch (error) {
        logger.error(`Erreur lors de la récupération des candidatures de l'organisation : ${error.message}`);
        error.status = 500;
        error.message = 'Erreur lors de la récupération des candidatures de l\'organisation :' + error.message;
        next(error);
    }
});

// Route to download candidate folder (POST)
router.post('/download-candidate-folder', isLoggedIn, requireRecruitorStatus, [
    body('idCandidat').notEmpty().withMessage('ID du candidat requis'),
    body('idOffre').notEmpty().withMessage("ID de l'offre requis")
], async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.session.message = errors.array().map(e => e.msg).join(', ');
        req.session.messageType = 'error';
        return res.redirect('/applications/incoming-applications');
    }

    try {
        const { idCandidat, idOffre } = req.body;
        if (await OffreEmploi.isUserInOrganisation(idOffre, req.session.userEmail)) { // Est recruteur associé ?
            const user = await Utilisateur.read(idCandidat);
            const offre = await OffreEmploi.readWithFichePosteAndOrganisation(idOffre);
            const candidature = await Candidature.read(idCandidat, idOffre);
            const fichiers = await AssociationFichier.listFiles(idCandidat, idOffre);

            const zipFilePath = path.join(__dirname, '..', 'uploads', `dossier-${idCandidat}-${idOffre}.zip`);
            const output = fs.createWriteStream(zipFilePath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', function () {
                logger.info(`Dossier de candidature créé : dossier-${idCandidat}-${idOffre}.zip (${archive.pointer()} bytes)`);
                res.download(zipFilePath);
            });

            archive.on('error', function (err) {
                throw err;
            });

            archive.pipe(output);

            // Create PDF with candidate and offer information
            const doc = new PDFDocument();
            const pdfPath = path.join(__dirname, '..', 'uploads', `dossier-${idCandidat}-${idOffre}.pdf`);
            const pdfStream = fs.createWriteStream(pdfPath);

            doc.pipe(pdfStream);

            doc.fontSize(25).text(`Dossier de Candidature pour ${offre.Intitule}`, {
                align: 'center'
            });

            doc.moveDown();
            doc.fontSize(16).text(`Nom: ${user.Prenom} ${user.Nom}`);
            doc.fontSize(16).text(`Email: ${user.Email}`);
            doc.fontSize(16).text(`Téléphone: ${user.Telephone}`);
            doc.fontSize(16).text(`Date de Candidature: ${new Date(candidature.DateCandidature).toLocaleDateString()}`);
            doc.fontSize(16).text(`Offre: ${offre.Intitule}`);
            doc.fontSize(16).text(`Description de l'offre: ${offre.Description}`);
            doc.fontSize(16).text(`Lieu: ${offre.LieuMission}`);
            doc.fontSize(16).text(`Rythme: ${offre.Rythme}`);
            doc.fontSize(16).text(`Salaire: ${offre.Salaire} €`);
            doc.fontSize(16).text(`Responsable: ${offre.ResponsableHierarchique}`);
            doc.fontSize(16).text(`Valide jusqu'à: ${new Date(offre.DateValidite).toLocaleDateString()}`);
            doc.fontSize(16).text(`Organisation: ${offre.OrganisationNom}`);

            doc.end();

            // Ensure the PDF is written before appending it to the archive
            pdfStream.on('finish', async () => {
                // Append PDF to archive
                archive.file(pdfPath, { name: 'Dossier.pdf' });

                // Append each file to the archive
                for (const fichier of fichiers) {
                    const filePath = path.join(__dirname, '..', 'uploads', fichier.Fichier);
                    archive.file(filePath, { name: fichier.NomOriginal });
                }

                await archive.finalize();
            });

        } else {
            const error = new Error("Vous n'êtes pas autorisé à accéder à cette page.");
            error.status = 403;
            throw error;
        }
    } catch (error) {
        logger.error(`Une erreur est survenue lors de la création du dossier : ${error.message}`);
        error.status = 500;
        next(error);
    }
});

// Route to get application details (POST)
router.post('/get-application-details', isLoggedIn, async function (req, res, next) {
    try {
        const { idCandidat, idOffre } = req.body;
        if (!idCandidat || !idOffre) {
            req.session.message = "ID du candidat et de l'offre requis";
            req.session.messageType = 'error';
            return res.redirect('/applications/my-applications');
        }

        const candidature = await Candidature.read(idCandidat, idOffre);
        const fichiers = await AssociationFichier.listFiles(idCandidat, idOffre);
        const offre = await OffreEmploi.readWithFichePosteAndOrganisation(idOffre);
        const organisation = await Organisation.read(offre.IdOrganisation);
        logger.info(`Affichage des détails de l'organisation ${organisation.Nom}`);

        res.render('applications/application_details', {
            candidature,
            fichiers,
            offre,
            organisations: [organisation] // Inclure les informations de l'organisation
        });
    } catch (error) {
        logger.error(`Erreur lors de la récupération des détails de la candidature : ${error.message}`);
        error.message = `Erreur lors de la récupération des détails de la candidature : ${error.message}`;
        error.status = 500;
        next(error);
    }
});

// Route to edit application (POST)
router.post('/edit-application', isLoggedIn, upload.array('files'), [
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
        const filesToDelete = req.body.filesToDelete ? req.body.filesToDelete.split(',') : [];
        const files = req.files;

        // Suppression des fichiers marqués pour suppression
        if (filesToDelete.length > 0) {
            for (const file of filesToDelete) {
                await AssociationFichier.delete({ idCandidat, idOffre, fichier: file });
            }
        }

        // Ajout des nouveaux fichiers
        if (files && files.length > 0) {
            for (const file of files) {
                await AssociationFichier.create(idCandidat, idOffre, file.filename, file.originalname);
            }
        }

        req.session.message = 'Candidature mise à jour avec succès';
        req.session.messageType = 'notification';
        return res.redirect('/applications/my-applications');
    } catch (error) {
        logger.error(`Erreur lors de la mise à jour de la candidature : ${error.message}`);
        req.session.message = `Erreur lors de la mise à jour de la candidature : ${error.message}`;
        req.session.messageType = 'error';
        return res.redirect('/applications/my-applications');
    }
});

module.exports = router;
