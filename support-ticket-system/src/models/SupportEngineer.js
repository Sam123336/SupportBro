const mongoose = require('mongoose');

const supportEngineerSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    capacity: {
        type: Number,
        required: true,
        min: 1,
        default: 5
    },
    currentClients: {
        type: Number,
        default: 0
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    specializations: [{
        type: String,
        trim: true
    }]
}, { timestamps: true });

// Method to check if the engineer is available
supportEngineerSchema.methods.hasCapacity = function() {
    return this.currentClients < this.capacity && this.isAvailable;
};

// Method to assign a client
supportEngineerSchema.methods.assignClient = function() {
    if (this.hasCapacity()) {
        this.currentClients += 1;
        return this.save();
    }
    return null;
};

// Method to release a client
supportEngineerSchema.methods.releaseClient = function() {
    if (this.currentClients > 0) {
        this.currentClients -= 1;
        return this.save();
    }
    return null;
};

const SupportEngineer = mongoose.model('SupportEngineer', supportEngineerSchema);

module.exports = SupportEngineer;