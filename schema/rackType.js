const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const rackSchema = new mongoose.Schema({
  name: { type: String },
  type: { type: Number },
  wareHouseId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  companyId: {
    type: Schema.Types.ObjectId,
    required: true
  }
});

const Rack = mongoose.model('racktype', rackSchema);
module.exports = Rack;
