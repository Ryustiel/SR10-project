var express = require('express');
var router = express.Router();
const loginRouter = require('./login');
const registerRouter = require('./register');
const dashboardRouter = require('./dashboard');

/* GET home page. */
router.all('/', function(req, res) {
  res.redirect('/login');
});

/* Utilisation des routeurs pour les pages de connexion et d'inscription */
router.use('/login', loginRouter);
router.use('/register', registerRouter);

// A changer pour rediriger vers le bon dashboard sur chaque type de compte
router.get('/candidat', function(req, res, next) {
  res.render('dashboards/dashboard');
});

router.get('/recruteur', function(req, res, next) {
  res.render('dashboards/dashboard');
});

router.get('/administrateur', function(req, res, next) {
  res.render('dashboards/dashboard');
});

router.use('/dashboard', dashboardRouter);


module.exports = router;
