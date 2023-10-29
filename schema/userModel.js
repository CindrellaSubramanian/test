const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const userSchema = mongoose.Schema({
    firstName: { type: String },
    lastName: { type: String },
    fullName: { type: String }, // New field for combined firstName and lastName
    dateOfBirth: { type: String },
    gender: { type: String },
    contactNumber: { type: String },
    address: { type: String },
    department: { type: Object },
    supervisor: { type: Object },
    startDate: { type: String },
    emergencyContact: { type: String },
    skills: { type: Array },
    qualification: { type: String },
    notes: { type: String },
    deviceToken: { type: String },
    emailAddress: {
        type: String,
        unique: true,
        min: [5, 'min length value 5'],
        max: [10, 'max length value 10']
    },
    countryCode: { type: String },
    mobile: { type: String },
    password: {
        type: String,
        min: [5, 'min length value 5'],
        max: [10, 'max length value 10'],
        default: "123456"
    },
    status: { type: Number, default: 0 }, // 0-> Free, 1-> Active, 2-> Busy
    loginStatus: { type: Number, default: 0 }, // 0->Inactive, 1->active
    role: { type: Object }, // 1=> Manager, 2=> Warehouse Supervisor, 3=> Inbound Supervisor, 4=> Outbound Supervisor, 5=> Quality Inspector, 6=> Forklit Operator, 7=> Picker, 8=> Put away
    equipmentInfo: { type: Array, default: [] },
    palletType: {
        type: Number, // 1->putaway, 2->sort, 3->assemble
        default: 1,
        enum: [1, 2, 3],
    },
    equipmentType: {
        type: Array
    },
    photoURL: {
        type: String,
        default: ''
    },
    documents: {
        type: Array,
        default: [],
    },
    accessableEquipment: {
        type: Array,
        default: [],
    },
    // assignedTo: {
    //     type: Object,
    //     default: []
    // },
    bayInfo: {
        type: Array,
        default: []
    },
    wareHouseId: {
        type: Schema.Types.ObjectId,
        // required: true
    },
    wareHouseName:{
        type:String,
        default:""
    },
    companyId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    companyInfo: {
        type: Object,
        default: {}
    },
    companyUserInfo: {
        type: Object,
        default: {}
    },
    type: {
        type: Number, //  1-> SuperAdmin, 2-> Company User, 3-> Warehouse
        default: 3
    },
    gateInfo: {
        type: Object,
        default: {}
    },
    licenseInfo:{
        type:Object,
        default: {}
    },
    uniqueId:{ type:String, unique:true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const userModel = mongoose.model('users', userSchema);

module.exports = userModel;