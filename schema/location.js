const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: { type: String },
  description: { type: String, default: '' },
  groupId: { type: Number, default: 1 },//1 ->Inbound, 2->OutBound, 3->Temporary, 4->Picking, 5->Packing, 6->Sorting
  groupName: { type: String },
  packageDetails: { type: Array },
  qrCode: {
    type: String,
    default: ""
  },
  status: { type: Number }, //0->free,1->occupied
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

const Location = mongoose.model('Location', locationSchema);

module.exports = Location;