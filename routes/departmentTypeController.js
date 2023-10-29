const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const commonFunction = require('../public/js/commonFunction');
const DepartmentType = require('../schema/departmentType');

//create
router.post('/create', async (req, res) => {
  const reqQuery = req.query;
  try {
    const departmentType = new DepartmentType(req.body);
    const newdepartmentType = await departmentType.save();
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##departmentType created successfully##', reqQuery.language), 'responseData': newdepartmentType });
  } catch (error) {
    return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

//list
router.post('/list', async (req, res) => {
  const reqQuery = req.query;
  try {
    const reqBody = req.body;
    // var filter = {};
    // if (reqBody.wareHouseId != undefined && reqBody.wareHouseId != "") {
    //   filter.wareHouseId = new mongoose.Types.ObjectId(reqBody.wareHouseId);
    // }
    // if (reqBody.companyId != undefined && reqBody.companyId != "") {
    //   filter.companyId = new mongoose.Types.ObjectId(reqBody.companyId);
    // }
    // const newdepartmentType = await DepartmentType.find(filter).sort({ _id: -1 });
    const newdepartmentType = await DepartmentType.find({}).sort({ _id: -1 });
    
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##departmentType listed successfully##', reqQuery.language), 'responseData': newdepartmentType });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

//getById
router.post('/getById', async (req, res) => {
  const reqQuery = req.query;
  try {
    const newdepartmentType = await DepartmentType.findOne({ _id: req.body._id });

    if (!newdepartmentType) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##departmentType not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), responseData: newdepartmentType });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

//update
router.post('/update', async (req, res) => {
  const reqQuery = req.query;
  try {
    const newdepartmentType = await DepartmentType.findByIdAndUpdate(req.body._id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!newdepartmentType) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##departmentType not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##departmentType updated successfully##', reqQuery.language), responseData: newdepartmentType });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

//delete
router.delete('/delete', async (req, res) => {
  const reqQuery = req.query;
  try {
    const newdepartmentType = await DepartmentType.findByIdAndDelete(req.body._id);
    if (!newdepartmentType) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##departmentType not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##departmentType deleted successfully##', reqQuery.language) });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

module.exports = router;