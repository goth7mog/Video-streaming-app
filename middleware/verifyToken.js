const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {

    // console.log('works');
    
    // Taking the token from cookie
    const { accessToken } = req.cookies;

    // console.log(res.locals)

    res.locals.DATA_TO_RENDER = res.locals.DATA_TO_RENDER || {};
    res.locals.DATA_TO_RENDER.messages = res.locals.DATA_TO_RENDER.messages || [];

    if (accessToken) {

        jwt.verify(accessToken, process.env.JWT_SEC, (err, token) => {

            req.accessToken = token;

            if (err) {
                req.accessToken = 'error';
                res.locals.DATA_TO_RENDER.enabled = 0;
                res.locals.DATA_TO_RENDER.messages.push({
                    type: "token",
                    subject: "Your token isn't valid"
                });
                next();
                return;
            }

            if (token.access.includes(req.query.v)) {
                res.locals.DATA_TO_RENDER.enabled = 1;
                next();

            } else {

                res.locals.DATA_TO_RENDER.enabled = 0;
                res.locals.DATA_TO_RENDER.preloader = true;
                next();

            }

        });

    } else {
        // If we don't have the access token
        res.locals.DATA_TO_RENDER.enabled = 0;
        res.locals.DATA_TO_RENDER.preloader = true;
        next();
        return;
    }
};

// A middleware for the streaming route
const verifyTokenForStream = (req, res, next) => {
    const { accessToken } = req.cookies;

    if (accessToken) {

        jwt.verify(accessToken, process.env.JWT_SEC, (err, token) => {

            // Get the video identifier from url
            const identifier = req.params.watch.substring(0, req.params.watch.indexOf("-"));

            if (err) {
                res.status(403).send("The token is not valid!");
            }
            if (token.access.includes(identifier)) {
                next();
            } else {
                res.status(403).send("You don't have the access to this video!");
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
