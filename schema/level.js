const mongoose = require('mongoose');

const levelSchema = new mongoose.Schema({
    levelId: {
        type: String,
        unique: true,
        required: true
    },
    rackId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rack',
        required: true
    },
    levelNumber: {
        type: Number,
        required: true
    },
    levelCapacity: {
        type: Number,
        required: true
    },
    levelStatus: {
        type: String,
        enum: ['available', 'occupied'],
        default: 'available'
    },
    levelItems: [{
        itemId: {
            // type: mongoose.Schema.Types.ObjectId,
            // ref: 'Item'
            type: String,
            
        },
        quantity: {
            type: Number,
            required: true
        }
    }],
    zoneId:{
        type: mongoose.Schema.Types.ObjectId,
         ref: 'Zone'
      }
});

const Level = mongoose.model('Level', levelSchema);

module.exports = Level;
