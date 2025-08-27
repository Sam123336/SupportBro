const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    queuePosition: {
        type: Number,
        required: true,
        default: 0
    },
    assignedEngineer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SupportEngineer'
    },
    isInQueue: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;