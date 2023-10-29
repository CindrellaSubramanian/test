const mongoose = require('mongoose');
const { Schema } = mongoose;

const gateSchema = new Schema({
  name: { type: String, required: true },
  type: { type: Number, required: true },//1->gateIn,2->gateOut
  description: { type: String, default: '' },
  division: { type: String, default: '' },
  wareHouseId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  companyId: {
      type: Schema.Types.ObjectId,
      required: true
  },
  status: { type: Number},  //1->close,2->open
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Gate = mongoose.model('Gate', gateSchema);
module.exports = Gate;