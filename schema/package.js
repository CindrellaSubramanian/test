  const mongoose = require('mongoose');
  const { Schema } = require('mongoose');


  const rejectedSchema = new mongoose.Schema({
    count: {
      type: Number,
      // required: true
    },
    image: {
      type: String,
      // required: true
    }
  });

  const packageSchema = new mongoose.Schema({
    jobId: {
      type: Schema.Types.ObjectId,
      // required: true
    },
    consignmentId: {
      type: String,
      // required: true,
    },
    selectedBin: {
      type: Array
    },
    name: {
      type: String,
    },
    description: {
      type: String,
      default: "",
    },
    materialCode: {
      type: String,
    },
    unit: {
      type: String,
    },
    weight: {
      type: String,
    },
    length: {
      type: String,
    },
    breadth: {
      type: String,
    },
    dimension: {
      type: String,
    },
    unitKg: {
      type: String,
    },
    packageLength: {
      type: String,
    },
    packageBreadth: {
      type: String,
    },
    unitMm: {
      type: String,
    },
    status: {
      type: Number,
      default: 1 //1->putAway ,2->sort, 3->assemble ,4->relocate
    },
    approvedStatus: {
      type: Number,
    },
    quantity: {
      type: String,
    },
    expectedQuantity: {
      type: String,
    },
    approvedQuantity: {
      type: String,
      default: 0,
    },
    quantityText: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      //   default:1,  //( 1->Initiated ,2->putaway,3->sort,4->assemble,5->relocate,6->QA)
    },
    defectedQuantity: { type: String, default: 0 },
    taskInfo: {
      type: Object,
      default: {}
    },
    taskStatus: {
      type: String // 1->yet to start, 2->In process, 3->completed
    },
    cardId: {
      type: Object
    },
    qrCode: {
      type: String,
      default: ""
    },
    productCount: {
      type: Number,
      default: 0
    },
    approvedProductCount: {
      type: Number,
      default: 0
    },
    locationInfo:{
      type:Object,
      default:{}
    },
    expectedProductCount:{
      type:Number,
    },
    toBeOutbound:{
      type:Number,
    },
    currentProductCount:{
      type:Number,
    },
    cartStatus: {
      type: Number,
      default: 0, 
    },
    consumedProductCount:{
      type:Number,
    },
    alterPackageCount:{
      type:Number,
    },
    newPackageDetail:{
      type:Array
    },
    repackageStatus:{
      type:Number,
      default:0,
    },
    rejectedA: rejectedSchema,
    rejectedB: rejectedSchema,
    rejectedC: rejectedSchema, 
    jobInfo: {
      type: Object,
      default: {}
    },
    productCode:{
      type:String
    },
    wareHouseId: {
      type: Schema.Types.ObjectId,
      required: true
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
    category: {
      type: String,
      default: "A",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    }
  });
  const Package = mongoose.model('Package', packageSchema);

  module.exports = Package;