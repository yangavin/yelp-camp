const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Writable, Readable } = require('node:stream');
const express = require('express');
const multer = require('multer');
const CloudinaryStorage = require('../cloudinary/storage');
const { campgroundSchema, reviewSchema } = require('../validationSchemas');

test('validation still accepts campground input and rejects HTML and invalid prices', () => {
    const campground = { title: 'Camp', location: 'Kingston', price: '10', description: 'Quiet' };
    assert.equal(campgroundSchema.validate({ campground }).error, undefined);
    assert.ok(campgroundSchema.validate({ campground: { ...campground, title: '<script>x</script>' } }).error);
    assert.ok(campgroundSchema.validate({ campground: { ...campground, price: -1 } }).error);
    assert.equal(reviewSchema.validate({ review: { body: 'Nice', score: 5 } }).error, undefined);
    assert.ok(reviewSchema.validate({ review: { body: '<img src=x onerror=alert(1)>', score: 5 } }).error);
});

test('Multer uploads preserve controller fields and remove stored files after multipart errors', async (t) => {
    const removed = [];
    const storage = new CloudinaryStorage({ uploader: {
        upload_stream(options, callback) {
            assert.deepEqual(options.allowed_formats, ['jpeg', 'jpg', 'png']);
            assert.equal(options.folder, 'YelpCamp');
            let size = 0;
            return new Writable({
                write(chunk, encoding, done) { size += chunk.length; done(); },
                final(done) {
                    callback(null, { secure_url: 'https://example.test/image.png', public_id: 'YelpCamp/test', bytes: size });
                    done();
                }
            });
        },
        destroy(id, options, callback) { removed.push(id); callback(null, { result: 'ok' }); }
    } });
    const app = express();
    app.post('/upload', multer({ storage }).array('image'), (req, res) => res.json(req.files));
    app.use((error, req, res, next) => res.status(400).json({ error: error.code }));
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    t.after(() => new Promise(resolve => server.close(resolve)));
    const url = `http://127.0.0.1:${server.address().port}/upload`;
    const data = new FormData();
    data.append('image', new Blob(['test-image']), 'test.png');
    const response = await fetch(url, { method: 'POST', body: data });
    assert.equal(response.status, 200);
    const [file] = await response.json();
    assert.equal(file.path, 'https://example.test/image.png');
    assert.equal(file.filename, 'YelpCamp/test');
    assert.equal(file.size, 10);

    const invalid = new FormData();
    invalid.append('image', new Blob(['valid']), 'test.png');
    invalid.append('unexpected', new Blob(['invalid']), 'test.png');
    const failed = await fetch(url, { method: 'POST', body: invalid });
    assert.equal(failed.status, 400);
    assert.equal((await failed.json()).error, 'LIMIT_UNEXPECTED_FILE');
    assert.deepEqual(removed, ['YelpCamp/test']);
});

test('upload errors reach Multer exactly once', async () => {
    const error = new Error('upload failed');
    let calls = 0;
    const storage = new CloudinaryStorage({ uploader: {
        upload_stream(options, callback) {
            return new Writable({ write(chunk, encoding, done) { callback(error); done(error); } });
        }
    } });
    await new Promise(resolve => storage._handleFile({}, { stream: Readable.from(['image']) }, actual => {
        calls++;
        assert.equal(actual, error);
        setImmediate(resolve);
    }));
    assert.equal(calls, 1);
});

test('an interrupted input stream fails the upload and closes the destination', async () => {
    const error = new Error('client disconnected');
    const destination = new Writable({ write(chunk, encoding, done) { done(); } });
    const storage = new CloudinaryStorage({ uploader: { upload_stream() { return destination; } } });
    const source = new Readable({ read() { this.destroy(error); } });
    await new Promise(resolve => storage._handleFile({}, { stream: source }, actual => {
        assert.equal(actual, error);
        resolve();
    }));
    assert.equal(destination.destroyed, true);
});

test('password hashing and authentication remain compatible with the updated model dependencies', async () => {
    const User = require('../models/user');
    const user = new User({ username: 'test-user', email: 'test@example.test' });
    await user.setPassword('test-only-password');
    assert.ok((await user.authenticate('test-only-password')).user);
    assert.equal((await user.authenticate('wrong-password')).user, false);
});
