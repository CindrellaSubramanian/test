const mongoose = require('mongoose');
const { Schema } = mongoose;

const baySchema = new Schema({
  name: { type: String },
  groupId: { type: Number },//1->inbound bay 2->outboundbay
  description: { type: String },
  status: { type: Number, default: 1 },  //1->Available,2->Occupied
  wareHouseId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  companyId: {
      type: Schema.Types.ObjectId,
      required: true
  },
  qrCode: {
    type: String,
    default: ""
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Bays = mongoose.model('Bays', baySchema);
module.exports = Bays;
