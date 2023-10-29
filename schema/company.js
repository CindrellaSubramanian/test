const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const companySchema = new Schema({
  name: { type: String },
  contactNumber: { type: String },
  address: { type: String },
  website: { type: String },
  notes: { type: String },
  email: { type: String ,unique: true,required:true},
  country: { type: String },
  state: { type: String },
  city: { type: String },
  zipCode: { type: Number },
  photoUrl: { type: String },
  skypeId: { type: String },
  notes: { type: String },
  gstNumber: { type: String },
  status: { type: Number, default: 1 },
  createdAt: { type: Date },
  updatedAt: { type: Date },
});

const company = mongoose.model('company', companySchema);

module.exports = company;