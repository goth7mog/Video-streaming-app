const router = require("express").Router();

// INDEX ROUTE
router.get('/', (req, res) => {
    res.redirect("/content");
});

module.exports = router;