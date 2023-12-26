const router = require("express").Router();
const { Create, CreateWithID, Read, Update, Delete, Expire, GetAll, Search} = require(global.approute + '/collections/Content.js');
const Helper = require(global.approute + '/helpers/helpFunctions.js'); // Add class Helper
const ErrorNotifier = require(global.approute + '/helpers/ErrorNotifier.js');
const keys = require(global.approute + '/config/keys');
const stripe = require('stripe')(keys.stripeSecretKey);
const { verifyToken } = require(global.approute + "/middleware/verifyToken");
const jwt = require("jsonwebtoken");

// CHARGE 
router.post('/', async (req, res) => {
    try {

        // const promise = new Promise((resolve, reject) => {
		// 	setTimeout(() => resolve("done!"), 100000)
		//   });
		
		// const result = await promise; // wait until the promise resolves (*)

        /* Finding information in the database about the video by its id.
        req.body.productId - data from the form */
        // throw new Error(`Couldn't find the content by id ${req.body.productId} or it's deleted`);

        const video = await Read(req.body.productId);

        if (video === null || video.deleted === true) {
            throw new Error(`Couldn't find the content by id ${req.body.productId} or it's deleted`);
        }

        // Create stripe payment
        const customer = await stripe.customers.create({
            email: req.body.stripeEmail,
            source: req.body.stripeToken
        });

        const charge = await stripe.charges.create({
            amount: video.price,
            description: video.title,
            metadata: {
                contentID: video.entityId
            },
            currency: 'usd',
            customer: customer.id
        });

        let accessToken;

        // If we already have a current access token
        if (req.accessToken && req.accessToken !== 'error') {

            // Embed access information in token
            accessToken = jwt.sign(
                {
                    purchaseIDs: req.accessToken.purchaseIDs.concat(charge.id),
                    access: req.accessToken.access.concat(video.entityId),
                    email: req.accessToken.email.concat(charge.billing_details.name)
                },
                process.env.JWT_SEC,
                { expiresIn: 10 * 12 * 30 * 24 * 60 * 60 * 1000 }
            );

            // And just delete old token
            res.clearCookie('accessToken');

        } else {
            // If the token is absent or not valid
            accessToken = jwt.sign(
                {
                    purchaseIDs: [charge.id],
                    access: [video.entityId],
                    email: [charge.billing_details.name]
                },
                process.env.JWT_SEC,
                { expiresIn: 10 * 12 * 30 * 24 * 60 * 60 * 1000 }
            );
        }

        // Ten years token and cookie
        res.cookie('accessToken', accessToken, { maxAge: 10 * 12 * 30 * 24 * 60 * 60 * 1000, httpOnly: true });
        // Cookie for the popup
        req.flash('paymentResult', "success-payment");
        res.redirect(`/content/watch?v=${video.entityId}`);

    } catch (err) {
        ErrorNotifier({
            msg: err.message,
            stack: err.stack,
            reqBody: req.body,
            customerEmail: req.body.stripeEmail
        });

        req.flash('paymentResult', "error-payment");
        res.redirect(`/content/watch?v=${req.body.productId}`);
    }


});

module.exports = router;