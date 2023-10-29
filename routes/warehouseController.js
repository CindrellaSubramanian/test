const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const commonFunction = require('../public/js/commonFunction');
const wareHouse = require('../schema/warehouse');
const companyModel = require('../schema/company');
const userModel = require('../schema/userModel');

router.post('/create', async (req, res) => {
  const reqQuery = req.query;
  try {
    const reqBody = req.body;
    const userInfo = await userModel.findOne({ _id: reqBody.userId }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1, companyInfo:1 });
    reqBody.createdBy = userInfo;
    reqBody.companyInfo = await companyModel.findOne({ _id: reqBody.companyId }, { _id: 1, name: 1, contactNumber: 1, email: 1 });
    // console.log("reqBody.companyInfo",reqBody.companyInfo);
    // console.log("reqBody",reqBody);
    const warehouse = new wareHouse(reqBody);
    // console.log("warehouse",warehouse);
    const newWareHouse = await warehouse.save();
    reqBody.fullName = reqBody.name;
    reqBody.firstName = reqBody.name;
    reqBody.lastName = reqBody.name;
    reqBody.type = 3;
    reqBody.wareHouseId = newWareHouse._id;
    reqBody.emailAddress = reqBody.email;
    reqBody.password = "123456";
    reqBody.role = {
      "_id": "64e39433e9a698a372731bc9",
      "name": "Warehouse Manager",
      "type": 10
    };
    reqBody.createdBy = await userModel.findOne({ _id: reqBody.userId }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 });
    reqBody.companyUserInfo = userInfo;
    const newUser = new userModel(reqBody);
    const newuserData = await newUser.save();
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##warehouse created successfully##', reqQuery.language), 'responseData': newWareHouse });
  } catch (err) {
    console.log(err);
    if (err.code == 11000 && err.keyPattern && err.keyPattern.emailAddress ==1) {
      return res.status(400).json({ status: -2, message: 'Email address already exists' });
    }
    return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

router.post('/list', async (req, res) => {
  const reqQuery = req.query;
  try {
    const reqBody = req.body;
    // console.log("reqBody",reqBody);
    var filter = {};
    if (reqBody.search != "") {
      const searchRegex = new RegExp(reqBody.search, 'i');
      filter.$or = [
        { name: searchRegex }
      ];
    }
    if (reqBody.companyId!=undefined) {
      filter['companyInfo._id'] = new mongoose.Types.ObjectId(reqBody.companyId);
    }
    const warehouse = await wareHouse.find(filter).sort({_id:-1});
    if (!warehouse) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##warehouse not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##warehouse listed successfully##', reqQuery.language), 'responseData': warehouse });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

router.post('/listWarehouseBy', async (req, res) => {
  const reqQuery = req.query;
  try {
    const reqBody = req.body;
    // console.log("reqBody",reqBody);
    var filter = {};
    if (reqBody.search!=undefined && reqBody.search != "") {
      const searchRegex = new RegExp(reqBody.search, 'i');
      filter.$or = [
        { name: searchRegex }
      ];
    }
    if (reqBody.companyId!=undefined) {
      filter['companyInfo._id'] = new mongoose.Types.ObjectId(reqBody.companyId);
    }
    const warehouse = await wareHouse.find(filter);
    if (!warehouse) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##warehouse not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##warehouse listed successfully##', reqQuery.language), 'responseData': warehouse });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

router.post('/getById', async (req, res) => {
  const reqQuery = req.query;
  try {
    const warehouse = await wareHouse.findOne({ _id: req.body._id });
    if (!warehouse) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##warehouse not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), responseData: warehouse });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

router.post('/update', async (req, res) => {
  const reqQuery = req.query;
  try {
    const reqBody = req.body;
    reqBody.companyInfo = await companyModel.findOne({ _id: reqBody.companyInfo._id }, { _id: 1, name: 1, contactNumber: 1, email: 1 });
    const warehouse = await wareHouse.findByIdAndUpdate(req.body._id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!warehouse) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##warehouse not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##warehouse updated successfully##', reqQuery.language), responseData: warehouse });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});


router.delete('/delete', async (req, res) => {
  const reqQuery = req.query;
  try {
    const warehouse = await wareHouse.findByIdAndDelete(req.body._id);
    if (!warehouse) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##warehouse not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##warehouse deleted successfully##', reqQuery.language) });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});


module.exports = router;