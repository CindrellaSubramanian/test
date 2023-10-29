const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const rackGroupSchema = new mongoose.Schema({
  name: { type: String },
  shelfCount: { type: Number },
  binInEachShelf: { type: Number },
  type: { type: String },
  binHeight: { type: String },
  binWidth: { type: String },
  category: { type: String },
  ranking: { type: String },
  description:{type:String,default:''},
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

const RackGroup = mongoose.model('RackGroup', rackGroupSchema);

module.exports = RackGroup;