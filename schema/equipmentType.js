const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const equipmentTypeSchema = new mongoose.Schema({
  name: { type: String},
  description: { type: String },
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
});

const EquipmentType = mongoose.model('EquipmentType', equipmentTypeSchema);

module.exports = EquipmentType;