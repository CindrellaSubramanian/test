const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const rackSchema = new mongoose.Schema({
  rackGroupId: { type: mongoose.Schema.Types.ObjectId },
  rackGroupName: { type: String },
  name: { type: String },
  zoneId: { type: mongoose.Schema.Types.ObjectId },
  zoneName: { type: String },
  type: { type: String },
  uom: { type: String },
  status: { type: Number },
  shelfInfo: { type: Array },
  occupiedPercentage: { type: Number, default: 0 },
  wareHouseId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  companyId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Rack = mongoose.model('Rack', rackSchema);

module.exports = Rack;
