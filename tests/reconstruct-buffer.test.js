const assert = require('assert');

function reconstructFromNumericObject(o) {
    const keys = Object.keys(o).filter(k => !isNaN(k)).sort((a, b) => parseInt(a) - parseInt(b));
    if (keys.length === 0) return null;
    const bytes = keys.map(k => o[k]);
    return Buffer.from(bytes);
}

function reconstructFromSerializedBuffer(obj) {
    if (obj && Array.isArray(obj.data)) return Buffer.from(obj.data);
    return null;
}

function reconstructFromBsonLike(obj) {
    if (obj && obj.buffer && Array.isArray(obj.buffer.data)) return Buffer.from(obj.buffer.data);
    return null;
}

// Test cases
(function runTests() {
    console.log('Running reconstruct-buffer tests...');

    // numeric object
    const bytesA = [165, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const numericObj = bytesA.reduce((acc, b, i) => { acc[String(i)] = b; return acc; }, {});
    const bufA = reconstructFromNumericObject(numericObj);
    assert.ok(Buffer.isBuffer(bufA), 'numeric object -> Buffer expected');
    assert.strictEqual(bufA.length, bytesA.length);
    assert.deepStrictEqual(Array.from(bufA), bytesA);

    // serialized Buffer { type: 'Buffer', data: [...] }
    const bytesB = [1, 2, 3, 255, 0];
    const serialized = { type: 'Buffer', data: bytesB };
    const bufB = reconstructFromSerializedBuffer(serialized);
    assert.ok(Buffer.isBuffer(bufB), 'serialized Buffer -> Buffer expected');
    assert.deepStrictEqual(Array.from(bufB), bytesB);

    // BSON-like Binary object
    const bytesC = [10, 20, 30, 40, 50];
    const bsonLike = { buffer: { data: bytesC } };
    const bufC = reconstructFromBsonLike(bsonLike);
    assert.ok(Buffer.isBuffer(bufC), 'BSON-like -> Buffer expected');
    assert.deepStrictEqual(Array.from(bufC), bytesC);

    console.log('All reconstruct-buffer tests passed.');
})();
