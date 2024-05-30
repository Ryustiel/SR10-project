module.exports = (req, res, next) => {
    res.locals.currentUserEmail = req.session.userEmail || '';
    res.locals.userRole = req.session.userType || '';
    res.locals.activePage = req.originalUrl;
    console.log("current page: " + req.originalUrl);
    res.locals.space = req.session.space;
    next();
};
