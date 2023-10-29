const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const taskSchema = new mongoose.Schema({
  userId: {
    type: Schema.Types.ObjectId,
  },
  userInfo: {
    type: Object,
    default: {}
  },
  bayInfo: {
    type: Object,
    default: {}
  },
  equipmentInfo: {
    type: Object,
    default: {}
  },
  type: {
    type: Number, //  "1": "Put away", "2": "Sort", "3": "Assemble", "4": "Relocate", "5": "Unload", "6": "QA", "7": "Repackage", "8": "Picker", "9": "Load", "10": "Pack" 
    // enum: [1, 2, 3, 4 , 5],
  },
  status: {
    type: Number,
    default: 1, // 1->yet to start , 2->ongoing, 3->completed
  },
  note: {
    type: String,
  },
  items: {
    type: Number,
  },
  date: {
    type: String,
  },
  time: {
    type: String,
  },
  packageDetails: {
    type: Array,
    default: [],
  },
  jobInfo: {
    type: Object,
    default: {}
  },
  locationInfo: {
    type: Object,
    default: {}
  },
  markAsComplete: {
    type: Boolean,
  },
  userInfo: {
    type: Object,
    default: null
  },
  locationData: {
    type: Object,
    default: {}
  },
  assignedBy: {
    type: Object,
  },
  assignedTo: {
    type: Object,
  },
  taskName: {
    type: String
  },
  vehicleNo: {
    type: String
  },
  containerNo: {
    type: String
  },
  newPackageDetail: {
    type: Array,
    default: []
  },
  shipmentTo: {
    type: Object,
    default: {}
  },
  wareHouseId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  companyId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  companyUserInfo: {
    type: Object,
    default: {}
  },
  loadStatus:{
    type:Number,
    default:0
  },
  cartStatus:{
    type:Number,
    default:0
  }
  // grnInfo: {
  //   type: Object,
  //   default: {}
  // },
});


const Task = mongoose.model("Task", taskSchema);

module.exports = Task;