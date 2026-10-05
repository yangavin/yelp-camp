const { test } = require('node:test');
const assert = require('node:assert/strict');
const { promisify } = require('node:util');
const { randomUUID } = require('node:crypto');
const MongoStore = require('connect-mongo');

test('encrypted sessions survive a MongoDB save/load round trip', {
    skip: !process.env.TEST_MONGO_URL
}, async () => {
    const store = MongoStore.create({
        mongoUrl: process.env.TEST_MONGO_URL,
        collectionName: 'session_regression_tests',
        crypto: { secret: 'Test-only-Session-Secret-2026!' }
    });
    const id = randomUUID();
    try {
        await promisify(store.set).call(store, id, {
            cookie: { maxAge: 60000 }, passport: { user: 'test-user' }
        });
        const restored = await promisify(store.get).call(store, id);
        assert.equal(restored.passport.user, 'test-user');
    } finally {
        await promisify(store.destroy).call(store, id);
        await store.close();
    }
});
