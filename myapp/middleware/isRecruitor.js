const isLoggedIn = require('./isLoggedIn');

function isRecruitor(req, res, next) {
    if (true) {
        next();
    } else {
        res.redirect('/login');
    }
}

function middleware(req, res, next) {
    isLoggedIn(req, res, isRecruitor);
}

module.exports = middleware;