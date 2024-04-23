const express = require('express');
const router = express.Router();
const userModel = require('../model/utilisateur');

router.get('/userslist', function(req, res, next) {
  userModel.readall(function(error, result) {
    if (error) {
      return next(error);
    }
    res.render('usersList', { title: 'Liste des Utilisateurs', users: result || [] });
  });
});

//A MODIFIER POUR ETRE ASYNC
router.get('/browse', function(req, res, next) {
    userModel.readall(function(error, result) {
        if (error) {
            return next(error);
        }
        res.render('users/browse_users', { users: result || [] });
    });
});

module.exports = router;