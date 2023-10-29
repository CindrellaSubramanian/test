const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const shelfSchema = new mongoose.Schema({
  rackGroupId: { type: mongoose.Schema.Types.ObjectId },
  rackGroupName: { type: String },
  name: { type: String },
  zoneId: { type: mongoose.Schema.Types.ObjectId },
  zoneName: { type: String },
  rackId: { type: mongoose.Schema.Types.ObjectId },
  rackName: { type: String },
  type: { type: String },
  status: { type: Number, default: 1 },
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
  updatedAt: { type: Date, default: Date.now },
});

var collectionName = 'shelf';
const Shelf = mongoose.model('shelf', shelfSchema, collectionName);
module.exports = Shelf;