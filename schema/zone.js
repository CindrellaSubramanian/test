const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const zoneSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    wareHouseId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    companyId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    // aisleIds: [{
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Aisle'
    // }],
    manager: {
        type: String
    },
    capacity: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'under maintenance'],
        default: 'active'
    },
    description: {
        type: String
    }
});

const Zone = mongoose.model('Zone', zoneSchema);

module.exports = Zone;
