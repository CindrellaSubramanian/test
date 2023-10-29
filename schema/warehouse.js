const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const wareHouseSchema = new Schema({
  name: { type: String },
  contactPerson: { type: String },
  contactNumber: { type: String },
  address: { type: String },
  companyWebsite: { type: String },
  notes: { type: String },
  email: { type: String },
  country: { type: String },
  state: { type: String },
  city: { type: String },
  zipCode: { type: Number },
  about: { type: String },
  photoUrl: { type: String },
  contactPersonEmail: { type: String },
  contactPersonPhone: { type: String },
  skypeId: { type: String },
  notes: { type: String },
  gstNumber: { type: String },
  status: { type: Number, default: 1 },//1->free,2->occupied
  documents: {
    type: Array,
    default: [],
  },
  companyInfo: { type: Object },
  createdBy: { type: Object },
  createdAt: { type: Date },
  updatedAt: { type: Date },
});

const wareHouse = mongoose.model('warehouse', wareHouseSchema);

module.exports = wareHouse;