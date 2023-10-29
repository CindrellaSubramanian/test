const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const palletSchema = new Schema({
  id: {type: mongoose.Schema.Types.ObjectId},
  jobId: {type: mongoose.Schema.Types.ObjectId},
  consignmentId: {type: String},
  packageId: {type: String},
  zone: {type: String},
  zoneType: {type: String},
  unit: {type: String},
  kg: {type: String},
  strategy: {type: String},
  status: {type: Number},
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Pallet = mongoose.model('Pallet', palletSchema);

module.exports = Pallet;
