const fs = require('fs');
const keys = require(global.approute + '/config/keys');
const stripe = require('stripe')(keys.stripeSecretKey);
const jwt = require("jsonwebtoken");
const ObjectId = require("mongodb").ObjectId;



// CREATE STREAM
exports.createStream = async (req, res) => {

    try {
        // console.log(req.params.watch)
        const path = global.approute + `/assets/videos/${req.params.watch}`;
        const stat = fs.statSync(path);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1]
                ? parseInt(parts[1], 10)
                : fileSize - 1
            if (start >= fileSize) {
                res.status(416).send('Requested range not satisfiable\n' + start + ' >= ' + fileSize);
                return;
            }

            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(path, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4'
            };

            res.writeHead(206, head);
            file.pipe(res);

        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4'
            };
            res.writeHead(200, head);
            fs.createReadStream(path).pipe(res);
        }
    } catch (error) {
        // console.log(error);
        res.status(500).send(`Internal server error while creating a stream`);
    }

};



// CHARGE 
exports.chargeClient = async (req, res) => {
    try {

        /* Finding information in the database about the video by its id.
        req.body.productId - data from the form */
        // throw new Error(`Couldn't find the content by id ${req.body.productId} or it's deleted`);

        // const promise = new Promise((resolve, reject) => {
        // 	setTimeout(() => resolve("done!"), 100000)
        //   });

        // const result = await promise; // wait until the promise resolves (*)
        // res.redirect(`/`);
        // return;


        const currentTime = new Date().getTime();


        const Video = await global.database.collection("videos").findOne({
            "watch": parseInt(req.body.productId)
        });


        if (Video == null) {
            throw new Error(`Couldn't find the content by id ${req.body.productId}`);
        }

        // Create stripe payment
        const customer = await stripe.customers.create({
            email: req.body.stripeEmail,
            source: req.body.stripeToken
        });

        const charge = await stripe.charges.create({
            amount: Video.price,
            description: Video.title,
            metadata: {
                contentID: Video.watch
            },
            currency: process.env.CURRENCY,
            customer: customer.id
        });



        let ACCESS_TOKEN;

        // If we already have a current access token
        if (req.accessToken) {

            await global.database.collection("customers").updateOne({
                "_id": ObjectId(req.accessToken.customerId)
            }, {
                $addToSet: {
                    "purchaseIDs": charge.id,
                    "access": Video.watch,
                    "email": req.body.stripeEmail,
                }
            });

            // Embeding the access information into the token
            ACCESS_TOKEN = jwt.sign(
                {
                    access: req.accessToken.access.concat(Video.watch),
                    customerId: req.accessToken.customerId
                },
                process.env.JWT_SEC,
                { expiresIn: 10 * 12 * 30 * 24 * 60 * 60 * 1000 } // For ten years
            );

            await global.database.collection("tokens").updateOne({
                // "customer_id": ObjectId(req.accessToken.customerId)
                $and: [
                    { "customer_id": ObjectId(req.accessToken.customerId) },
                    { "token": req.cookies.accessToken }
                ]
            }, {
                $set: {
                    "token": ACCESS_TOKEN
                },
                $addToSet: {
                    "browser": req.headers['user-agent']
                }
            });

            // And just deleting the old one
            res.clearCookie('accessToken');

        } else {
            // If the token is absent or not valid
            const Customer = await global.database.collection("customers").insertOne({
                "purchaseIDs": [charge.id],
                "access": [Video.watch],
                "email": [req.body.stripeEmail],
                "thumbnail": null,
                "verification_token": null,
            });

            ACCESS_TOKEN = jwt.sign(
                {
                    access: [Video.watch],
                    customerId: Customer.insertedId
                },
                process.env.JWT_SEC,
                { expiresIn: 10 * 12 * 30 * 24 * 60 * 60 * 1000 }
            );

            const Token = await global.database.collection("tokens").insertOne({
                "customer_id": Customer.insertedId,
                "token": ACCESS_TOKEN,
                "browser": [req.headers['user-agent']],
                "createdAt": currentTime
            });

        }


        // Ten years token and cookie
        res.cookie('accessToken', ACCESS_TOKEN, {
            maxAge: 10 * 12 * 30 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            // domain: process.env.DOMAIN
        });
        // Cookie for the popup
        req.flash('paymentResult', "success-payment");
        res.redirect(`/videos/watch?v=${Video.watch}`);

    } catch (err) {
        // ErrorNotifier({
        //     msg: err.message,
        //     stack: err.stack,
        //     reqBody: req.body,
        //     customerEmail: req.body.stripeEmail
        // });

        // console.log(err);

        req.flash('paymentResult', "error-payment");
        res.redirect(`/videos/watch?v=${req.body.productId}`);
    }


};