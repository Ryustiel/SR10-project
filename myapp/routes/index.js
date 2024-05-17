const express = require('express');
const router = express.Router();

// Importation des routages spécifiques
const loginRouter = require('./login');
const registerRouter = require('./register');
const dashboardRouter = require('./dashboard');
const jobsRouter = require('./jobs');
const applicationsRouter = require('./applications');
const logger = require("../logger");

// Redirection principale vers la page de login
router.get('/', function(req, res) {
  res.redirect('/login');
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    logger.info("Session utilisateur terminée.");
    res.redirect('/login');
  });
});

// Attachement des routes spécifiques
router.use('/login', loginRouter);
router.use('/register', registerRouter);
router.use('/dashboard', dashboardRouter);

router.use('/candidat', dashboardRouter);
router.use('/recruteur', dashboardRouter);
router.use('/administrateur', dashboardRouter);

router.use('/jobs', jobsRouter);
router.use('/applications', applicationsRouter);

module.exports = router;