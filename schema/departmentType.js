const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const departmentTypeSchema = new mongoose.Schema({
  name: { type: String},
  description: { type: String },
  type: {
    type: Number,
  },
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

const DepartmentType = mongoose.model('DepartmentType', departmentTypeSchema);

module.exports = DepartmentType;