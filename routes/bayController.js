const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Bay = require('../schema/bay');
const commonFunction = require('../public/js/commonFunction');
const userModel = require('../schema/userModel');
const Job = require('../schema/job');
const QRCode = require('qrcode');

router.post('/create', async (req, res) => {
  const reqQuery = req.query;
  try {
    if (!req.body.name)
      return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##validation error##', reqQuery.language) });
    if (!req.body.groupId)
      return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##validation error##', reqQuery.language) });

    const dock = new Bay({
      name: req.body.name,
      groupId: req.body.groupId,
      description: req.body.description ? req.body.description : '',
      wareHouseId: req.body.wareHouseId,
      companyId: req.body.companyId
    });

    const createDock = await dock.save();

    // Generate QR code
    const qrCodeData = JSON.stringify({ dockId: createDock._id });
    const qrCodeFileName = createDock._id + "_QR.jpeg"; // Modify the file extension as needed

    QRCode.toFile("./public/dock_qr/" + qrCodeFileName, qrCodeData, async function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ 'status': -1, 'message': 'Failed to generate QR code' });
      }

      // Update the dock record with the QR code path
      const qrCodePath = "dock_qr/" + qrCodeFileName;
      await Bay.updateOne({ _id: createDock._id }, { $set: { qrCode: qrCodePath } });

      return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##dock created successfully##', reqQuery.language), 'responseData': createDock });
    });
  } catch (error) {
    console.log(error);
    return res.status(404).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

router.post('/allList', async (req, res) => {
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
    const newBay = await Bay.find(filter).sort({_id:-1});
    if (!newBay)
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##bay not found##', reqQuery.language) });

    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), 'responseData': newBay });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

router.post('/list', async (req, res) => {
  const reqQuery = req.query;
  try {
    const { groupId, status } = req.body;
    const reqBody = req.body;
    var filter = {};
    if (reqBody.wareHouseId != undefined && reqBody.wareHouseId != "") {
      filter.wareHouseId = new mongoose.Types.ObjectId(reqBody.wareHouseId);
    }
    if (reqBody.companyId != undefined && reqBody.companyId != "") {
      filter.companyId = new mongoose.Types.ObjectId(reqBody.companyId);
    }
    if (reqBody.status != undefined && reqBody.status != "") {
      filter.status = reqBody.status;
    }
    if (reqBody.groupId != undefined && reqBody.groupId != "") {
      filter.groupId = reqBody.groupId;
    }
    // console.log("filter",filter);
    const bayList = await Bay.find(filter).sort({_id:-1});

    if (bayList.length === 0)
      return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##data not found##', reqQuery.language) });

    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), responseData: bayList });
  } catch (error) {
    console.log(error);
    return res.status(404).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##') });
  }
});

router.post('/update', async (req, res) => {
  const reqQuery = req.query;
  try {
    if (!req.body._id) return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##validation error##', reqQuery.language) });

    const { _id, name, groupId, description, status } = req.body;
    const bayId = new mongoose.Types.ObjectId(_id);
    const bay = await Bay.findById(bayId);
    if (!bay) return res.status(404).json({ 'status': -1, 'message': commonFunction.translate('##data not found##', reqQuery.language) });

    bay.name = name || bay.name;
    bay.groupId = groupId || bay.groupId;
    bay.description = description || bay.description;
    bay.status = status || bay.status;

    bay.updatedAt = Date.now();

    if (!bay.createdAt) {
      bay.createdAt = bay.updatedAt;
    }

    const updatedBay = await bay.save();
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##bay updated successfully##', reqQuery.language), 'responseData': updatedBay });
  } catch (error) {
    console.log(error);
    return res.status(404).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##') });
  }
});

router.post('/getById', async (req, res) => {
  const reqQuery = req.query;
  try {

    if (!req.body._id) return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##validation error##', reqQuery.language) });
    // const _id = req.body._id;

    const bay = await Bay.findOne({ _id: req.body._id });

    if (!bay) {
      return res.status(404).json({ 'status': -2, 'message': commonFunction.translate('##bay not found##') });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), responseData: bay });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##') });
  }
});

