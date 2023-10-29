const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const roleSchema = mongoose.Schema({
    name:{
        type: String
    },
    type:{
        type: Number
    }
});


const roleModel = mongoose.model('role', roleSchema);

module.exports = roleModel;