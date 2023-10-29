const mongoose = require('mongoose');
const { Schema } = require('mongoose');

// const logSchema = new mongoose.Schema({
//   bayId: {
//     type: String,
//     required: false
//   },
//   description: {
//     type: String,
//   },
//   status: {
//     type: Number, 
//   //1->inboundCreated ,2->skudetailCreated 3->skudetailUpdated 4->skudetaildeleted,5->bayAssign,6->gateAssign,7->inboundUpdated,-1->gateSecurityRejected,8->InformationUpdate ,9>DocumentVerified 10->bayAllocated,11->otlVerified,-2->RejectOTL,12->unloadTaskAssign,13->unloadTaskInprogress,14->unloadTaskCompleted,15->packageDetailCreated,16->putAwayTaskAssign,17->putAwayTaskInprogress,18->putAwayTaskCompleted,19->sortTaskAssign,20->sortTaskInprogress,21->sortTaskCompleted,22->assembleTaskAssign,23->assembleTaskInprogress,24->assembleTaskCOmpleted,25->relocateTaskAssign,26->relocateTaskInprogress,27->relocateTAskCompleted,-1->reject from securityVerification,-2->reject from otlVerification 
// },
//   createdBy: {
//     type: String,
//     required: false
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   }
// });

// const taskSchema = new mongoose.Schema({
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     required: true
//   },
//   bayId: {
//     type: mongoose.Schema.Types.ObjectId,
//     // required: true
//   },
//   type: {
//     type: Number, // 1->Sort, 2->Assemble
//     required: true,
//     enum: [1, 2],
//   },
//   status: {
//     type: Number,
//     default: 1, // 1->Assigned, 2->InProgress, 3->Completed
//   },
//   note: {
//     type: String,
//   },
//   items: {
//     type: Number,
//   },
//   date: {
//     type: String,
//   },
//   time: {
//     type: String,
//   },
//   packageDetail: {
//     type: Array,
//     default: []
//   }
// });

const clientDetailSchema = new mongoose.Schema({
  _id: {
    type: Schema.Types.ObjectId,
    ref: 'Client',

  },
  name: {
    type: String,
    // required: true
  },
  email: {
    type: String,
    // required: true
  },
  mobile: {
    type: String,
    // required: true
  },
  address: {
    type: String,
    // required: true
  },
  country: {
    type: String,
    // required: true
  },
  countryCode: {
    type: String,

  },
  state: {
    type: String,
    // required: true
  },
  city: {
    type: String,
    // required: true
  },
  zipcode: {
    type: String,
    // required: true
  },
  contactNumber: {
    type: String,
    // required: true
  }
});

const gateSchema = new mongoose.Schema({
  _id: {
    type: Schema.Types.ObjectId,
    ref: 'Gate',
  },
  name: {
    type: String,
  },
  type: {
    type: Number
  }
});


