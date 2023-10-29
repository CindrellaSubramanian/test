const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const commonFunction = require('../public/js/commonFunction');
const Bin = require('../schema/bin');
const Shelf = require('../schema/shelf');
const Rack = require('../schema/rack');
const Package = require('../schema/package');

// Create Bin
router.post('/create', async (req, res) => {
  const reqQuery = req.query;
  try {
    req.body.status = 1;
    const bin = new Bin(req.body);
    const newBin = await bin.save();
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##bin created successfully##', reqQuery.language), 'responseData': newBin });
  } catch (error) {
    return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

router.post('/list', async (req, res) => {
  const reqQuery = req.query;
  try {
    const bin = await Bin.find({});
    if (!bin)
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##bin not found##', reqQuery.language) });

    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##bin listed successfully##', reqQuery.language), 'responseData': bin });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

// Bin Find by ID
router.post('/getById', async (req, res) => {
  const reqQuery = req.query;
  try {
    const bin = await Bin.findOne({ _id: req.body._id });
    if (!bin)
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##bin not found##', reqQuery.language) });

    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), responseData: bin });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

// Bin Update
router.post('/update', async (req, res) => {
  const reqQuery = req.query;
  try {
    const bin = await Bin.findByIdAndUpdate(req.body._id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!bin)
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##bin not found##', reqQuery.language) });

    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##bin updated successfully##', reqQuery.language), responseData: bin });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

router.delete('/delete', async (req, res) => {
  const reqQuery = req.query;
  try {
    const bin = await Bin.findByIdAndDelete(req.body._id);
    if (!bin)
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##bin not found##', reqQuery.language) });

    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##bin deleted successfully##', reqQuery.language) });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

async function calculatePercentageOfShelf(shelfId) {
  const occupiedBin = await Bin.countDocuments({ 'shelfId': shelfId, 'status': 3 });
  const totalBin = await Bin.countDocuments({ 'shelfId': shelfId });
  const occupiedPercentage = (occupiedBin / totalBin) * 100;
  await Shelf.updateOne({ _id: shelfId }, { occupiedPercentage: occupiedPercentage })
  return occupiedPercentage;
}

async function calculatePercentageOfRack(rackId) {
  const occupiedBin = await Bin.countDocuments({ 'rackId': rackId, 'status': 3 });
  const totalBin = await Bin.countDocuments({ 'rackId': rackId });
  const occupiedPercentage = (occupiedBin / totalBin) * 100;
  await Rack.updateOne({ _id: rackId }, { occupiedPercentage: occupiedPercentage })
  return occupiedPercentage;
}

async function storeOnBin(selectedBinArray) {
  const uniqueRacks = [...new Set(selectedBinArray.map(data => data.rackId))];
  const uniqueShelf = [...new Set(selectedBinArray.map(data => data.shelfId))];

  await Bin.updateMany(
    { _id: { $in: selectedBinArray } },
    {
      $set: { status: 3 }
      /* $push: { taskInfo: taskInfo }, */
    }
  );
  uniqueRacks.forEach(result => {
    calculatePercentageOfRack(result)
  });
  uniqueShelf.forEach(result => {
    calculatePercentageOfShelf(result)
  });
}

async function releaseBin(selectedBinArray) {
  const uniqueRacks = [...new Set(selectedBinArray.map(data => data.rackId))];
  const uniqueShelf = [...new Set(selectedBinArray.map(data => data.shelfId))];

  await Bin.updateMany(
    { _id: { $in: selectedBinArray } },
    {
      $set: { status: 1, packageDetail: [] }

      /* $push: { taskInfo: taskInfo }, */
    }
  );
  uniqueRacks.forEach(result => {
    calculatePercentageOfRack(result)
  });
  uniqueShelf.forEach(result => {
    calculatePercentageOfShelf(result)
  });

}

router.post('/occupied', async (req, res) => {
  const reqBody = req.body;
  const reqQuery = req.query;
  try {
    // const bin = await Package.updateOne({_id:reqBody.packageID},{"selectedBin":reqBody.selectedBin})
    // const packageDetail = await Package.findById(reqBody.packageID)
    let bin = await storeOnBin(reqBody.selectedBin)
    if (!bin)
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##bin not found##', reqQuery.language) });

    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##bin selected successfully##', reqQuery.language) });
  } catch (error) {
    console.log("error", error)
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

router.post('/release', async (req, res) => {
  const reqBody = req.body;
  const reqQuery = req.query;
  try {
    // const bin = await Package.updateOne({_id:reqBody.packageID},{"selectedBin":reqBody.selectedBin})
    // const packageDetail = await Package.findById(reqBody.packageID)

    let bin = await releaseBin(reqBody.selectedBin)
    if (!bin)
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##bin not found##', reqQuery.language) });

    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##bin selected successfully##', reqQuery.language) });
  } catch (error) {
    console.log("error", error)
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

router.post('/binListByShelfId', async (req, res) => {
  const reqQuery = req.query;
  try {
    const reqBody = req.body;
    const bin = await Bin.find({ shelfId: reqBody.shelfId });
    if (!bin) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##bin not found##', reqQuery.language) });
    }
    var result = bin.map(element => {
      element.shelfName = element.shelfName + "." + reqBody.row;
    });
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##bin listed successfully##', reqQuery.language), 'responseData': bin });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

module.exports = { router, storeOnBin };