const router = require("express").Router();
const Content = require("../models/Content");
const keys = require('../config/keys');
const { verifyToken } = require("../middleware/verifyToken");


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

    try {
        const video = await Content.findOne(
            {
                watch: req.query.v
            }
        );
        req.dataToRender.stripePublishableKey = keys.stripePublishableKey;
        req.dataToRender.video = video;

        // Process and delete payment cookie right away after payment
        const { paymentResult } = req.cookies;
        res.clearCookie('paymentResult');

        // Add popup
        if (paymentResult) {
            req.dataToRender.messages.push({
                type: "payment",
                subject: paymentResult
            });
        }


        res.render('video-page', req.dataToRender);

    } catch (e) {
        console.log(e);
    }


});

module.exports = router;