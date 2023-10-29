const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const commonFunction = require('../public/js/commonFunction');
const Gate = require('../schema/gate');


//create
router.post('/create', async (req, res) => {
  const reqQuery = req.query;
  try {
    //   req.body.status = 1;
    const newGate = await Gate.create(req.body);
    return res.status(200).json({ status: 1, message: commonFunction.translate('##gate created successfully##', reqQuery.language), responseData: newGate });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ status: -1, message: commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

//list
router.post('/list', async (req, res) => {
  const reqQuery = req.query;
  try {
    const reqBody = req.body;
    var filter = {};
    if (reqBody.wareHouseId != undefined && reqBody.wareHouseId != "") {
      filter.wareHouseId = new mongoose.Types.ObjectId(reqBody.wareHouseId);
    }
    if (reqBody.companyId != undefined && reqBody.companyId != "") {
      filter.companyId = new mongoose.Types.ObjectId(reqBody.companyId);
    }
    const newGate = await Gate.find(filter).sort({_id:-1});
    if (!newGate) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##gate not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), 'responseData': newGate });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language), 'responseData': package });
  }
});

//getById
router.post('/getById', async (req, res) => {
  const reqQuery = req.query;
  try {
    if (!req.body._id) return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##validation error##', reqQuery.language) });
    const newGate = await Gate.findOne({ _id: req.body._id });
    if (!newGate) 
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##gate not found##', reqQuery.language) });
    
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), responseData: newGate });

  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

//update
router.post('/update', async (req, res) => {
  const reqQuery = req.query;
  try {
    if (!req.body._id) return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##validation error##', reqQuery.language) });

    const newGate = await Gate.findByIdAndUpdate(req.body._id, req.body, { new: true, runValidators: true });
    if (!newGate) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##gate not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##gate updated successfully##', reqQuery.language), responseData: newGate });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

//delete
router.delete('/delete', async (req, res) => {
  const reqQuery = req.query;
  try {
    if (!req.body._id) return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##validation error##', reqQuery.language) });

    const newGate = await Gate.findByIdAndDelete(req.body._id);
    if (!newGate) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##gate not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##gate deleted successfully##', reqQuery.language) });
  } catch (error) {
    return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

router.post('/typeGateList', async (req, res) => {
  try {
    const reqBody = req.body;
    const type = req.body.type; 
    var filter = {};
    if (reqBody.wareHouseId != undefined && reqBody.wareHouseId != "") {
      filter.wareHouseId = new mongoose.Types.ObjectId(reqBody.wareHouseId);
    }
    if (reqBody.companyId != undefined && reqBody.companyId != "") {
      filter.companyId = new mongoose.Types.ObjectId(reqBody.companyId);
    }
    if (reqBody.type == 1 || reqBody.type == 2) {
      // Query the database based on the type
      filter.type = parseInt(reqBody.type);
      const gates = await Gate.find(filter);

      if (gates.length > 0) {
        // Return the list of gates based on the type
        res.status(200).json({ status: 1, message: 'Gate list retrieved successfully', data: gates });
      } else {
        res.status(404).json({ status: 0, message: 'No gates found for the specified type' });
      }
    } else {
      var gates = await Gate.find( filter );
      res.status(200).json({ status: 1, message: 'Gate list retrieved successfully', data: gates });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: -1, message: 'An error occurred while fetching the gate list' });
  }
});

module.exports = router;
