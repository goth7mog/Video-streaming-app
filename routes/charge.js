const router = require("express").Router();
const Content = require("../models/Content");
const keys = require('../config/keys');
const stripe = require('stripe')(keys.stripeSecretKey);
const { verifyToken } = require("../middleware/verifyToken");
const jwt = require("jsonwebtoken");

// CHARGE 
router.post('/', verifyToken, async (req, res) => {
    try {
        // Find information in the database about a video by its ID (key - watch)
        // req.body.productId - data from the form
        const video = await Content.findOne(
            {
                watch: +req.body.productId
            }
        );

        // Create stripe payment
        stripe.customers.create({
            email: req.body.stripeEmail,
            source: req.body.stripeToken
        })
            .then(customer => stripe.charges.create({
                amount: video.price,
                description: video.title,
                currency: 'usd',
                customer: customer.id
            }))
            .then(charge => {

                let accessToken;

                // If we already have a current access token
                if (req.accessToken && req.accessToken !== 'error') {

                    // Embed access information in token
                    accessToken = jwt.sign(
                        {
                            purchaseIDs: req.accessToken.purchaseIDs.concat(charge.id),
                            access: req.accessToken.access.concat(video.watch),
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
                            access: [video.watch],
                            email: [charge.billing_details.name]
                        },
                        process.env.JWT_SEC,
                        { expiresIn: 10 * 12 * 30 * 24 * 60 * 60 * 1000 }
                    );
                }

                // Ten years token and cookie
                res.cookie('accessToken', accessToken, { maxAge: 10 * 12 * 30 * 24 * 60 * 60 * 1000, httpOnly: true });
                // Cookie for popup
                res.cookie('paymentResult', "success-payment");
                res.redirect(`/content/watch?v=${video.watch}`);

            }).catch((err) => {

                res.cookie('paymentResult', "error-payment");
                res.redirect(`/content/watch?v=${video.watch}`);

            });
    } catch (err) {
        console.log(err);
    }


});

module.exports = router;