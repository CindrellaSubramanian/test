const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const clientSchema = new Schema({
  name: { type: String },
  contactPerson: { type: String },
  contactNumber: { type: String },
  address: { type: String },
  billingAddress: { type: Object },
  shippingAddress: { type: Object },
  companyWebsite: { type: String },
  industry: { type: String },
  paymentTerms: { type: Object },
  notes: { type: String },
  email: { type: String },
  countryCode: { type: String },
  country: { type: String },
  state: { type: String },
  city: { type: String },
  zipCode: { type: Number },
  about: { type: String },
  photoUrl: { type: String },
  contactPersonEmail: { type: String },
  contactPersonCountryCode: { type: String },
  contactPersonPhone: { type: String },
  gender: { type: String },
  skypeId: { type: String },
  position: { type: String },
  notes: { type: String },
  gstNumber: { type: String },
  panNumber: { type: String },
  status: { type: Number, default: 1 },//1->free,2->occupied
  document: {
    type: Array,
    default: [],
  },
  productMaster: {
    type: Array,
    default: [],
  },
  wareHouseId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  companyId: {
      type: Schema.Types.ObjectId,
      required: true
  },
  createdBy: { type: Schema.Types.ObjectId },
  createdAt: { type: Date },
  updatedAt: { type: Date },
  gstNo:{type:String},
});

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
