const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    // Take token from cookie
    const { accessToken } = req.cookies;

    req.dataToRender = req.dataToRender || {};
    req.dataToRender.messages = req.dataToRender.messages || [];

    if (accessToken) {

        jwt.verify(accessToken, process.env.JWT_SEC, (err, token) => {

            req.accessToken = token;

            if (err) {
                req.accessToken = 'error';
                req.dataToRender.enabled = 0;
                req.dataToRender.messages.push({
                    type: "token",
                    subject: "Your token isn't valid"
                });
                next();
                return;
            }

            if (token.access.includes(+req.query.v)) {
                req.dataToRender.enabled = 1;
                next();

            } else {

                req.dataToRender.enabled = 0;
                req.dataToRender.preloader = true;
                next();

            }

        });

    } else {
        // If we don't have access token
        req.dataToRender.enabled = 0;
        req.dataToRender.preloader = true;
        next();
        return;
    }
};

// Middleware for streaming route
const verifyTokenForStream = (req, res, next) => {
    const { accessToken } = req.cookies;

    if (accessToken) {

        jwt.verify(accessToken, process.env.JWT_SEC, (err, token) => {

            // Get video identifier from url
            const identifier = parseInt(req.params.watch.substring(0, req.params.watch.indexOf("-")));

            if (err) {
                res.status(403).send("Token is not valid!");
            }
            if (token.access.includes(identifier)) {
                next();
            } else {
                res.status(403).send("You don't have access to this video!");
            }
        });

    } else {
        res.status(403).send('No token');
        return;
    }
};


module.exports = {
    verifyToken,
    verifyTokenForStream
};
