const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  type: { type: Object },
  name: { type: String },
  // uniqueId: { type: String },
  manufacturer: { type: String },
  serialNumber: { type: String, default: "" },
  purchaseDate: { type: Date },
  purchasePrice: { type: String, default: "" },
  condition: { type: String },
  parkingArea: { type: Object }, //bay
  model: { type: String },
  lastMaintenanceDate: { type: Date, default: Date.now },
  serviceDueDate: { type: Date, default: Date.now },
  maintenanceHistory: { type: String, default: "" },
  usageHistory: { type: String },
  serviceRecords: { type: String },
  insurance: { type: String },
  handler: { type: Array }, // user
  warrantyInformation: { type: String },
  notes: { type: String },
  status: { type: Number, default: 0 }, // 0->free, 1->occupied
  documents: { type: Array, default: [] },
  serviceInterval: { type: String },
  assignTo: { type: Object, default: {} },
  wareHouseId: {
    type: Schema.Types.ObjectId,
    // required: true
  },
  companyId: {
      type: Schema.Types.ObjectId,
      required: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  userInfo:{
    type: Object,
    default: {}
  },
  locationInfo:{
    type: Object,
    default: {}
  },
  cartId:{
    type: String
  },
  userId:{
    type: String
  },
  qrCode: {
    type: String,
    default: ""
  },
  assetNumber:{
    type:String,
    default: ""
  }
});

const Equipment = mongoose.model('Equipment', equipmentSchema);

module.exports = Equipment;