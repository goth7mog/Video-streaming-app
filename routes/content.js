const router = require("express").Router();
const { Create, CreateWithID, Read, Update, Delete, Expire, GetAll, Search} = require(global.approute + '/collections/Content.js');
const Helper = require(global.approute + '/helpers/helpFunctions.js'); // Add class Helper
const { verifyToken } = require(global.approute + '/middleware/verifyToken');
const _KEYS = require(global.approute + '/config/keys');


// SHOW ALL VIDEOS
router.get("/", async (req, res) => {

    try {
        const videos = await Content.find().sort({ createdAt: -1 });
        res.render("content", {
            "videos": videos,
            "url": req.url
        });
    } catch (err) {
        res.status(500).json(err);
    }

});


// SHOW PAGE WITH SPECIFIC VIDEO
router.get('/watch', verifyToken, async (req, res) => {
    const videoID = req.query.v || null;


    try {

        // Process and delete the payment cookie right away after the payment
        const { paymentResult } = req.cookies;
        res.clearCookie('paymentResult');

        if (videoID !== null) {
            const video = await Read(videoID);

            if (video !== null && video.deleted !== true) {
                res.locals.DATA_TO_RENDER.stripePublishableKey = _KEYS.stripePublishableKey;
                res.locals.DATA_TO_RENDER.video = video;

                // Add popup
                if (paymentResult) {
                    res.locals.DATA_TO_RENDER.messages.push({
                        type: "payment",
                        subject: paymentResult
                    });
                }

                res.status(200);
                res.render('video-page', res.locals.DATA_TO_RENDER);
            } else {
                res.status(404);
                res.render('not-available');
            }

        } else {
            res.redirect("/content");
        }

    } catch (e) {
        console.log(e);
    }


});

module.exports = router;