router.post('/inboundBayList', async (req, res) => {
  try {
    const reqBody = req.body;
    var filter = {};
    if (reqBody.wareHouseId != undefined && reqBody.wareHouseId != "") {
      filter.wareHouseId = new mongoose.Types.ObjectId(reqBody.wareHouseId);
    }
    if (reqBody.companyId != undefined && reqBody.companyId != "") {
      filter.companyId = new mongoose.Types.ObjectId(reqBody.companyId);
    }
    filter.groupId = 1;
    const bayList = await Bay.find(filter).sort({_id:-1});
    const inboundBays = await Bay.find({ groupId: 1 });
    return res.status(200).json({ status: 1, message: 'Success', inboundBays });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: -1, message: 'Internal Server Error' });
  }
});

router.post('/inboundAvailableBayList', async (req, res) => {
  try {
    const reqBody = req.body;
    var filter = {};
    if (reqBody.wareHouseId != undefined && reqBody.wareHouseId != "") {
      filter.wareHouseId = new mongoose.Types.ObjectId(reqBody.wareHouseId);
    }
    if (reqBody.companyId != undefined && reqBody.companyId != "") {
      filter.companyId = new mongoose.Types.ObjectId(reqBody.companyId);
    }
    filter.groupId = 1;
    filter.status = 1;
    const inboundBays = await Bay.find({ groupId: 1, status: 1 });
    return res.status(200).json({ status: 1, message: 'Success', inboundBays });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: -1, message: 'Internal Server Error' });
  }
});

router.post('/outboundBayList', async (req, res) => {
  try {
    const outboundBays = await Bay.find({ groupId: 2 });
    return res.status(200).json({ status: 1, message: 'Success', outboundBays });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: -1, message: 'Internal Server Error' });
  }
});

router.delete('/delete', async (req, res) => {
  const reqQuery = req.query;
  try {
    if (!req.body._id) return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##validation error##', reqQuery.language) });

    const newBay = await Bay.findByIdAndDelete(req.body._id);
    if (!newBay) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##bay not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##bay deleted successfully##', reqQuery.language) });
  } catch (error) {
    return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

router.post('/inboundBayListByUserId', async (req, res) => {
  try {
    const reqBody = req.body;
    var filter = {};
    if (reqBody.wareHouseId != undefined && reqBody.wareHouseId != "") {
      filter.wareHouseId = new mongoose.Types.ObjectId(reqBody.wareHouseId);
    }
    if (reqBody.companyId != undefined && reqBody.companyId != "") {
      filter.companyId = new mongoose.Types.ObjectId(reqBody.companyId);
    }
    filter.groupId = 1;
    filter.status = 1;
    const inboundBays = await Bay.find({ groupId: 1, status: 1 });
    return res.status(200).json({ status: 1, message: 'Success', "inboundBays": inboundBays });
    // const inboundBays = await userModel.findOne({ _id: req.body.userId }, { bayInfo: 1 });
    // return res.status(200).json({ status: 1, message: 'Success', "inboundBays": inboundBays.bayInfo });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: -1, message: 'Internal Server Error' });
  }
});


router.post('/relocateBayDetail', async (req, res) => {
  try {
    const { jobId } = req.body;

    // Find the task based on the provided jobId
    const job = await Job.findOne({ jobId });

    if (!job) {
      return res.status(404).json({
        status: -2,
        message: 'Job not found.',
      });
    }

    // Initialize bayInfoDetail as an empty object if bayInfo doesn't exist
    const bayInfoDetail = job.bayInfo || {};

    return res.status(200).json({
      status: 1,
      message: 'Bay info retrieved successfully.',
      responseData: bayInfoDetail,
    });
  } catch (error) {
    console.error('Error retrieving bay info:', error);
    return res.status(500).json({ status: -1, message: 'Internal server error' });
  }
});



module.exports = router;