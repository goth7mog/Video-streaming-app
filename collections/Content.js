const { Entity, Schema } = require('redis-om');

const COLLECTION_NAME = 'content';

// Create the entity
class content extends Entity { };


// Create a schema for the entity
const contentSchema = new Schema(content, {
    title: { type: 'string' },
    // watch: { type: 'number', sortable: true },
    description: { type: 'text', sortable: true },
    thumbnail: { type: 'string' },
    categories: { type: 'string[]' },
    tags: { type: 'string[]' },
    filePath: { type: 'string' },
    price: { type: 'number', sortable: true },
    views: { type: 'number', sortable: true },

    // Standard Auditing Fields	
    createdUserId: { type: 'string' },
    createdDateTime: { type: 'date', sortable: true },
    modifiedUserId: { type: 'string' },
    modifiedDateTime: { type: 'date', sortable: true },
    deletedUserId: { type: 'string' },
    deletedDateTime: { type: 'date', sortable: true },
    deleted: { type: 'boolean' },
});

const contentRepository = async () => {
    try {

        // Create a Repository
        const repository = await global.client.fetchRepository(contentSchema);

        // Create an index
        await repository.createIndex();

        return repository;
    } catch (err) {
        console.log(err);
    }
}



// --------------------------------------------CRUD API------------------------------------------------//
// Create
const Create = (req_body) => {
    return new Promise((resolve, reject) => {
        (async () => {
            const repository = await contentRepository();
            const result = await repository.createAndSave(req_body);
            resolve(result);
        })().catch(error => {
            reject(error);
        })
    })
}

// Create with ID
const CreateWithID = (req_body) => {
    return new Promise((resolve, reject) => {
        (async () => {
            const repository = await contentRepository();
            const item = await repository.fetch(req_body.id);
            // Comparing entity with received object and changing the first one
            for (let key in req_body) {
                if (key in item) {
                    item[key] = req_body[key] ?? null;
                }
            }
            const result = await repository.save(item);
            resolve(result);
        })().catch(error => {
            reject(error);
        })
    })
}

// Read
const Read = (id) => {
    return new Promise((resolve, reject) => {
        (async () => {

            const exists = await global.client.execute(['EXISTS', `${COLLECTION_NAME}:${id}`]); // 0
            if (exists === 1) {
                const repository = await contentRepository();
                const result = await repository.fetch(id);
                resolve(result);
            } else {
                resolve(null);
            }
        })().catch(error => {
            reject(error);
        })
    })
}

// Update
const Update = (id, req_body) => {
    return new Promise((resolve, reject) => {
        (async () => {
            const exists = await global.client.execute(['EXISTS', `${COLLECTION_NAME}:${id}`]); // 0

            if (exists === 1) {
                const repository = await contentRepository();
                const item = await repository.fetch(id);

                // Comparing entity with received object and changing the first one
                for (let key in req_body) {
                    if (key in item) {
                        item[key] = req_body[key] ?? null;
                    }
                }

                await repository.save(item);
                resolve(item);
            } else {
                resolve(null);
            }

        })().catch(error => {
            console.log(error);
            reject(error);
        })
    })
}

// Delete
const Delete = (id) => {
    return new Promise((resolve, reject) => {
        (async () => {

            const exists = await global.client.execute(['EXISTS', `${COLLECTION_NAME}:${id}`]); // 0

            if (exists === 1) {
                const repository = await contentRepository();
                await repository.remove(id);
                resolve(id);
            } else {
                resolve(null);
            }
        })().catch(error => {
            reject(error);
        })
    })
}


// --------------------------------------------SEARCH API------------------------------------------------//
// GetAll
const GetAll = (offset = null, count = null, sortBy = null, sortOrder = null) => {
    return new Promise((resolve, reject) => {
        (async () => {
            const repository = await contentRepository();
            const resultsTotal = await repository.search().return.count(); // Get the total of results

            let results;
            if (offset !== null && count !== null) {

                if (sortBy !== null && sortOrder !== null) {
                    results = await repository.search().sortBy(sortBy, sortOrder).return.page(offset, count);
                } else {
                    results = await repository.search().return.page(offset, count);
                }
                resolve({
                    "total": Number(resultsTotal),
                    "offset": Number(offset),
                    "count": Number(count),
                    "documents": results
                });

            } else {

                if (sortBy !== null && sortOrder !== null) {
                    results = await repository.search().sortBy(sortBy, sortOrder).return.all();
                } else {
                    results = await repository.search().return.all();
                }
                resolve({
                    "total": Number(resultsTotal),
                    "documents": results
                });

            }
        })().catch(error => {
            console.log(error);
            reject(error);
        })
    })
}

// Search
const Search = (query = null, offset = null, count = null, sortBy = null, sortOrder = null) => {
    console.log('Search - query', query);


    return new Promise((resolve, reject) => {
        (async () => {

            if (query === null) {
                return resolve(null);
            }

            const repository = await contentRepository();
            const resultsTotal = await repository.searchRaw(query).return.count(); // Get the total of results

            let results;
            if (offset !== null && count !== null) {

                if (sortBy !== null && sortOrder !== null) {
                    results = await repository.searchRaw(query).sortBy(sortBy, sortOrder).return.page(offset, count);
                } else {
                    results = await repository.searchRaw(query).return.page(offset, count);
                }
                resolve({
                    "total": Number(resultsTotal),
                    "offset": Number(offset),
                    "count": Number(count),
                    "documents": results
                });

            } else {

                if (sortBy !== null && sortOrder !== null) {
                    results = await repository.searchRaw(query).sortBy(sortBy, sortOrder).return.all();
                } else {
                    results = await repository.searchRaw(query).return.all();
                }
                resolve({
                    total: Number(resultsTotal),
                    documents: results,
                });

            }

        })().catch(error => {
            reject(error)
        })
    })
}


// --------------------------------------------OTHER------------------------------------------------//
// Expire content
const Expire = (id, seconds) => {
    return new Promise((resolve, reject) => {

        (async () => {
            if (seconds === null) {
                return resolve(false);
            }

            const exists = await global.client.execute(['EXISTS', `${COLLECTION_NAME}:${id}`]); // 0
            if (exists === 1) {
                await global.client.execute(["EXPIRE", `${COLLECTION_NAME}:${id}`, seconds]); // 0
                resolve(id);
            } else {
                resolve(null);
            }

        })().catch((error) => {
            console.log(error);
            reject(error);
        });

    });
};

// Just count all
const CountAll = () => {
    return new Promise((resolve, reject) => {
        (async () => {
            const repository = await contentRepository();
            const resultsTotal = await repository.search().return.count(); // Get the total of results
            resolve(resultsTotal);

        })().catch(error => {
            console.log(error);
            reject(error);
        })
    })
};




module.exports = {
    contentRepository,
    contentSchema,
    CountAll,
    Create,
    CreateWithID,
    Read,
    Update,
    Delete,
    Expire,
    GetAll,
    Search,
};