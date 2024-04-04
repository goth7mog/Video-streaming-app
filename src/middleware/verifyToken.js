const jwt = require("jsonwebtoken");


const verifyToken = (req, res, next) => {
    
    // Taking the token from the cookie
    const { accessToken } = req.cookies;

    if (accessToken) {

        jwt.verify(accessToken, process.env.JWT_SEC, (err, token) => {

            if (err) {
                req.accessToken = null;
                next();
            } else {
                req.accessToken = token;
                next();
            }
        });

    } else {
        req.accessToken = null;
        next();
    }
};

const priceZeroCheck = async (id) => {
    // throw new Error('Content has been deleted');
    const Video = await global.database.collection("videos").findOne({
        "watch": parseInt(id)
    });

    if (Video == null) throw new Error('Content has been deleted');

    return (Video.price === 0 ? true : false);
}


// A middleware for the streaming route
const verifyAccessToStream = async (req, res, next) => {
    const { accessToken } = req.cookies;
    const { user_id } = req.session;

    try {

        if (user_id) {

            return next();
    
        } else {
            // Get the video identifier from url
            const identifier = req.params.watch.substring(0, req.params.watch.indexOf("-"));
    
            if (accessToken) {

                // console.log('or here')
    
                jwt.verify(accessToken, process.env.JWT_SEC, async (err, token) => {
        
                    try {
                        if (err) {
                            (await priceZeroCheck(identifier)) ? next() : res.status(401).send("Your token is not valid!");
                            return;
                        }
            
                        if ( token.access.includes(Number(identifier)) ) {
                            next();
                            return;

                        } else {
                            (await priceZeroCheck(identifier)) ? next() : res.status(403).send("You didn't purchase access to this video!");
                            return;
                        }

                    } catch(err) {
                        console.log(err);
                        res.status(500).send(`Internal server error while checking the access to the stream`);
                    }

                });
    
            } else {
                (await priceZeroCheck(identifier)) ? next() : res.status(403).send('No access');
                return; 
            }
    
        }

    } catch (err) {
        // console.log(err);
        res.status(500).send(`Internal server error while checking the access to the stream`);
    }

};


module.exports = {
    verifyToken,
    verifyAccessToStream
};
