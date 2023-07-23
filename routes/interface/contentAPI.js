const router = require("express").Router();
const { Create, CreateWithID, Read, Update, Delete, Expire, GetAll, Search} = require(global.approute + '/collections/Content.js');
const Helper = require(global.approute + '/helpers/helpFunctions.js'); // Add class Helper
const { verifyToken } = require(global.approute + '/middleware/verifyToken');


// CREATE
router.post('/', async (req, res) => {
    try {
        req.body.createdDateTime = req.body.createdDateTime || new Date();
        const entity = await Create(req.body);

        res.status(201).json({ data: entity, success: ["Entity created"], error: [] }); // Created - entity created 

    }
    catch (error) {
        res.status(500).json({ error: error.message }); // Internal Server Error
    }
});

// CREATE WITH ID
router.post('/createwithid/:id', async (req, res) => {
    const id = req.params.id;
    req.body.createdDateTime = req.body.createdDateTime || new Date();
    try {
        req.body.entityId = id;
        const entity = await CreateWithID(req.body);
        res.status(201).json({ data: entity, success: ["Entity created"], error: [] }); // Created - entity created 
    }
    catch (error) {
        res.status(500).json({ error: error.message }); // Internal Server Error
    }
});

// UPDATE
router.put('/:id', async (req, res) => {

    try {
        const entity = await Update(req.params.id, req.body);

        if (entity !== null) {
            res.status(200).json({ data: entity, success: ["Entity updated"], error: [] }); // Ok - Updated
        } else {
            res.status(404).json({ error: ["Can't find entity by this id"] }); // No Content - No entity found with that id
        }

    }
    catch (error) {
        res.status(500).json({ error: error.message }); // Internal Server Error
    }
});

// DELETE
router.put('/delete/:id', async (req, res) => {

    try {

        const req_body = {
            deletedDateTime: new Date(),
            deleted: true
        };

        const entity = await Update(req.params.id, req_body);

        if (entity !== null) {
            res.status(200).json({ data: entity, success: ["Entity is set to deleted:true"], error: [] }); // Ok - Updated
        } else {
            res.status(404).json({ error: ["Can't find entity by this id"] }); // No Content - No entity found with that id
        }

    }
    catch (error) {
        res.status(500).json({ error: error.message }); // Internal Server Error
    }
});

// DESTROY
router.delete('/:id', async (req, res) => {
    try {
        const result = await Delete(req.params.id);

        if (result !== null) {
            res.status(202).json({ entityID: result, success: ["Entity deleted permanently"], error: [] }); // Accepted - entity deleted  
        } else {
            res.status(404).json({ error: ["Can't find entity by this id"] }); // No Content - No entity found with that id
        }
    }
    catch (error) {
        res.status(500).json({ error: error.message }); // Internal Server Error
    }
});

// SET EXPIRATION
router.get('/expire/:id', async (req, res) => {
    const seconds = req.query.seconds || null;

    try {
        const result = await Expire(req.params.id, seconds);

        if (result === null) {
            res.status(404).json({ error: ["Can't find entity by this id"] }); // No Content - No entities found
        } else if (result === false) {
            res.status(400).json({ error: ["You didn't set seconds parameter"] });
        } else {
            res.status(200).json({ entityID: result, success: ["Expiration time is set"], error: [] });
        }
    }
    catch (error) {
        res.status(500).json({ error: error.message }); // Internal Server Error
    }
});

// GETALL
router.get('/search/all', async (req, res) => {

    const offset = req.query.offset || null;
    const count = req.query.count || null;
    const sortBy = req.query.sortby || null;
    const sortOrder = req.query.sortorder || null;

    try {
        const result = await GetAll(offset, count, sortBy, sortOrder);

        res.status(200).json({ data: result, success: ["Request completed"], error: [] });

    }
    catch (error) {
        res.status(500).json({ error: error.message }); // Internal Server Error
    }
});

// SEARCH
router.get('/search/for', async (req, res) => {
    // ---------------Search explained-------------//

    // For example. To find all the Mushroomhead albums with the word 'beautiful' in the title from 1990 and beyond
    // ?query=@artist:{Mushroomhead}%20@title:"beautiful"%20@year:[1990 +inf]
    // Where @artist is the key, {Mushroomhead} is the value. %20 - is URL encoding space

    // To search on string type fields - use {}. 
    // To search on text type fields - use "". 
    // Read more here https://redis.io/docs/stack/search/reference/query_syntax/

    const offset = req.query.offset || null;
    const count = req.query.count || null;
    const query = req.query.query || null;
    const sortBy = req.query.sortby || null;
    const sortOrder = req.query.sortorder || null;

    try {
        const result = await Search(query, offset, count, sortBy, sortOrder);

        if (result !== null) {
            res.status(200).json({ data: result, success: ["Request completed"], error: [] }); // Ok
        } else {
            res.status(404).json({ error: "Specify search parameters to find item" }); // No Content - No entities found
        }
    }
    catch (error) {
        res.status(500).json({ error: error.message }); // Internal Server Error
    }
});


// READ
router.get('/:id', async (req, res) => {
    try {
        const entity = await Read(req.params.id);

        if (entity !== null) {
            res.status(200).json({ data: entity, success: ["Entity found"], error: [] }); // Ok - Found
        } else {
            res.status(404).json({ error: ["Can't find entity by this id"] });
        }
    }
    catch (error) {
        res.status(500).json({ error: error.message }); // Internal Server Error
    }
});


module.exports = router;