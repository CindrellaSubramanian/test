const mongoose = require('mongoose');
const { Schema } = mongoose;

const uomSchema = new Schema({
  length: { type: String },
  mass: { type: String },
  volume: { type: String },
  time: { type: String},  
  temperature: { type: String},
  area: { type:String},
});

const Uom = mongoose.model('Uom', uomSchema);
module.exports = Uom;