const jobSchema = new mongoose.Schema({
  gateInfo: {
    type: gateSchema,
    ref: 'Gate',
    default:{}
  },
  bayInfo: {
    type: Object,//Schema.Types.ObjectId
    default: {}
  },
  consignmentId: {
    type: String,
    required: true,
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,//Schema.Types.ObjectId
    ref: 'Client',
    required: true,
  },
  clientDetail: {
    type: clientDetailSchema,
    ref: 'Client',
  },

  vehicleDetail: {
    vehicleType:{type:String},
    vehicleNo: { type: String },
    vehicleRcNo: { type: String },
    licenseNo: { type: String },
    ewayBill: { type: String },
    containerNo: { type: String },
    estimatedTimeOfArrival: {
      type: String
    },
    vehicleRc: { type: Boolean, required: false },
    vehicleInsurance: { type: Boolean, required: false },
    driverLicense: { type: Boolean, required: false },
    vehicleRcImage: {
      type: String
    },
    vehicleInsuranceImage: {
      type: String,
      // required: false
    },

    driverLicenseImage: {
      type: String,
      // required: false
    },
    uploadPictureImage: {
      type: String,
      // required: false
    }
  },
  invoiceNo: {
    type: String
  },
  purchaseOrderNo: {
    type: String
  },
  shipmentDetail: {
    from: { type: String },
    to: { type: String },
    titleNumber: { type: String },
    description: { type: String },
    inboundShipmentType: {
      type: String
    },
    unloadShipmentType: {
      type: String,
    }
  },
  skuDetails: [
    {
      materialCode: {
        type: String
      },
      title: {
        type: String
      },
      information: {
        type: String
      },
      plantCode: {
        type: String
      },
      rackType: {
        type: String
      },
      expectedQuantity:{
        type: Number
      },
      uom: {
        type: String
      },
      // packageDetails:{
      //   type: Array,
      //   default: []
      // }
      toBeOutbound:{
        type:String
      },
      leftInShelf:{
        type: Number
      },
      selectedBin:{
        type:Array
      },
      approvedProductCount:{
        type:Number
      },
      approvedQuantity:{
        type:Number
      },
      consignmentId:{
        type:String
      },cartStatus:{
        type:Number,
      default:0
      }
    }
  ],
  default: [],

  status: {
    type: Number,
    //1->inboundCreated,2->documentVerified,3->bayAllocated,4->inboundInProgress,
    default: 1
  },
  statusInfo: {
    type: Object, //1->inboundCreated,2->bayAssign,3->documentVerified,4->bayAllocated,5->inboundInProgress,-1->documentReject
    default: {}
  },

  appointmentStatus: {
    type: Number,  // 1 -> upcoming 2 -> ongoing  3-> completed
    default: 1
  },
  specialRequest: {
    type: String,
    default: 'No special request'
  },
  specifyDetails: {
    type: String,
    default: 'No special request'
  },
  incoterms: {
    type: String,
    default: 'None'
  },
  vehicleDocVerified: {
    type: Boolean,
    default: false
  },
  ftlVerification: {
    type: Object,
    default: {}
  },
  currentTask: {
    type: Object,
    default: {}
  },
  unload: {
    type: Object,
    default: {}
  },
  subtask: {
    type: Array,
    required: true,
    default: []
  },
  pallet: {
    type: [Object],
    default: []
  },
  binAllocate: {
    type: [Object],
    default: []
  },
  relocate: {
    type: Object,
    default: {}
  },
  logs: {
    type: Array,
    required: true,
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  bookingDate: {
    type: String,
    // default: '2023-06-01' // Static date value
  },
  bookingTime: {
    type: String,
    // default: '10:00' // Static time value
  },
  shipmentType: {
    type: String,//Number
  },
  comments: {
    type: String,
  },
  packageDetails: {
    type: Array,
    default: [],
  },
  consignmentDetail: {
    type: String,
    default: ""
  },
  documents:{
    type: Object,
    default:{}
  },
  grnInfo: {
    type: Object
  },
  challanInfo: {
    type: Object
  },
  packageInfo:{
    type:Object
  },
  description: {
    type: String,
    default: "pallet 1 for quality verification"
  },
  qrCode: {
    type: String,
    default: ""
  },
  locationId: {
    type: String,
    default: ""
  },
  unloadLocationInfo: {
  type: Object,
  default: {},
},
type:{
  type:String //1->inbound,2->outbound
},
companyUserInfo: {
  type: Object,
  default: {},
},

wareHouseId: {
  type: Schema.Types.ObjectId,
  required: true
},
companyId: {
  type: Schema.Types.ObjectId,
  required: true
},
shipmentTo: {
  type: Object,
  default: {},
  },
  packageList: {
    type: Array
  },
  jobId:{
    type:String,
    required: true,
  },
  loadStatus:{
    type:Number,
    default:0
  },
  gateStatus:{
    type:Number,
    default:0
  }
});

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;