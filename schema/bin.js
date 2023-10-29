const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const binSchema = new mongoose.Schema({
  rackGroupId: { type: mongoose.Schema.Types.ObjectId },
  rackGroupName: { type: String },
  name: { type: String },
  qr: { type: String },
  zoneId: { type: mongoose.Schema.Types.ObjectId },
  zoneName: { type: String },
  rackId: { type: mongoose.Schema.Types.ObjectId },
  rackName: { type: String },
  shelfId: { type: mongoose.Schema.Types.ObjectId },
  shelfName: { type: String },
  type: { type: String },
  fileName: { type: String },
  status: { type: Number, default: 1 },
  packageDetail: { type: [] },
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

const Bin = mongoose.model('Bins', binSchema);

module.exports = Bin;