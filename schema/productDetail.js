const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const packageDetailSchema = new mongoose.Schema({
  type: {
    type: String
  },
  materialCode: {
    type: String
  },
  productCount: {
    type: String
  },
  weight: {
    type: String
  },
  height: {
    type: String
  },
  breadth: {
    type: String
  },
  unitLBH: {
    type: String
  },
  unitW: {
    type: String
  },
  length: {
    type: String
  },
  plantCode: {
    type: String
  },
  rackType: {
    type: String
  },
});

const productDetailSchema = new mongoose.Schema({
  materialCode: {
    type: String,
    unique: true,
  },
  title: {
    type: String
  },
  information: {
    type: String
  },
  dimension: {
    type: String,
    default: ''
  },
  // units: {
  //   type: Number
  // },
  uom: {
    type: String
  },
  height: {
    type: String
  },
  breadth: {
    type: String
  },
  weight: {
    type: String
  },
  unitLBH: {
    type: String
  },
  unitW: {
    type: String
  },
  length: {
    type: String
  },
  // expectedQuantity: {
  //   type: Number
  // },
  status: {
    type: Number, //0->InActive,1->Active
    default: 1,
  },
  packageDetails: {
    type: [packageDetailSchema],
    default: []
  },
  companyUserInfo: {
    type: Object,
    default: {},
  },
  wareHouseId: {
    type: Schema.Types.ObjectId,
    // required: true
  },
  companyId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  leftInShelf: {
    type: Number
  },
  qtyOutbound: {
    type: Number
  },
  plantCode: {
    type: String
  },
  type: {
    type: String
  },
  rackType: {
    type: String
  },
  productCode: {
    type: String
  }
});

const ProductDetail = mongoose.model('ProductMaster', productDetailSchema);

module.exports = ProductDetail;