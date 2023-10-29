const mongoose = require('mongoose');
const { Schema } = require('mongoose');
const laneSchema = new mongoose.Schema({
  name: { type: String },
  description: { type: String },
  status: { type: Number },
  wareHouseId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  companyId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Lane = mongoose.model('Lane', laneSchema);

module.exports = Lane;