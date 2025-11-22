const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
    filename: String,
    path: String,
    size: Number,
    uploadDate: Date,
    userId: {
    	type: mongoose.Schema.Types.ObjectId,
    	ref: 'User',
    	required: true
    	}
});

module.exports = mongoose.model('File', FileSchema);
