const { pipeline } = require('node:stream');

// Multer's storage interface lets us use the supported Cloudinary SDK directly.
class CloudinaryStorage {
    constructor(cloudinary) {
        this.cloudinary = cloudinary;
    }

    _handleFile(req, file, callback) {
        let completed = false;
        const finish = (error, result) => {
            if (completed) return;
            completed = true;
            callback(error, result);
        };

        try {
            const upload = this.cloudinary.uploader.upload_stream({
                folder: 'YelpCamp',
                resource_type: 'image',
                allowed_formats: ['jpeg', 'jpg', 'png']
            }, (error, result) => {
                if (error) return finish(error);
                finish(null, {
                    path: result.secure_url,
                    filename: result.public_id,
                    size: result.bytes
                });
            });

            pipeline(file.stream, upload, (error) => {
                if (error) finish(error);
            });
        } catch (error) {
            file.stream.resume();
            finish(error);
        }
    }

    _removeFile(req, file, callback) {
        this.cloudinary.uploader.destroy(file.filename, { resource_type: 'image' }, callback);
    }
}

module.exports = CloudinaryStorage;
