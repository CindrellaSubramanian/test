const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const inventorySchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  levelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Level',
    required: true,
  },
  msku: {
    type: String,
    unique: true,
  },
  status: {
    type: Number,
    default: 0,
  },
  title: {
    type: String
  },
  units: {
    type: Number
  },
  location: {
    type: String
  },
  expectedQuantity: {
    type: Number
  },
  receivedQuantity: {
    type: Number
  },
  type: {
    type: Number//1->FIFO,2->LIFO
  }
});

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;