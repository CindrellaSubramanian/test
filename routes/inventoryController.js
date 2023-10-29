const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const commonFunction = require('../public/js/commonFunction');
const Inventory = require('../schema/inventory');

router.post('/create', async (req, res) => {
  const reqQuery = req.query;
  try {
    const existingInventory = await Inventory.findOne({ msku: req.body.msku });

    if (existingInventory) {
      return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##msku already exists##', reqQuery.language) });
    }

    const inventory = new Inventory(req.body);

    const newInventory = await inventory.save();
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##inventory created successfully##', reqQuery.language), 'responseData': newInventory });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

router.post('/list', async (req, res) => {
  const reqQuery = req.query;
  const { msku, type, location, jobId, page, limit } = req.body;

  try {
    let filter = {};

    if (msku !== "") {
      filter.msku = msku;
    }

    if (location != "") {
      filter.location = location;
    }

    if (jobId != "") {
      filter.jobId = jobId;
    }

    let pageNumber = parseInt(page) || 1;
    let pageSize = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * pageSize;

    const totalCount = await Inventory.countDocuments(filter);
    const inventory = await Inventory.find(filter).skip(skip).limit(pageSize);

    return res.status(200).json({ status: 1, message: commonFunction.translate('##inventory listed successfully##', reqQuery.language), totalCount, responseData: inventory, });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({ status: -1, message: commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

router.post('/getById', async (req, res) => {
  const reqQuery = req.query;
  try {
    const inventory = await Inventory.findOne({ _id: req.body._id });
    if (!inventory) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##inventory not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), responseData: inventory });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

router.post('/update', async (req, res) => {
  const reqQuery = req.query;
  try {
    const inventory = await Inventory.findByIdAndUpdate(req.body._id, req.body, { new: true, runValidators: true });
    if (!inventory) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##inventory not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##inventory updated successfully##', reqQuery.language), responseData: inventory });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

router.delete('/delete', async (req, res) => {
  const reqQuery = req.query;
  try {
    const inventory = await Inventory.findByIdAndDelete(req.body._id);
    if (!inventory) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##inventory not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##inventory deleted successfully##', reqQuery.language) });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

router.post('/mskuList', async (req, res) => {
  const reqQuery = req.query;
  try {
    const productList = await Inventory.find({}, { msku: 1 });

    if (productList.length === 0) {
      return res.status(404).json({ status: -1, message: commonFunction.translate('##data not found##', reqQuery.language) });
    }
    return res.status(200).json({ status: 1, message: commonFunction.translate('##success##', reqQuery.language), responseData: productList });

  } catch (err) {
    return res.status(500).json({ status: -1, message: commonFunction.translate('##internet Server error##', reqQuery.language) });
  }
});

module.exports = router;