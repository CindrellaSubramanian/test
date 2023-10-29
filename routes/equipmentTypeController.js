const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const commonFunction = require('../public/js/commonFunction');
const EquipmentType = require('../schema/equipmentType');

//create
router.post('/create', async (req, res) => {
  const reqQuery = req.query;
  try {
    // req.body.status=1;
    const equipmentType = new EquipmentType(req.body);
    const newequipmentType = await equipmentType.save();
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##equipmentType created successfully##', reqQuery.language), 'responseData': newequipmentType });
  } catch (error) {
    return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});


//list
router.post('/list', async (req, res) => {
  const reqQuery = req.query;
  try {
    let filter = {};
    const reqBody = req.body;
    if (reqBody.wareHouseId != undefined && reqBody.wareHouseId != "") {
      filter.wareHouseId = new mongoose.Types.ObjectId(reqBody.wareHouseId);
    }
    if (reqBody.companyId != undefined && reqBody.companyId != "") {
      filter.companyId = new mongoose.Types.ObjectId(reqBody.companyId);
    }
    const newequipmentType = await EquipmentType.find(filter).sort({_id:-1});
    // if (!newequipmentType) {
    //   return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##equipmentType not found##', reqQuery.language)});
    // }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##bin listed successfully##', reqQuery.language), 'responseData': newequipmentType });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});


//getById
router.post('/getById', async (req, res) => {
  const reqQuery = req.query;
  try {
    const newequipmentType = await EquipmentType.findOne({ _id: req.body._id });

    if (!newequipmentType) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##equipmentType not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), responseData: newequipmentType });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

//update
router.post('/update', async (req, res) => {
  const reqQuery = req.query;
  try {
    const newequipmentType = await EquipmentType.findByIdAndUpdate(req.body._id, req.body, { new: true, runValidators: true });
    if (!newequipmentType) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##equipmentType not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##equipmentType updated successfully##', reqQuery.language), responseData: newequipmentType });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

//delete
router.delete('/delete', async (req, res) => {
  const reqQuery = req.query;
  try {
    const newequipmentType = await EquipmentType.findByIdAndDelete(req.body._id);
    if (!newequipmentType) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##equipmentType not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##equipmentType deleted successfully##', reqQuery.language) });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

module.exports = router;