var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

const userModel = require('../model/utilisateur');

router.get('/userslist', function(req, res, next) {
  userModel.readall(function(error, result) {
    if (error) {
      return next(error);
    }
    res.render('usersList', { title: 'Liste des utilisateurs', users: result || [] });
  });
});


module.exports = router;