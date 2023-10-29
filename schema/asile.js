const mongoose = require('mongoose');

const aisleSchema = new mongoose.Schema({
    aisleId: {
        type: String,
        unique: true,
        // required: true
    },
    aisleName: {
        type: String,
        // required: true
    },
    aisleLocation: {
        type: String,
        // required: true
    },
    aisleDimensions: {
        length: {
            type: Number,
            // required: true
        },
        width: {
            type: Number,
            // required: true
        },
        height: {
            type: Number,
            // required: true
        }
    },
    aisleCapacity: {
        type: Number,
        // required: true
    },
    aisleType: {
        type: String,
        // required: true
    },
    aisleStatus: {
        type: String,
        enum: ['open', 'closed', 'under maintenance'],
        default: 'open'
    },
    aisleAccessibility: {
        type: String
    },
    aisleEquipment: {
        type: String
    },
    aisleSafetyInformation: {
        type: String
    },
    zoneId:{
        type: mongoose.Schema.Types.ObjectId,
         ref: 'Zone'
      }
    
});

const Aisle = mongoose.model('Aisle', aisleSchema);

module.exports = Aisle;