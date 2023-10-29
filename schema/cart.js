const mongoose = require('mongoose');
const { Schema } = mongoose;

const cartSchema = new Schema({
  packageInfo: { type: Array, default: [] },
  userId: { type: String },
  equipmentLogData:{type:Object},
  /* jobId: { type: String },
  consignmentId: { type: String },
  taskId: { type: String },
  // equipmentLogData: { type: Schema.Types.ObjectId, ref: 'EquipmentLog', default: null },
   */
  
});

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
