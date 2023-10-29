const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const skillSchema = mongoose.Schema({
    name: { 
        type: String
    }
});

const skillModel = mongoose.model('skill', skillSchema);

module.exports = skillModel;