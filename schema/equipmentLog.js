const mongoose = require('mongoose');
const { Schema } = require('mongoose');


const EquipmentLogSchema = new mongoose.Schema({
  userId: { type: Schema.Types.ObjectId },
  taskId: { type: Schema.Types.ObjectId },
  packageId: { type: Schema.Types.ObjectId },
  equipmentId: {
    type: Schema.Types.ObjectId
  },
  status: { type: Number }, //0->free, 1->occupied
  // logs: {
  //   type: Array,
  //   default: []
  // },
  // wareHouseId: {
  //   type: Schema.Types.ObjectId,
  //   required: true
  // },
  // companyId: {
  //     type: Schema.Types.ObjectId,
  //     required: true
  // },
  createdAt: { type: Date, default: Date.now }
});

const EquipmentLog = mongoose.model('EquipmentLog', EquipmentLogSchema);

module.exports = EquipmentLog;