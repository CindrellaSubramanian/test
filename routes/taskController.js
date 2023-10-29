const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const commonFunction = require('../public/js/commonFunction');
const Task = require('../schema/task');
const userModel = require('../schema/userModel');
const equipment = require('../schema/equipment');
const Job = require('../schema/job');
const Package = require('../schema/package');
const EquipmentLog = require('../schema/equipmentLog');
const ProductDetail = require('../schema/productDetail');
const bayModel = require('../schema/bay');
const locationModel = require('../schema/location');
const Cart = require('../schema/cart');
const Bay = require('../schema/bay');
const moment = require('moment');
const Client = require('../schema/client');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const Bin = require('../schema/bin');
const QRCode = require('qrcode');
const Shelf = require('../schema/shelf');
const Rack = require('../schema/rack');
require('dotenv').config();


router.post('/createCopy', async (req, res) => {
  const reqQuery = req.query;
  try {
    const { type, note, userId, jobId, packageDetails, equipmentId, wareHouseId, companyId, companyUserId } = req.body;
    if (!jobId || !userId) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##validation error##', reqQuery.language) });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ status: -2, message: commonFunction.translate('##user not found##', reqQuery.language) });
    }
    const userDetail = await userModel.findOne({}, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 });
    if (req.body.createdBy == undefined) {
      var assignedByUser = await userModel.findOne({}, { _id: 1, fullName: 1 }).sort({ _id: 1 })
    } else {
      var assignedByUser = await userModel.findOne({ _id: req.body.createdBy }, { _id: 1, fullName: 1 }).sort({ _id: 1 })

    }
    // const assignedByUser = await userModel.findOne({}, { _id: 1, fullName: 1 }).sort({ _id: 1 });

    const jobInfo = await Job.findById(jobId, { _id: 1, consignmentId: 1, clientId: 1, clientDetail: 1, invoiceNo: 1, purchaseOrderNo: 1, bayInfo: 1 });

    if (!jobInfo) {
      return res.status(404).json({ status: -3, message: commonFunction.translate('##job not found##', reqQuery.language) });
    }
    if (!jobInfo.bayInfo) {
      return res.status(400).json({ status: -4, message: "Bay info is not available for this job" });
    }

    // Fetch equipment information based on equipmentId
    const equipmentInfo = await equipment.findById(equipmentId).select('_id name');

    if (!equipmentInfo) {
      return res.status(404).json({ status: -3, message: "Equipment info not found" });
    }

    const packageLocationInfoArray = [];

    if (req.body.type < 5) {
      const fetchPackageDetailsPromises = packageDetails.map(async (element) => {
        const packageFromDB = await Package.findOne({ "_id": new mongoose.Types.ObjectId(element._id) });
        if (packageFromDB && packageFromDB.locationInfo !== undefined) {
          packageLocationInfoArray.push(packageFromDB.locationInfo);
        }
        return {
          ...element,
          type: type < 5 ? type : element.type,
        };
      });

      const fetchedPackageDetails = await Promise.all(fetchPackageDetailsPromises);
      packageDetailArr = fetchedPackageDetails;
    }

    if (req.body.type == 5) {
      const packageLocationInfo = await locationModel.findOne({ _id: req.body.locationId });
      if (packageLocationInfo === null) {
        return res.status(400).json({ status: -3, message: "location info not found" });
      }

      const modifiedPackageDetails = packageDetails.map(element => ({
        ...element,
        // type: type,
        locationId: req.body.locationId,
        locationInfo: packageLocationInfo,
      }));

      await Job.updateOne(
        { _id: jobId },
        { $set: { "packageDetails": modifiedPackageDetails } }
      );
    }

    let packageLength = 0;
    let packageIdArray = [];
    let newTask;
    let logStatus;
    let typeName;
    let subtaskName;

    if (packageDetails) {
      packageLength = packageDetails.length;

      switch (type) {
        case 1:
          logStatus = 15;
          typeName = "Put away";
          break;
        case 2:
          logStatus = 18;
          typeName = "Sort";
          break;
        case 3:
          logStatus = 21;
          typeName = "Assemble";
          break;
        case 4:
          logStatus = 24;
          typeName = "Relocate";
          break;
        case 5:
          logStatus = 10;
          typeName = "Unload";
          break;
        case 6:
          logStatus = 27;
          typeName = "QA";
          break;
        case 7:
          logStatus = 31;
          typeName = "Repackage";
          break;
        case 8:
          logStatus = 34;
          typeName = "Picker";
          break;
        case 9:
          logStatus = 37;
          typeName = "Load";
          break;
        default:
          break;
      }

      const packageDetailArr = packageDetails.map((element) => {
        packageIdArray.push(element._id);
        return {
          ...element,
          type: logStatus,
        };
      });

      let packageLocationInfo = {};

      if (req.body.locationId !== undefined && req.body.locationId !== "") {
        packageLocationInfo = await locationModel.findOne({ _id: req.body.locationId });
        if (packageLocationInfo === null) {
          return res.status(400).json({ status: -3, message: "location info not found" });
        }
      }

      newTask = new Task({
        type: type,
        note: note,
        userId: userId,
        status: 1,
        bayInfo: jobInfo.bayInfo,
        equipmentInfo: equipmentInfo,
        locationInfo: packageLocationInfo,
        date: commonFunction.currentDate(),
        time: commonFunction.currentTime(),
        items: packageLength,
        packageDetails: packageDetailArr,
        jobInfo: {
          _id: jobInfo._id,
          consignmentId: jobInfo.consignmentId,
          clientId: jobInfo.clientId,
          clientDetail: jobInfo.clientDetail,
          invoiceNo: jobInfo.invoiceNo,
          purchaseOrderNo: jobInfo.purchaseOrderNo,
          bayInfo: jobInfo.bayInfo,
        },
        companyUserInfo: await userModel.findOne({ _id: companyUserId }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1, companyInfo: 1 }),
        wareHouseId: wareHouseId,
        companyId: companyId,
        assignedBy: { _id: assignedByUser._id, name: assignedByUser.fullName },
        assignedTo: { _id: userId, name: user.fullName },
      });

      await newTask.save();
      subtaskName = { "1": "Put away", "2": "Sort", "3": "Assemble", "4": "Relocate", "5": "Unload", "6": "QA", "7": "Repackage", "8": "Picker", "9": "Pack", "10": "Load" };

      // subtaskName = { "1": "Put away", "2": "Sort", "3": "Assemble", "4": "Relocate", "5": "Unload", "6": "QA", "7": "Repackage", "8": "Picker", "9": "Pack", "10": "Load" };
      const dataDesc = 'A task was assigned to ' + user.fullName + ' by ' + assignedByUser.fullName;

      const subtaskLog = {
        description: dataDesc,
        status: logStatus,
        createdBy: userDetail.fullName,
        createdAt: new Date(),
      };

      await Job.updateOne(
        { _id: jobId },
        {
          $push: { logs: subtaskLog, subtask: newTask },
          $set: { statusInfo: subtaskLog },
        }
      );

      const taskInfo = {
        taskId: newTask._id,
        type: type,
        taskName: typeName,
        status: newTask.status,
      };

      await Package.updateMany(
        { _id: { $in: packageIdArray } },
        {
          $set: { taskStatus: subtaskName[type], taskInfo: taskInfo },
        }
      );

      await userModel.updateOne(
        { _id: userId },
        {
          $push: {
            taskInfo: {
              taskId: newTask._id,
              type: logStatus,
              status: newTask.status,
            },
          },
        }
      );
    }

    if (user.deviceToken !== undefined && user.deviceToken !== "") {
      const dataValue = JSON.stringify({
        "to": user.deviceToken,
        "notification": {
          "title": "WMS",
          "body": subtaskName[type] + " task assigned to you",
          "icon": "task assign to you",
          "sound": "default",
        },
        "data": {
          "message": {
            "title": "Wms",
            "message": subtaskName[type] + " task assigned to you",
            "priority": 0,
            "status": 1,
          },
        },
      });
      commonFunction.sendPushNotification(dataValue);
    }

    return res.status(200).json({ status: 1, message: commonFunction.translate('##success##', reqQuery.language) });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: -1, message: commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

router.post('/create', async (req, res) => {
  const reqQuery = req.query;
  try {
    const { type, note, userId, jobId, packageDetails, equipmentId, wareHouseId, companyId, companyUserId } = req.body;
    if (!jobId || !userId) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##validation error##', reqQuery.language) });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ status: -2, message: commonFunction.translate('##user not found##', reqQuery.language) });
    }
    const userDetail = await userModel.findOne({}, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 });
    if (req.body.createdBy == undefined) {
      var assignedByUser = await userModel.findOne({}, { _id: 1, fullName: 1 }).sort({ _id: 1 })
    } else {
      var assignedByUser = await userModel.findOne({ _id: req.body.createdBy }, { _id: 1, fullName: 1 }).sort({ _id: 1 })

    }
    // const assignedByUser = await userModel.findOne({}, { _id: 1, fullName: 1 }).sort({ _id: 1 });

    const jobInfo = await Job.findById(jobId, { _id: 1, consignmentId: 1, clientId: 1, clientDetail: 1, invoiceNo: 1, purchaseOrderNo: 1, bayInfo: 1 });

    if (!jobInfo) {
      return res.status(404).json({ status: -3, message: commonFunction.translate('##job not found##', reqQuery.language) });
    }
    if (!jobInfo.bayInfo) {
      return res.status(400).json({ status: -4, message: "Bay info is not available for this job" });
    }

    // Fetch equipment information based on equipmentId
    const equipmentInfo = await equipment.findById(equipmentId).select('_id name');

    if (!equipmentInfo) {
      return res.status(404).json({ status: -3, message: "Equipment info not found" });
    }

    const packageLocationInfoArray = [];

    if (req.body.type < 5) {
      const fetchPackageDetailsPromises = packageDetails.map(async (element) => {
        const packageFromDB = await Package.findOne({ "_id": new mongoose.Types.ObjectId(element._id) });
        if (packageFromDB && packageFromDB.locationInfo !== undefined) {
          packageLocationInfoArray.push(packageFromDB.locationInfo);
        }
        return {
          ...element,
          type: type < 5 ? type : element.type,
        };
      });

      const fetchedPackageDetails = await Promise.all(fetchPackageDetailsPromises);
      packageDetailArr = fetchedPackageDetails;
    }

    if (req.body.type == 5) {
      const packageLocationInfo = await locationModel.findOne({ _id: req.body.locationId });
      if (packageLocationInfo === null) {
        return res.status(400).json({ status: -3, message: "location info not found" });
      }

      const modifiedPackageDetails = packageDetails.map(element => ({
        ...element,
        // type: type,
        locationId: req.body.locationId,
        locationInfo: packageLocationInfo,
      }));

      await Job.updateOne(
        { _id: jobId },
        { $set: { "packageDetails": modifiedPackageDetails } }
      );
    }

    let packageLength = 0;
    let packageIdArray = [];
    let newTask;
    let logStatus;
    let typeName;
    let subtaskName;

    if (packageDetails) {
      packageLength = packageDetails.length;

      switch (type) {
        case 1:
          logStatus = 15;
          typeName = "Put away";
          break;
        case 2:
          logStatus = 18;
          typeName = "Sort";
          break;
        case 3:
          logStatus = 21;
          typeName = "Assemble";
          break;
        case 4:
          logStatus = 24;
          typeName = "Relocate";
          break;
        case 5:
          logStatus = 10;
          typeName = "Unload";
          break;
        case 6:
          logStatus = 27;
          typeName = "QA";
          break;
        case 7:
          logStatus = 31;
          typeName = "Repackage";
          break;
        case 8:
          logStatus = 34;
          typeName = "Picker";
          break;
        case 9:
          logStatus = 37;
          typeName = "Load";
          break;
        default:
          break;
      }

      const packageDetailArr = packageDetails.map((element) => {
        // Set cartStatus to 0 for each package detail
        // element.cartStatus = 0;
        packageIdArray.push(element._id);
        return {
          ...element,
          type: logStatus,
        };
      });


      let packageLocationInfo = {};

      if (req.body.locationId !== undefined && req.body.locationId !== "") {
        packageLocationInfo = await locationModel.findOne({ _id: req.body.locationId });
        if (packageLocationInfo === null) {
          return res.status(400).json({ status: -3, message: "location info not found" });
        }
      }

      newTask = new Task({
        type: type,
        note: note,
        userId: userId,
        status: 1,
        bayInfo: jobInfo.bayInfo,
        equipmentInfo: equipmentInfo,
        locationInfo: packageLocationInfo,
        date: commonFunction.currentDate(),
        time: commonFunction.currentTime(),
        items: packageLength,
        packageDetails: packageDetailArr,
        jobInfo: {
          _id: jobInfo._id,
          consignmentId: jobInfo.consignmentId,
          clientId: jobInfo.clientId,
          clientDetail: jobInfo.clientDetail,
          invoiceNo: jobInfo.invoiceNo,
          purchaseOrderNo: jobInfo.purchaseOrderNo,
          bayInfo: jobInfo.bayInfo,
        },
        companyUserInfo: await userModel.findOne({ _id: companyUserId }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1, companyInfo: 1 }),
        wareHouseId: wareHouseId,
        companyId: companyId,
        assignedBy: { _id: assignedByUser._id, name: assignedByUser.fullName },
        assignedTo: { _id: userId, name: user.fullName },
      });

      await newTask.save();
       subtaskName = { "1": "Put away", "2": "Sort", "3": "Assemble", "4": "Relocate", "5": "Unload", "6": "QA", "7": "Repackage", "8": "Picker", "9": "Pack", "10": "Load" };

      // subtaskName = { "1": "Put away", "2": "Sort", "3": "Assemble", "4": "Relocate", "5": "Unload", "6": "QA", "7": "Repackage", "8": "Picker", "9": "Pack", "10": "Load" };
      const dataDesc = 'A task was assigned to ' + user.fullName + ' by ' + assignedByUser.fullName;

      const subtaskLog = {
        description: dataDesc,
        status: logStatus,
        createdBy: userDetail.fullName,
        createdAt: new Date(),
      };

      await Job.updateOne(
        { _id: jobId },
        {
          $push: { logs: subtaskLog, subtask: newTask },
          $set: { statusInfo: subtaskLog },
        }
      );

      const taskInfo = {
        taskId: newTask._id,
        type: type,
        taskName: typeName,
        status: newTask.status,
      };

      await Package.updateMany(
        { _id: { $in: packageIdArray } },
        {
          $set: { taskStatus: subtaskName[type], taskInfo: taskInfo },
        }
      );

      await userModel.updateOne(
        { _id: userId },
        {
          $push: {
            taskInfo: {
              taskId: newTask._id,
              type: logStatus,
              status: newTask.status,
            },
          },
        }
      );
    }

    if (user.deviceToken !== undefined && user.deviceToken !== "") {
      const dataValue = JSON.stringify({
        "to": user.deviceToken,
        "notification": {
          "title": "WMS",
          "body": subtaskName[type] + " task assigned to you",
          "icon": "task assign to you",
          "sound": "default",
        },
        "data": {
          "message": {
            "title": "Wms",
            "message": subtaskName[type] + " task assigned to you",
            "priority": 0,
            "status": 1,
          },
        },
      });
      commonFunction.sendPushNotification(dataValue);
    }

    return res.status(200).json({ status: 1, message: commonFunction.translate('##success##', reqQuery.language) });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: -1, message: commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});




router.post('/relocationCreate', async (req, res) => {
  const reqQuery = req.query;
  try {
    const { userId, jobId, packageDetails, locationId, equipmentId, note, wareHouseId, companyId, companyUserId, createdBy } = req.body;
    if (!jobId || !userId) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##validation error##', reqQuery.language) });
    }
    const equipmentInfo = await equipment.findById(equipmentId).select('_id name');
    if (!equipmentInfo) {
      return res.status(404).json({ status: -3, message: "Equipment info not found" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ status: -2, message: commonFunction.translate('##user not found##', reqQuery.language) });
    }

    if (req.body.createdBy == undefined) {
      var assignedByUser = await userModel.findOne({}, { _id: 1, fullName: 1 }).sort({ _id: 1 })

    } else {
      var assignedByUser = await userModel.findOne({ _id: createdBy }, { _id: 1, fullName: 1 }).sort({ _id: 1 })

    }
    // Fetch assignedByUser from userModel
    // const assignedByUser = await userModel.findOne({ _id: createdBy }, { _id: 1, fullName: 1 }).sort({ _id: 1 });

    const assignedBy = {
      _id: assignedByUser._id,
      name: assignedByUser.fullName,
    };

    const assignedTo = {
      _id: user._id,
      name: user.fullName,
    };

    // Fetch jobInfo and locationInfo based on jobId and locationId
    // const jobInfo = await Job.findOne({ _id: jobId }, { bayInfo: 1 });

    const jobInfo = await Job.findOne({ _id: jobId }, { gateInfo: 1, bayInfo: 1, consignmentId: 1, clientId: 1, clientDetail: 1, vehicleDetail: 1, invoiceNo: 1, purchaseOrderNo: 1, shipmentDetail: 1, skuDetails: 1 });
    // const locationInfo = await locationModel.findOne({ _id: locationId, groupId: 1 });
    const locationInfo = await locationModel.findOne({ _id: locationId });
    // // console.log("jobInfo",jobInfo);
    // // console.log("locationId",locationId);
    if (!jobInfo || !locationInfo) {
      return res.status(404).json({ status: -3, message: commonFunction.translate('##job or location not found##', reqQuery.language) });
    }

    const newTask = new Task({
      userId: userId,
      status: 1,
      type: 4,
      bayInfo: jobInfo.bayInfo,
      equipmentInfo: equipmentInfo,
      note: note,
      date: commonFunction.currentDate(),
      time: commonFunction.currentTime(),
      items: packageDetails ? packageDetails.length : 0,
      packageDetails: packageDetails || [],
      jobInfo: jobInfo,
      locationInfo: locationInfo,
      companyUserInfo: await userModel.findOne({ _id: companyUserId }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1, companyInfo: 1 }),
      wareHouseId: wareHouseId,
      companyId: companyId,
      assignedBy: assignedBy,
      assignedTo: assignedTo,
    });

    const savedTask = await newTask.save();

    // Update package status to "Relocated"
    if (packageDetails && packageDetails.length > 0) {
      const packageIds = packageDetails.map((element) => element._id);
      const data = {
        status: 4, // Relocate
        taskInfo: {
          taskId: savedTask._id,
          type: 4,
          taskName: "Relocate",
          status: 1, // Use the status from the newly created task
        },
      };

      const packageUpdateResult = await Package.updateMany({ _id: { $in: packageIds } }, { $set: data });
      // // console.log("packageUpdateResult", packageUpdateResult);
    }

    // Create log entry for subtask assignment
    const userDetail = await userModel.findById(userId, {
      _id: 1,
      fullName: 1,
      email: 1,
      mobile: 1,
      countryCode: 1,
      country: 1,
      zipcode: 1,
      address: 1,
      state: 1,
      city: 1,
    });

    var dataDesc = 'A relocation task was assigned to' + userDetail.fullName + 'by' + assignedByUser.fullName;

    const subtaskLog = {
      description: dataDesc,
      status: 24, // taskAssigned status
      createdBy: userDetail.fullName,
      createdAt: new Date(),
    };

    await Job.updateOne({ _id: jobId }, { $push: { logs: subtaskLog, subtask: savedTask } });
    await Job.updateOne({ _id: jobId }, { $set: { statusInfo: subtaskLog } });

    if (user.deviceToken != undefined && user.deviceToken != "") {
      var dataValue = JSON.stringify({
        "to": user.deviceToken,
        "notification": {
          "title": "WMS",
          "body": "Relocate task assigned to you",
          "icon": "task assign to you",
          "sound": "default"
        },
        "data": {
          "message": {
            "title": "Wms",
            "message": "Relocate task assigned to you",
            "priority": 0,
            "status": 1
          }
        }
      });
      commonFunction.sendPushNotification(dataValue);
    }

    return res.status(200).json({ status: 1, message: commonFunction.translate('##success##', reqQuery.language), assignedBy, assignedTo });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: -1, message: commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});





// router.post('/relocationBayCreate', async (req, res) => {
//   const reqQuery = req.query;
//   try {
//     const { type, userId, jobId, packageDetails, locationId, equipmentId, note, wareHouseId, companyId, companyUserId, createdBy } = req.body;
//     if (!jobId || !userId) {
//       return res.status(400).json({ status: -1, message: commonFunction.translate('##validation error##', reqQuery.language) });
//     }
//     const equipmentInfo = await equipment.findById(equipmentId).select('_id name');
//     if (!equipmentInfo) {
//       return res.status(404).json({ status: -3, message: "Equipment info not found" });
//     }

//     const user = await userModel.findById(userId);
//     if (!user) {
//       return res.status(404).json({ status: -2, message: commonFunction.translate('##user not found##', reqQuery.language) });
//     }

//     if (req.body.createdBy == undefined) {
//       var assignedByUser = await userModel.findOne({}, { _id: 1, fullName: 1 }).sort({ _id: 1 })

//     } else {
//       var assignedByUser = await userModel.findOne({ _id: createdBy }, { _id: 1, fullName: 1 }).sort({ _id: 1 })

//     }
//     // Fetch assignedByUser from userModel
//     // const assignedByUser = await userModel.findOne({ _id: createdBy }, { _id: 1, fullName: 1 }).sort({ _id: 1 });

//     const assignedBy = {
//       _id: assignedByUser._id,
//       name: assignedByUser.fullName,
//     };

//     const assignedTo = {
//       _id: user._id,
//       name: user.fullName,
//     };


//     const jobInfo = await Job.findOne({ _id: jobId }, { gateInfo: 1, bayInfo: 1, consignmentId: 1, clientId: 1, clientDetail: 1, vehicleDetail: 1, invoiceNo: 1, purchaseOrderNo: 1, shipmentDetail: 1, skuDetails: 1 });



//     let locationInfo = {};

//     if (type === 4 && locationId == undefined) {
//       // If type is 4 and locationId is an empty string, set bayInfo in the response body and save an empty object as locationInfo
//       return res.status(200).json({ status: 1, message: commonFunction.translate('##success##', reqQuery.language), bayInfo: jobInfo.bayInfo, locationInfo });
//     } else {
//       locationInfo = await locationModel.findOne({ _id: locationId });
//     }

//     if (!jobInfo) {
//       return res.status(404).json({ status: -3, message: commonFunction.translate('##job or location not found##', reqQuery.language) });
//     }

//     const newTask = new Task({
//       userId: userId,
//       status: 1,
//       type: 4,
//       bayInfo: jobInfo.bayInfo,
//       equipmentInfo: equipmentInfo,
//       note: note,
//       date: commonFunction.currentDate(),
//       time: commonFunction.currentTime(),
//       items: packageDetails ? packageDetails.length : 0,
//       packageDetails: packageDetails || [],
//       jobInfo: jobInfo,
//       locationInfo: locationInfo,
//       companyUserInfo: await userModel.findOne({ _id: companyUserId }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1, companyInfo: 1 }),
//       wareHouseId: wareHouseId,
//       companyId: companyId,
//       assignedBy: assignedBy,
//       assignedTo: assignedTo,
//     });

//     const savedTask = await newTask.save();

//     // Update package status to "Relocated"
//     if (packageDetails && packageDetails.length > 0) {
//       const packageIds = packageDetails.map((element) => element._id);
//       const data = {
//         status: 4, // Relocated
//         taskInfo: {
//           taskId: savedTask._id,
//           type: 4,
//           taskName: "Relocate Assigned",
//           status: 1, // Use the status from the newly created task
//         },
//       };

//       const packageUpdateResult = await Package.updateMany({ _id: { $in: packageIds } }, { $set: data });
//       // // console.log("packageUpdateResult", packageUpdateResult);
//     }

//     // Create log entry for subtask assignment
//     const userDetail = await userModel.findById(userId, {
//       _id: 1,
//       fullName: 1,
//       email: 1,
//       mobile: 1,
//       countryCode: 1,
//       country: 1,
//       zipcode: 1,
//       address: 1,
//       state: 1,
//       city: 1,
//     });

//     var dataDesc = 'A relocation task was assigned to' + userDetail.fullName + 'by' + assignedByUser.fullName;

//     const subtaskLog = {
//       description: dataDesc,
//       status: 24, // taskAssigned status
//       createdBy: userDetail.fullName,
//       createdAt: new Date(),
//     };

//     await Job.updateOne({ _id: jobId }, { $push: { logs: subtaskLog, subtask: savedTask } });
//     await Job.updateOne({ _id: jobId }, { $set: { statusInfo: subtaskLog } });

//     if (user.deviceToken != undefined && user.deviceToken != "") {
//       var dataValue = JSON.stringify({
//         "to": user.deviceToken,
//         "notification": {
//           "title": "WMS",
//           "body": "Relocate task assigned to you",
//           "icon": "task assign to you",
//           "sound": "default"
//         },
//         "data": {
//           "message": {
//             "title": "Wms",
//             "message": "Relocate task assigned to you",
//             "priority": 0,
//             "status": 1
//           }
//         }
//       });
//       commonFunction.sendPushNotification(dataValue);
//     }

//     return res.status(200).json({ status: 1, message: commonFunction.translate('##success##', reqQuery.language), responseData: locationId === "" ? jobInfo.bayInfo : locationInfo, });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ status: -1, message: commonFunction.translate('##internal server error##', reqQuery.language) });
//   }
// });




router.post('/relocationBayCreate', async (req, res) => {
  const reqQuery = req.query;
  try {
    const { type, userId, jobId, packageDetails, locationId, equipmentId, note, wareHouseId, companyId, companyUserId, createdBy } = req.body;
    if (!jobId || !userId) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##validation error##', reqQuery.language) });
    }
    const equipmentInfo = await equipment.findById(equipmentId).select('_id name');
    if (!equipmentInfo) {
      return res.status(404).json({ status: -3, message: "Equipment info not found" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ status: -2, message: commonFunction.translate('##user not found##', reqQuery.language) });
    }

    if (req.body.createdBy == undefined) {
      var assignedByUser = await userModel.findOne({}, { _id: 1, fullName: 1 }).sort({ _id: 1 })

    } else {
      var assignedByUser = await userModel.findOne({ _id: createdBy }, { _id: 1, fullName: 1 }).sort({ _id: 1 })

    }
    // Fetch assignedByUser from userModel
    // const assignedByUser = await userModel.findOne({ _id: createdBy }, { _id: 1, fullName: 1 }).sort({ _id: 1 });

    const assignedBy = {
      _id: assignedByUser._id,
      name: assignedByUser.fullName,
    };

    const assignedTo = {
      _id: user._id,
      name: user.fullName,
    };


    const jobInfo = await Job.findOne({ _id: jobId }, { gateInfo: 1, bayInfo: 1, consignmentId: 1, clientId: 1, clientDetail: 1, vehicleDetail: 1, invoiceNo: 1, purchaseOrderNo: 1, shipmentDetail: 1, skuDetails: 1 });



    let locationInfo = {};

    if (type === 4 && locationId == undefined) {
      // If type is 4 and locationId is an empty string, set bayInfo in the response body and save an empty object as locationInfo
      // return res.status(200).json({ status: 1, message: commonFunction.translate('##success##', reqQuery.language), bayInfo: jobInfo.bayInfo, locationInfo });
      var newTask = new Task({
        userId: userId,
        status: 1,
        type: 4,
        bayInfo: jobInfo.bayInfo,
        equipmentInfo: equipmentInfo,
        note: note,
        date: commonFunction.currentDate(),
        time: commonFunction.currentTime(),
        items: packageDetails ? packageDetails.length : 0,
        packageDetails: packageDetails || [],
        jobInfo: jobInfo,
        locationInfo: {},
        loadStatus:1,
        companyUserInfo: await userModel.findOne({ _id: companyUserId }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1, companyInfo: 1 }),
        wareHouseId: wareHouseId,
        companyId: companyId,
        assignedBy: assignedBy,
        assignedTo: assignedTo,
      });
      await Job.updateOne({ _id: jobId }, { $set: { loadStatus:1 } });
    } else {
      locationInfo = await locationModel.findOne({ _id: locationId });
      var newTask = new Task({
        userId: userId,
        status: 1,
        type: 4,
        bayInfo: {},
        equipmentInfo: equipmentInfo,
        note: note,
        date: commonFunction.currentDate(),
        time: commonFunction.currentTime(),
        items: packageDetails ? packageDetails.length : 0,
        packageDetails: packageDetails || [],
        jobInfo: jobInfo,
        locationInfo: locationInfo,
        loadStatus:0,
        companyUserInfo: await userModel.findOne({ _id: companyUserId }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1, companyInfo: 1 }),
        wareHouseId: wareHouseId,
        companyId: companyId,
        assignedBy: assignedBy,
        assignedTo: assignedTo,
      });
      await Job.updateOne({ _id: jobId }, { $set: { loadStatus:0 } });
    }
    const savedTask = await newTask.save();
    if (!jobInfo) {
      return res.status(404).json({ status: -3, message: commonFunction.translate('##job or location not found##', reqQuery.language) });
    }

    
    // Update package status to "Relocated"
    if (packageDetails && packageDetails.length > 0) {
      const packageIds = packageDetails.map((element) => element._id);
      const data = {
        status: 4, // Relocated
        taskInfo: {
          taskId: savedTask._id,
          type: 4,
          taskName: "Relocate Assigned",
          status: 1, // Use the status from the newly created task
        },
      };

      const packageUpdateResult = await Package.updateMany({ _id: { $in: packageIds } }, { $set: data });
      // // console.log("packageUpdateResult", packageUpdateResult);
    }

    // Create log entry for subtask assignment
    const userDetail = await userModel.findById(userId, {
      _id: 1,
      fullName: 1,
      email: 1,
      mobile: 1,
      countryCode: 1,
      country: 1,
      zipcode: 1,
      address: 1,
      state: 1,
      city: 1,
    });

    var dataDesc = 'A relocation task was assigned to' + userDetail.fullName + 'by' + assignedByUser.fullName;

    const subtaskLog = {
      description: dataDesc,


         
      status: 24, // taskAssigned status
      createdBy: userDetail.fullName,
      createdAt: new Date(),
    };

    await Job.updateOne({ _id: jobId }, { $push: { logs: subtaskLog, subtask: savedTask } });
    await Job.updateOne({ _id: jobId }, { $set: { statusInfo: subtaskLog } });

    if (user.deviceToken != undefined && user.deviceToken != "") {
      var dataValue = JSON.stringify({
        "to": user.deviceToken,
        "notification": {
          "title": "WMS",
          "body": "Relocate task assigned to you",
          "icon": "task assign to you",
          "sound": "default"
        },
        "data": {
          "message": {
            "title": "Wms",
            "message": "Relocate task assigned to you",
            "priority": 0,
            "status": 1
          }
        }
      });
      commonFunction.sendPushNotification(dataValue);
    }

    return res.status(200).json({ status: 1, message: commonFunction.translate('##success##', reqQuery.language), responseData: locationId === "" ? jobInfo.bayInfo : locationInfo, });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: -1, message: commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

/**
 * @swagger
 * /task/taskListByUser:
 *   post:
 *     summary: Get subtasks by user ID
 *     tags: [Task]
 *     description: "Status -1 => validation missing || Status 1 =>subtask list successfully"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubtaskListRequest'
 *     responses:
 *       200:
 *         description: Successful response
 *       400:
 *         description: Validation error
 *       404:
 *         description: No subtasks found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SubtaskListRequest:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           description: The ID of the user
 *       example:
 *         userId: "6491595a45c273046631b9f2"
 *
 *     SubtaskListResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: number
 *           description: The status code (1 for success)
 *         message:
 *           type: string
 *           description: The message corresponding to the status
 *         responseData:
 *           type: array
 *           description: The list of subtasks for the specified user
 *           items:
 *             $ref: '#/components/schemas/Subtask'
 *       example:
 *         status: 1
 *         message: Subtask list successfully
 *         responseData:
 *           - type: "Type A"
 *             note: "Lorem ipsum dolor sit amet"
 *             userId: "6491595a45c273046631b9f2"
 *             status: 1
 *           - type: "Type B"
 *             note: "Consectetur adipiscing elit"
 *             userId: "6491595a45c273046631b9f2"
 *             status: 1
 *
 *     Subtask:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           description: The type of subtask
 *         note:
 *           type: string
 *           description: Additional notes for the subtask
 *         userId:
 *           type: string
 *           description: The ID of the user associated with the subtask
 *         status:
 *           type: number
 *           description: The status of the subtask
 *       example:
 *         type: "Type A"
 *         note: "Lorem ipsum dolor sit amet"
 *         userId: "6491595a45c273046631b9f2"
 *         status: 1
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: number
 *           description: The status code (-2 for validation error, -1 for other errors)
 *         message:
 *           type: string
 *           description: The error message
 *       example:
 *         status: -2
 *         message: Validation error
 */

router.post('/taskListByUser', async (req, res) => {
  const reqQuery = req.query;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ status: -2, message: commonFunction.translate('##userId not found##', reqQuery.language) });
  }

  try {
    const subtasks = await Task.find({ userId });

    if (subtasks.length === 0) {
      return res.status(404).json({ status: -1, message: commonFunction.translate('##no subtasks found##', reqQuery.language) });
    }

    return res.status(200).json({ status: 1, message: commonFunction.translate('##subtask list successfully##', reqQuery.language), responseData: subtasks });
  } catch (error) {
    return res.status(500).json({ status: -1, message: commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});


//list
/**
* @swagger
* /task/list:
*   post:
*     summary: Get a list of tasks
*     tags:
*       - Task
*     description: "Status -1 => validation missing || Status 1 =>success"
*     responses:
*       '200':
*         description: Success response
*       '400':
*         description: Bad request
*       '500':
*         description: Internal server error
*
* @swagger
* components:
*   schemas:
*     TaskListResponse:
*       type: object
*       properties:
*         status:
*           type: number
*           description: The status code (1 for success)
*         message:
*           type: string
*           description: The message corresponding to the status
*         responseData:
*           type: array
*           description: The list of tasks
*           items:
*             $ref: '#/components/schemas/Task'
*       example:
*         status: 1
*         message: Success
*         responseData:
*           - id: "1"
*             name: "Task 1"
*             description: "Description of Task 1"
*           - id: "2"
*             name: "Task 2"
*             description: "Description of Task 2"
*
*     Task:
*       type: object
*       properties:
*         id:
*           type: string
*           description: The ID of the task
*         name:
*           type: string
*           description: The name of the task
*         description:
*           type: string
*           description: The description of the task
*       example:
*         id: "1"
*         name: "Task 1"
*         description: "Description of Task 1"
*
*     ErrorResponse:
*       type: object
*       properties:
*         status:
*           type: number
*           description: The status code (-2 for validation error, -1 for other errors)
*         message:
*           type: string
*           description: The error message
*       example:
*         status: -2
*         message: Validation error
*/


router.post('/list', async (req, res) => {
  const reqQuery = req.query;
  try {
    const task = await Task.find({});
    if (!task) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##task not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), 'responseData': task });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});


router.post('/listTaskFilter', async (req, res) => {
  const reqQuery = req.query;
  try {
    const reqBody = req.body;
    var filter = {};
    if (reqBody.search != undefined && reqBody.search != "") {
      const searchRegex = new RegExp(reqBody.search, 'i');
      filter.$or = [
        { 'jobInfo.consignmentId': searchRegex },
        { 'jobInfo.clientDetail.name': searchRegex }
      ];
    }
    if (reqBody.status != undefined && reqBody.status != "") {
      filter.status = parseInt(reqBody.status);
    }
    if (reqBody.type != undefined && reqBody.type != "") {
      filter.type = parseInt(reqBody.type);
    }
    if (reqBody.equipmentName != undefined && reqBody.equipmentName != "") {
      filter['equipmentInfo.name'] = reqBody.equipmentName;
    }
    if (reqBody.userName != undefined && reqBody.userName != "") {
      filter['assignedTo.name'] = reqBody.userName;
    }
    if (reqBody.date != undefined && reqBody.date != "") {
      filter.date = reqBody.date;
    }
    // console.log("filter",filter);
    const task = await Task.find(filter).sort({ _id: -1 });
    const taskInfo = await Task.find({});


    // status count
    var yesToStartStatusCount = 0;
    var onGoingStatusCount = 0;
    var completedStatusCount = 0;

    // type count
    var putAwayTaskCount = 0;
    var sortTaskCount = 0;
    var assembleTaskCount = 0;
    var relocateTaskCount = 0;
    var unloadTaskCount = 0;
    var qATaskCount = 0;
    var repackageTaskCount = 0;
    var pickerTaskCount = 0;
    var loadTaskCount = 0;

    taskInfo.map((element) => {
      // console.log("element",element.type);
      if (element.status == 1) {
        yesToStartStatusCount += 1;
      } else if (element.status == 2) {
        onGoingStatusCount += 1;
      } else if (element.status == 3) {
        completedStatusCount += 1;
      }
      if (element.type == 1) {
        putAwayTaskCount += 1;
      } else if (element.type == 2) {
        sortTaskCount += 1;
      } else if (element.type == 3) {
        assembleTaskCount += 1;
      } else if (element.type == 4) {
        relocateTaskCount += 1;
      } else if (element.type == 5) {
        unloadTaskCount += 1;
      } else if (element.type == 6) {
        qATaskCount += 1;
      } else if (element.type == 7) {
        repackageTaskCount += 1;
      } else if (element.type == 8) {
        pickerTaskCount += 1;
      } else if (element.type == 9) {
        loadTaskCount += 1;
      }
    });
    var statusCount = {
      yesToStartStatusCount: yesToStartStatusCount,
      onGoingStatusCount: onGoingStatusCount,
      completedStatusCount: completedStatusCount
    }
    var typeCount = {
      putAwayTaskCount: putAwayTaskCount,
      sortTaskCount: sortTaskCount,
      assembleTaskCount: assembleTaskCount,
      relocateTaskCount: relocateTaskCount,
      unloadTaskCount: unloadTaskCount,
      qATaskCount: qATaskCount,
      repackageTaskCount: repackageTaskCount,
      pickerTaskCount: pickerTaskCount,
      loadTaskCount: loadTaskCount
    }
    var statusCount = {
      yesToStartStatusCount: yesToStartStatusCount,
      onGoingStatusCount: onGoingStatusCount,
      completedStatusCount: completedStatusCount
    }

    if (!task) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##task not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), 'taskCount': taskInfo.length, 'statusCount': statusCount, 'typeCount': typeCount, 'responseData': task });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

//getById

/**
 * @swagger
 * /task/getById:
 *   post:
 *     summary: Get a task by ID
 *     tags:
 *       - Task
 *     description: "Status -1 => validation error || Status -2 => task not found || Status 1 => success"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskByIdRequest'
 *     responses:
 *       '200':
 *         description: Success response
 *       '400':
 *         description: Bad request
 *       '404':
 *         description: Task not found
 *       '500':
 *         description: Internal server error
 *
 * @swagger
 * components:
 *   schemas:
 *     TaskByIdRequest:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The ID of the task
 *       example:
 *         _id: "6491595a45c273046631b9f2"
 *
 *     TaskByIdResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: number
 *           description: The status code (1 for success)
 *         message:
 *           type: string
 *           description: The message corresponding to the status
 *         responseData:
 *           $ref: '#/components/schemas/Task'
 *       example:
 *         status: 1
 *         message: Success
 *         responseData:
 *           id: "1"
 *           name: "Task 1"
 *           description: "Description of Task 1"
 *
 *     Task:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The ID of the task
 *         name:
 *           type: string
 *           description: The name of the task
 *         description:
 *           type: string
 *           description: The description of the task
 *       example:
 *         id: "1"
 *         name: "Task 1"
 *         description: "Description of Task 1"
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: number
 *           description: The status code (-2 for task not found, -1 for other errors)
 *         message:
 *           type: string
 *           description: The error message
 *       example:
 *         status: -2
 *         message: Task not found
 */



router.post('/getById', async (req, res) => {
  const reqQuery = req.query;
  try {
    if (!req.body._id) return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##validation error##', reqQuery.language) });
    const task = await Task.findOne({ _id: req.body._id });

    if (!task) {
      return res.status(404).json({ 'status': -2, 'message': commonFunction.translate('##equipment not found##', reqQuery.language) });
    }
    let subtaskName = { "1": "Put away", "2": "Sort", "3": "Assemble", "4": "Relocate", "5": "Unload", "6": "QA", "7": "Repackage", "8": "Picker", "9": "Pack", "10": "Load", "11": "Cross Docking" };

    // Get the equipmentInfo based on the userId
    const user = await userModel.findOne({ _id: task.userId });

    if (!user) {
      return res.status(404).json({ 'status': -2, 'message': commonFunction.translate('##user not found##', reqQuery.language) });
    }

    // Modify the task object to include equipmentInfo
    const responseData = {
      ...task.toObject(),
      taskName: subtaskName[task.type],
      equipmentInfo: user.equipmentInfo,// Add equipmentInfo from the user,
      equipmentInfo: task.equipmentInfo
    };

    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), responseData: responseData });

  } catch (error) {
    // console.log(error)
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});


// router.post('/addSkuToCart', async (req, res) => {
//   const reqQuery = req.query;
//   console.log("cameeeee")
//   try {
//     let userId = req.body.userId;
//     // await Cart.deleteMany({ userId: userId });

//     const cartData = await Cart.findOne({ userId: userId });

//     // Create a new cart entry with the packageDetails
//     console.log("cartData", cartData)
//     if (!cartData) {
//       const newCart = new Cart({
//         userId: userId,
//         packageInfo: req.body.skuDetails
//       });
//       await newCart.save();
//       console.log("newCart", newCart)
//     } else {

//       console.log("newCart", cartData._id)
//       await Cart.updateOne(
//         { _id: cartData._id },
//         {
//           $push: { packageInfo: req.body.skuDetails }
//         }
//       );

//     }

//     // const taskUpdate = await Task.updateOne({_id:,"jobInfo.skuDetails._id": req.body.skuDetails._id}, { $set: { cartStatus: true } });



//     // if (!user) {
//     //   return res.status(404).json({ 'status': -2, 'message': commonFunction.translate('##user not found##', reqQuery.language) });
//     // }




//     return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), responseData: cartData });

//   } catch (error) {
//     console.log(error)
//     return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
//   }
// });




router.post('/addSkuToCartcopy', async (req, res) => {
  const reqQuery = req.query;
  console.log("cameeeee");
  try {
    const userId = req.body.userId;
    const skuId = req.body.skuDetails; // Assuming this is the ID of the skuDetails document in the task collection

    // Find the skuDetails document in the task collection
    const task = await Task.findOne({ "jobInfo.skuDetails._id": skuId });

    if (!task) {
      return res.status(404).json({ 'status': -2, 'message': 'SkuDetails not found' });
    }

    // Extract the skuDetails object
    let skuDetails = null;
    for (const sku of task.jobInfo.skuDetails) {
      if (sku._id.toString() === skuId) {
        skuDetails = sku;
        break;
      }
    }

    if (!skuDetails) {
      return res.status(404).json({ 'status': -2, 'message': 'SkuDetails not found' });
    }

    // Find the cart document
    let cartData = await Cart.findOne({ userId: userId });

    if (!cartData) {
      cartData = new Cart({
        userId: userId,
        packageInfo: [{ ...skuDetails, _id: mongoose.Types.ObjectId(skuDetails._id), cartStatus: 1 }]
      });
      await cartData.save();
    } else {
      // Check if skuDetails with the same ID already exists in packageInfo
      const skuExists = cartData.packageInfo.some(item => item._id.toString() === skuId);

      if (skuExists) {
        return res.status(200).json({ 'status': -1, 'message': 'Package is already added to the cart' });
      }

      // Push skuDetails into packageInfo and update cartStatus to 1
      cartData.packageInfo.push({ ...skuDetails, _id: new mongoose.Types.ObjectId(skuDetails._id), cartStatus: 1 });
      await cartData.save();
    }

    return res.status(200).json({ 'status': 1, 'message': 'Success', responseData: cartData });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ 'status': -1, 'message': 'Internal server error' });
  }
});



router.post('/addSkuToCart', async (req, res) => {
  const reqQuery = req.query;
  console.log("cameeeee");
  try {
    const userId = req.body.userId;
    const skuId = req.body.skuDetails; // Assuming this is the ID of the skuDetails document in the task collection

    // Find the skuDetails document in the task collection
    const task = await Task.findOne({ "jobInfo.skuDetails._id": skuId });

    if (!task) {
      return res.status(404).json({ 'status': -2, 'message': 'SkuDetails not found' });
    }

    // Extract the skuDetails object
    let skuDetails = null;
    for (const sku of task.jobInfo.skuDetails) {
      if (sku._id.toString() === skuId) {
        skuDetails = sku;
        break;
      }
    }

    if (!skuDetails) {
      return res.status(404).json({ 'status': -2, 'message': 'SkuDetails not found' });
    }

    // Find the cart document
    let cartData = await Cart.findOne({ userId: userId });

    if (!cartData) {
      cartData = new Cart({
        userId: userId,
        packageInfo: [{ ...skuDetails, _id: mongoose.Types.ObjectId(skuDetails._id), cartStatus: 1 }] // Convert _id to ObjectId and set cartStatus to 1
      });
      await cartData.save();
    } else {
      // Check if skuDetails with the same ID already exists in packageInfo
      const skuExists = cartData.packageInfo.some(item => item._id.toString() === skuId);

      if (skuExists) {
        return res.status(200).json({ 'status': 0, 'message': 'Package is already added to the cart' });
      }

      // Push skuDetails into packageInfo and update cartStatus to 1
      cartData.packageInfo.push({ ...skuDetails, _id: new mongoose.Types.ObjectId(skuDetails._id), cartStatus: 1 });
      await cartData.save();
    }

    // Update the cartStatus in the task collection
    const taskUpdate = await Task.updateOne(
      { "jobInfo.skuDetails._id": skuId },
      { $set: { "jobInfo.skuDetails.$.cartStatus": 1 } }
    );

    return res.status(200).json({ 'status': 1, 'message': 'Success', responseData: cartData });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ 'status': -1, 'message': 'Internal server error' });
  }
});


// router.post('/completePickup', async (req, res) => {
//   const reqQuery = req.query;
//   console.log("cameeeee")
//   try {
//     let userId = req.body.userId;
//     let skuID = req.body.skuID;
//     let locationInfo = req.body.locationInfo;
//     // await Cart.deleteMany({ userId: userId });

//     const cartData = await Cart.findOne({ userId: userId });
//     let skuDetail = {}
//     console.log("cartData", cartData)
//     let packageDetails = cartData.packageInfo;
//     for (let i = 0; i < packageDetails.length; i++) {
//       console.log("packageDetails", packageDetails[i]._id)
//       if (packageDetails[i]._id === skuID) {
//         skuDetail = packageDetails[i];
//       }
//     }

//     console.log("skuDetail._id", skuDetail._id);
//     let existingCount = await Package.findOne({ "_id": skuDetail._id }).select({ "approvedProductCount": 1, "qrCode": 1, "consignmentId": 1, "jobId": 1, "wareHouseId": 1, "companyId": 1 });
//     // console.log("existingCount", skuDetail, "----", existingCount.approvedProductCount)

//     // let package = await Package.findOneAndUpdate({ _id: skuDetail });
//     // console.log("existingCount", existingCount);
//     const updatePackage = await Package.findOneAndUpdate(
//       { _id: skuDetail._id },
//       { approvedProductCount: existingCount.approvedProductCount - parseInt(skuDetail.toBeOutbound) },
//     );


//     const newPackage = new Package({
//       materialCode: skuDetail.materialCode,
//       type: "Free Style",
//       productCount: skuDetail.toBeOutbound,
//       approvedProductCount: skuDetail.toBeOutbound,
//       consumedProductCount: skuDetail.toBeOutbound,
//       status: 1,
//       locationInfo: locationInfo,
//       existingCount: existingCount.qrCode,
//       consignmentId: existingCount.consignmentId,
//       jobId: existingCount.jobId,
//       wareHouseId: existingCount.wareHouseId,
//       companyId: existingCount.companyId
//     });

//     var savePackage = await newPackage.save();
//     let stringdata = JSON.stringify({ packageId: savePackage._id });
//     var packageId = savePackage._id;
//     var consignmentId = existingCount.consignmentId;
//     // Converting the data into base64
//     QRCode.toDataURL(stringdata, async function (err, code) {
//       if (err) return // console.log("error occurred")

//       // Printing the code
//       var matches = code.match(/^data:([A-Za-z-+/]+);base64,(.+)$/),
//         response = {};

//       if (matches.length !== 3) {
//         return new Error('Invalid input string');
//       }
//       response.type = matches[1];
//       response.data = Buffer.from(matches[2], 'base64');
//       let decodedImg = response;
//       let imageBuffer = decodedImg.data;
//       let fileName = packageId + "_Package_QR.jpeg";
//       try {
//         fs.writeFileSync("./public/inbound/" + consignmentId + "/" + fileName, imageBuffer, 'utf8');
//         const updatePackage = await Package.updateOne({ _id: packageId }, { $set: { qrCode: "inbound/" + consignmentId + "/" + fileName } });
//         // // console.log("updatePackage", updatePackage);
//       } catch (e) {
//         // console.log(e);
//       }
//     });

//     // {locationInfo:locationInfo}

//     const cartToRemove = await Cart.findOneAndUpdate(
//       { userId: userId },
//       { $pull: { packageInfo: { _id: skuDetail._id } } }
//     );



//     return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), responseData: skuDetail });

//   } catch (error) {
//     console.log(error)
//     return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
//   }
// });




//taskListByDate


// router.post('/taskListByDate', async (req, res) => {
//   const reqQuery = req.query;
//   try {
//     const { date, userId, } = req.body;
//     if (!date || !userId) {
//       return res.status(400).json({ status: -1, message: commonFunction.translate('##validation error##', reqQuery.language) });
//     }

//     const [yetToStartCount, ongoingCount, completedCount] = await Promise.all([
//       Task.countDocuments({ date, userId: new mongoose.Types.ObjectId(userId), status: 1 }),
//       Task.countDocuments({ date, userId: new mongoose.Types.ObjectId(userId), status: 2 }),
//       Task.countDocuments({ date, userId: new mongoose.Types.ObjectId(userId), status: 3 })
//     ]);

//     const reqBody = req.body;
//     var filter = {};
//     if (reqBody.search != undefined && reqBody.search != "") {
//       const searchRegex = new RegExp(reqBody.search, 'i');
//       filter.$or = [
//         { 'jobInfo.consignmentId': searchRegex },
//         { 'jobInfo.clientDetail.name': searchRegex }
//       ];
//     }
//     if (reqBody.status != undefined && reqBody.status != "") {
//       filter.status = parseInt(reqBody.status);
//     }
//     if (reqBody.userId != undefined && reqBody.userId != "") {
//       filter.userId = new mongoose.Types.ObjectId(userId)
//     }
//     if (reqBody.date != undefined && reqBody.date != "") {
//       filter.date = reqBody.date;
//     }
//     // console.log("filter",filter);

//     const taskList = await Task.find(filter);

//     const subtaskName = {
//       "0": "-",
//       "1": "Put away",
//       "2": "Sort",
//       "3": "Assemble",
//       "4": "Relocate",
//       "5": "Unload",
//       "6": "QA",
//       "7": "Repackage",
//       "8": "Picker",
//       "9": "Load",
//       "10": "Cross Docking",
//       "11": "Pack"
//     };

//     const subtaskList = taskList.map((data) => {
//       let newData = data;
//       // console.log("data.type",data.type);
//       newData.taskName = subtaskName[data.type ? data.type : 0].toString();

//       // console.log("datatype", newData.taskName)
//       // newData.itemDetail = data.packageDetails.map((datas) => datas.msku).toString();
//       return newData;
//     });

//     // Fetch bayInfo from the Job collection based on userId and date
//     const job = await Job.findOne({ date, userId: new mongoose.Types.ObjectId(userId) });

//     const response = {
//       status: 1,
//       message: commonFunction.translate('##success##', reqQuery.language),
//       // taskList:subtaskList 
//       responseData: {
//         countList: {
//           yetToStart: yetToStartCount,
//           ongoing: ongoingCount,
//           completed: completedCount
//         },
//         date: date,
//         bayInfo: job ? job.bayInfo : null,
//         taskList: subtaskList
//       }
//     };


//     return res.status(200).json(response);

//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({ status: -1, message: commonFunction.translate('##internal server error##', reqQuery.language) });
//   }
// });




router.post('/completePickupCopy', async (req, res) => {
  const reqQuery = req.query;
  console.log("cameeeee")
  try {
    let userId = req.body.userId;
    let skuID = req.body.skuID;
    let locationInfo = req.body.locationInfo;
    // await Cart.deleteMany({ userId: userId });

    const cartData = await Cart.findOne({ userId: userId });
    let skuDetail = null; // Initialize skuDetail as null
    console.log("cartData", cartData)
    let packageDetails = cartData.packageInfo;
    for (let i = 0; i < packageDetails.length; i++) {
      console.log("packageDetails", packageDetails[i]._id)
      if (packageDetails[i]._id.toString() === skuID) { // Convert skuID to string for comparison
        skuDetail = packageDetails[i];
        break; // Exit the loop once skuDetail is found
      }
    }

    if (!skuDetail) {
      return res.status(404).json({ 'status': -2, 'message': 'SKU not found' });
    }



    console.log("skuDetail._id", skuDetail._id);
    let existingCount = await Package.findOne({ "_id": skuDetail._id }).select({ "approvedProductCount": 1, "qrCode": 1, "consignmentId": 1, "jobId": 1, "wareHouseId": 1, "companyId": 1 });
    // console.log("existingCount", skuDetail, "----", existingCount.approvedProductCount)

    // let package = await Package.findOneAndUpdate({ _id: skuDetail });
    // console.log("existingCount", existingCount);
    const updatePackage = await Package.findOneAndUpdate(
      { _id: skuDetail._id },
      { approvedProductCount: existingCount.approvedProductCount - parseInt(skuDetail.toBeOutbound) },
    );


    const newPackage = new Package({
      materialCode: skuDetail.materialCode,
      type: "Free Style",
      productCount: skuDetail.toBeOutbound,
      approvedProductCount: skuDetail.toBeOutbound,
      consumedProductCount: skuDetail.toBeOutbound,
      status: 1,
      locationInfo: locationInfo,
      existingCount: existingCount.qrCode,
      consignmentId: existingCount.consignmentId,
      jobId: existingCount.jobId,
      wareHouseId: existingCount.wareHouseId,
      companyId: existingCount.companyId
    });

    var savePackage = await newPackage.save();
    let stringdata = JSON.stringify({ packageId: savePackage._id });
    var packageId = savePackage._id;
    var consignmentId = existingCount.consignmentId;
    // Converting the data into base64
    QRCode.toDataURL(stringdata, async function (err, code) {
      if (err) return // console.log("error occurred")

      // Printing the code
      var matches = code.match(/^data:([A-Za-z-+/]+);base64,(.+)$/),
        response = {};

      if (matches.length !== 3) {
        return new Error('Invalid input string');
      }
      response.type = matches[1];
      response.data = Buffer.from(matches[2], 'base64');
      let decodedImg = response;
      let imageBuffer = decodedImg.data;
      let fileName = packageId + "_Package_QR.jpeg";
      try {
        fs.writeFileSync("./public/inbound/" + consignmentId + "/" + fileName, imageBuffer, 'utf8');
        const updatePackage = await Package.updateOne({ _id: packageId }, { $set: { qrCode: "inbound/" + consignmentId + "/" + fileName } });
        // // console.log("updatePackage", updatePackage);
      } catch (e) {
        // console.log(e);
      }
    });

    // {locationInfo:locationInfo}

    const cartToRemove = await Cart.findOneAndUpdate(
      { userId: userId },
      { $pull: { packageInfo: { _id: skuDetail._id } } }
    );



    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), responseData: skuDetail });

  } catch (error) {
    console.log(error)
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});


router.post('/completePickup', async (req, res) => {
  const reqQuery = req.query;
  console.log("cameeeee")
  try {
    let userId = req.body.userId;
    let skuID = req.body.skuID;
    let locationInfo = req.body.locationInfo;
    // await Cart.deleteMany({ userId: userId });

    const cartData = await Cart.findOne({ userId: userId });
    let skuDetail = null; // Initialize skuDetail as null
    console.log("cartData", cartData)
    let packageDetails = cartData.packageInfo;
    for (let i = 0; i < packageDetails.length; i++) {
      console.log("packageDetails", packageDetails[i]._id)
      if (packageDetails[i]._id.toString() === skuID) { // Convert skuID to string for comparison
        skuDetail = packageDetails[i];
        break; // Exit the loop once skuDetail is found
      }
    }

    if (!skuDetail) {
      return res.status(404).json({ 'status': -2, 'message': 'SKU not found' });
    }



    console.log("skuDetail._id", skuDetail._id);
    let existingCount = await Package.findOne({ "_id": skuDetail._id }).select({ "approvedProductCount": 1, "qrCode": 1, "consignmentId": 1, "jobId": 1, "wareHouseId": 1, "companyId": 1 });
    // console.log("existingCount", skuDetail, "----", existingCount.approvedProductCount)

    // let package = await Package.findOneAndUpdate({ _id: skuDetail });
    // console.log("existingCount", existingCount);


     // Update the status of the task to 3 (completed)
     const taskId = req.body.taskId;
     if (taskId) {
       const updatedTask = await Task.findByIdAndUpdate(
         taskId,
         { $set: { status: 3 } },
         { new: true }
       );
 
       if (!updatedTask) {
         return res.status(404).json({ 'status': -2, 'message': 'Task not found or not updated' });
       }
     } else {
       return res.status(404).json({ 'status': -2, 'message': 'TaskId not found in skuDetail' });
     }
  // Update the user's status to 0 in the user collection
  const updatedUser = await userModel.findByIdAndUpdate(
    userId,
    { $set: { status: 0 } },
    { new: true }
  );

  if (!updatedUser) {
    return res.status(404).json({ 'status': -2, 'message': 'User not found or not updated' });
  }


    const updatePackage = await Package.findOneAndUpdate(
      { _id: skuDetail._id },
      { approvedProductCount: existingCount.approvedProductCount - parseInt(skuDetail.toBeOutbound) },
    );


    const newPackage = new Package({
      materialCode: skuDetail.materialCode,
      type: "Free Style",
      productCount: skuDetail.toBeOutbound,
      approvedProductCount: skuDetail.toBeOutbound,
      consumedProductCount: skuDetail.toBeOutbound,
      status: 1,
      locationInfo: locationInfo,
      existingCount: existingCount.qrCode,
      consignmentId: existingCount.consignmentId,
      jobId: existingCount.jobId,
      wareHouseId: existingCount.wareHouseId,
      companyId: existingCount.companyId
    });

    var savePackage = await newPackage.save();
    let stringdata = JSON.stringify({ packageId: savePackage._id });
    var packageId = savePackage._id;
    var consignmentId = existingCount.consignmentId;
    // Converting the data into base64
    QRCode.toDataURL(stringdata, async function (err, code) {
      if (err) return // console.log("error occurred")

      // Printing the code
      var matches = code.match(/^data:([A-Za-z-+/]+);base64,(.+)$/),
        response = {};

      if (matches.length !== 3) {
        return new Error('Invalid input string');
      }
      response.type = matches[1];
      response.data = Buffer.from(matches[2], 'base64');
      let decodedImg = response;
      let imageBuffer = decodedImg.data;
      let fileName = packageId + "_Package_QR.jpeg";
      try {
        fs.writeFileSync("./public/inbound/" + consignmentId + "/" + fileName, imageBuffer, 'utf8');
        const updatePackage = await Package.updateOne({ _id: packageId }, { $set: { qrCode: "inbound/" + consignmentId + "/" + fileName } });
        // // console.log("updatePackage", updatePackage);
      } catch (e) {
        // console.log(e);
      }
    });

    // {locationInfo:locationInfo}

    const cartToRemove = await Cart.findOneAndUpdate(
      { userId: userId },
      { $pull: { packageInfo: { _id: skuDetail._id } } }
    );



    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), responseData: skuDetail });

  } catch (error) {
    console.log(error)
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});






router.post('/taskListByDate', async (req, res) => {
  const reqQuery = req.query;
  try {
    const { date, userId, type } = req.body;
    if (!date || !userId) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##validation error##', reqQuery.language) });
    }

    const [yetToStartCount, ongoingCount, completedCount] = await Promise.all([
      Task.countDocuments({ date, userId: new mongoose.Types.ObjectId(userId), status: 1 }),
      Task.countDocuments({ date, userId: new mongoose.Types.ObjectId(userId), status: 2 }),
      Task.countDocuments({ date, userId: new mongoose.Types.ObjectId(userId), status: 3 })
    ]);

    const reqBody = req.body;
    var filter = {};
    if (reqBody.search != undefined && reqBody.search != "") {
      const searchRegex = new RegExp(reqBody.search, 'i');
      filter.$or = [
        { 'jobInfo.consignmentId': searchRegex },
        { 'jobInfo.clientDetail.name': searchRegex }
      ];
    }
    if (reqBody.status != undefined && reqBody.status != "") {
      filter.status = parseInt(reqBody.status);
    }
    if (reqBody.userId != undefined && reqBody.userId != "") {
      filter.userId = new mongoose.Types.ObjectId(userId)
    }
    if (reqBody.date != undefined && reqBody.date != "") {
      filter.date = reqBody.date;
    }

    if (type !== undefined && type !== "") {
      filter.type = parseInt(type);
    }
    // console.log("filter",filter);

    const taskList = await Task.find(filter);

    // const subtaskName = {
    //   "0": "-",
    //   "1": "Put away",
    //   "2": "Sort",
    //   "3": "Assemble",
    //   "4": "Relocate",
    //   "5": "Unload",
    //   "6": "QA",
    //   "7": "Repackage",
    //   "8": "Picker",
    //   "9": "Pack",
    //   "10": "Load",
    //   "11": "Cross-Docking"
    // };
    const subtaskName = { "1": "Put away", "2": "Sort", "3": "Assemble", "4": "Relocate", "5": "Unload", "6": "QA", "7": "Repackage", "8": "Picker", "9": "Pack", "10": "Load" };

    const subtaskList = taskList.map((data) => {
      let newData = data;
      console.log("data.type",data.type);
      newData.taskName = subtaskName[data.type ? data.type : 0].toString();

      // console.log("datatype", newData.taskName)
      // newData.itemDetail = data.packageDetails.map((datas) => datas.msku).toString();
      return newData;
    });

    // Fetch bayInfo from the Job collection based on userId and date
    const job = await Job.findOne({ date, userId: new mongoose.Types.ObjectId(userId) });

    const response = {
      status: 1,
      message: commonFunction.translate('##success##', reqQuery.language),
      // taskList:subtaskList 
      responseData: {
        countList: {
          yetToStart: yetToStartCount,
          ongoing: ongoingCount,
          completed: completedCount
        },
        date: date,
        bayInfo: job ? job.bayInfo : null,
        taskList: subtaskList
      }
    };


    return res.status(200).json(response);

  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: -1, message: commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});


router.post('/packageList', async (req, res) => {
  const reqQuery = req.query;
  try {

    const task = await Task.findById(req.body._id).select({ "packageDetails": 1, "type": 1, "locationInfo": 1 });
    // console.log("task", task);
    let packageIdArray = task.packageDetails.map((data) => {
      return data._id
    })

    // console.log("packageIdArray", packageIdArray)
    let packageList = []
    if (task.type === 5) {
      packageList = task.packageDetails
      // locationInfo = task.locationInfo
    } else {
      // console.log("packageIdArray",packageIdArray);
      packageList = await Package.find(
        { _id: { $in: packageIdArray } },

      );
    }
    // console.log("packageList", packageList)

    if (!task) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##Task not found##', reqQuery.language) });
    }
    console.log("packageList", packageList)
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), 'responseData': packageList });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});



/**
 * @swagger
 * /task/completedTask:
 *   post:
 *     summary: Complete Task
 *     tags: [Task]
 *     description: Marks a task as completed and updates the status of associated equipment and job
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               taskId:
 *                 type: string
 *                 description: The ID of the task to be marked as completed
 *               userId:
 *                 type: string
 *                 description: The ID of the user associated with the task
 *             example:
 *               taskId: "646dbd11b92af816b9de3e68"
 *               userId: "646dbc9e4cd7fe1b30d4e7e7"
 *     responses:
 *       200:
 *         description: Task completed successfully
 *       400:
 *         description: Bad request or task completion failed
 *       500:
 *         description: Internal server error
 */


router.post('/completedTask', async (req, res) => {
  const reqQuery = req.query;
  try {
    const reqBody = req.body;
    const taskInfo = await Task.findOne({ '_id': reqBody.taskId });
    if (!taskInfo) {
      return res.status(400).json({ status: -1, message: 'task not found' });
    }
    // // console.log("taskInfo",taskInfo);
    if (taskInfo.equipmentInfo == undefined) {
      return res.status(400).json({ status: -2, message: 'equipment not found' });
    }
    var equipmentId = taskInfo.equipmentInfo._id;
    var jobId = taskInfo.jobInfo._id;
    const equipmentInfo = await equipment.findOne({ '_id': taskInfo.equipmentInfo._id }, { type: 1, name: 1, manufacturer: 1, serialNumber: 1, purchaseDate: 1, purchasePrice: 1, condition: 1, location: 1, model: 1, notes: 1, status: 1 });
    if (!equipmentInfo) {
      return res.status(400).json({ status: -3, message: 'equipment not found' });
    }
    // // console.log("taskInfo", jobId);
    const jobInfo = await Job.findOne({ '_id': jobId });
    if (!jobInfo) {
      return res.status(400).json({ status: -4, message: 'job not found' });
    }
    if (taskInfo.status == 1) {
      return res.status(400).json({ status: -6, message: 'task not start' });
    } else if (taskInfo.status == 3) {
      return res.status(400).json({ status: -7, message: 'task already completed' });
    }

    if (taskInfo.status == 2) {
      var updateTask = await Task.updateOne({ _id: reqBody.taskId }, { $set: { status: 3 } }); // 3-> task completed
      var updateEqu = await equipment.updateOne({ _id: equipmentId }, { $set: { status: 0 } }); // 0-> equipment free

      // Remove equipmentId from equipmentInfo array in the user collection
      const updateUser = await userModel.updateOne({ _id: reqBody.userId }, { $pull: { "equipmentInfo": { "_id": equipmentId } } });
      if (!updateUser.modifiedCount) {
        return res.status(400).json({ status: -8, message: 'Failed to update user equipment info' });
      }
    }


    const equipmentLog = await EquipmentLog.create({
      userId: reqBody.userId,
      taskId: reqBody.taskId,
      equipmentId: equipmentId,
      status: 0, // 0: free equipment
      createdAt: new Date(),
    });
    if (req.body.createdBy == undefined) {
      var userDetail = await userModel.findOne({}, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 }
      );
    } else {
      var userDetail = await userModel.findOne({ _id: createdBy }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 }
      );
    }
    // const userDetail = await userModel.find({ /* role: 3 */ }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 });

    if (userDetail.length == 0) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##user not found##', reqQuery.language) });
    }
    var dataDesc = 'A task was completed by' + createdBy

    newLog = {
      description: dataDesc,
      status: 15,//putAway task completed
      createdBy: userDetail.fullName,
      createdAt: new Date(),
    };
    await Job.updateOne({ _id: jobInfo._id }, { $push: { logs: newLog } });
    return res.status(400).json({ status: 1, message: 'Task Completed Successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: -1, message: 'Internal server error' });
  }
});


router.post('/markCompleteTask', async (req, res) => {
  const reqQuery = req.query;
  try {
    const reqBody = req.body;
    const taskInfo = await Task.findOne({ '_id': reqBody.taskId });
    if (!taskInfo) {
      return res.status(400).json({ status: -1, message: 'task not found' });
    }

    // Check if the task is already completed
    if (taskInfo.status === 3) {
      return res.status(400).json({ status: -7, message: 'task already completed' });
    }

    // // Check if the task is not started
    // if (taskInfo.status === 1) {
    //   return res.status(400).json({ status: -6, message: 'task not started' });
    // }

    // Determine the new status based on markAsCompleted
    let newStatus = 3;
    // if (reqBody.markAsCompleted) {
    //   newStatus = 3; // Set the task status to 3 (completed)
    // } else {
    //   newStatus = 2; // Set the task status to 2 (in progress)
    // }

    // Update the task status
    const updateTask = await Task.updateOne({ _id: reqBody.taskId }, { $set: { status: newStatus } });

    // Check if the task was updated successfully
    if (updateTask.nModified === 0) {
      return res.status(400).json({ status: -9, message: 'Failed to update task status' });
    }

    // Update equipment status and remove equipmentId from the user's equipmentInfo array
    if (newStatus === 3) {
      const equipmentId = taskInfo.equipmentInfo._id;
      const updateEqu = await equipment.updateOne({ _id: equipmentId }, { $set: { status: 0 } }); // 0 -> equipment free

      if (updateEqu.nModified === 0) {
        return res.status(400).json({ status: -10, message: 'Failed to update equipment status' });
      }

      const updateUser = await userModel.updateOne({ _id: reqBody.userId }, { $pull: { "equipmentInfo": { "_id": equipmentId } } });

      if (updateUser.nModified === 0) {
        return res.status(400).json({ status: -8, message: 'Failed to update user equipment info' });
      }
    }


    // Create a new equipment log
    const equipmentLog = await EquipmentLog.create({
      userId: reqBody.userId,
      taskId: reqBody.taskId,
      equipmentId: taskInfo.equipmentInfo._id,
      status: newStatus === 3 ? 0 : 1, // 0: free equipment, 1: equipment in use
      createdAt: new Date(),
    });
    if (req.body.createdBy == undefined) {
      var userDetail = await userModel.findOne({}, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 }
      );
    } else {
      var userDetail = await userModel.findOne({ _id: createdBy }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 }
      );
    }
    // const userDetail = await userModel.find({ /* role: 3 */ }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 });

    if (userDetail.length == 0) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##user not found##', reqQuery.language) });
    }
    var dataDesc = 'A task was completed by' + createdBy
    // Create a new job log for the task completion
    if (newStatus === 3) {
      const newLog = {
        description: dataDesc,
        status: 13,
        createdBy: userDetail.fullName, // You may replace this with the actual user who completed the task
        createdAt: new Date(),
      };
      await Job.updateOne({ _id: taskInfo.jobInfo._id }, { $push: { logs: newLog } });
    }

    return res.status(200).json({ status: 1, message: 'Task Completed Successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: -1, message: 'Internal server error' });
  }
});

async function completeTask(jobId, taskId) {
  try {
    // console.log('Updating task collection...');
    // console.log('jobId:', jobId);
    // console.log('taskId:', taskId);

    // Update task collection
    const updateResult = await Task.updateOne(
      { "_id": taskId, 'jobInfo._id': new mongoose.Types.ObjectId(jobId) },
      { $set: { status: 3 } }
    );
    // console.log('Task update result:', updateResult);

    // Get the user and equipment IDs from the task
    const task = await Task.findOne({ _id: taskId });
    const userId = task.userInfo._id;
    const equipmentId = task.equipmentInfo._id;

    // Update user collection
    await userModel.updateMany({ _id: userId }, { $set: { status: 0 } });

    // Update equipment collection
    await equipment.updateMany({ _id: equipmentId }, { $set: { status: 0 } });

    // Update package collection
    await Package.updateMany({ jobId: jobId }, { $set: { status: 0 } });

    // Update job collection
    await Job.updateOne({ _id: jobId }, { $set: { status: 8 } });

    const equipmentLogData = {
      userId: userId,
      taskId: taskId,
      equipmentId: equipmentId,
      status: 0,
    };
    const equipmentLog = new EquipmentLog(equipmentLogData);
    await equipmentLog.save();

    // console.log('Task completed and collections updated successfully.');
  } catch (err) {
    console.error('Error completing the task and updating collections:', err);
    throw err; // Rethrow the error to be handled in the route
  }
}

// Define the POST route
router.post('/markAsComplete', async (req, res) => {
  const { jobId, taskId } = req.body;

  try {
    await completeTask(jobId, taskId);
    res.status(200).json({ message: 'Task completed and collections updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Error completing the task and updating collections.' });
  }
});

async function storeOnBin(selectedBinArray) {


  const uniqueRacks = [...new Set(selectedBinArray.map(data => data.rackId))];
  const uniqueShelf = [...new Set(selectedBinArray.map(data => data.shelfId))];

  // console.log("unique", uniqueRacks, "---", uniqueShelf)

  await Bin.updateMany(
    { _id: { $in: selectedBinArray } },
    {
      $set: { status: 3 }
      /* $push: { taskInfo: taskInfo }, */
    }
  );
  uniqueRacks.forEach(result => {
    console.log('Rack Id:', result);
    calculatePercentageOfRack(result)
  });
  uniqueShelf.forEach(result => {
    console.log('Shelf Id:', result);
    calculatePercentageOfShelf(result)
  });
}






async function releaseBin(selectedBinArray) {


  const uniqueRacks = [...new Set(selectedBinArray.map(data => data.rackId))];
  const uniqueShelf = [...new Set(selectedBinArray.map(data => data.shelfId))];

  console.log("unique", uniqueRacks, "---", uniqueShelf)

  await Bin.updateMany(
    { _id: { $in: selectedBinArray } },
    {
      $set: { status: 1, packageDetail: [] }

      /* $push: { taskInfo: taskInfo }, */
    }
  );
  uniqueRacks.forEach(result => {
    console.log('Rack Id:', result);
    calculatePercentageOfRack(result)
  });
  uniqueShelf.forEach(result => {
    console.log('Shelf Id:', result);
    calculatePercentageOfShelf(result)
  });

}


async function calculatePercentageOfRack(rackId) {


  const occupiedBin = await Bin.countDocuments({ 'rackId': rackId, 'status': 3 });
  const totalBin = await Bin.countDocuments({ 'rackId': rackId });

  const occupiedPercentage = (occupiedBin / totalBin) * 100;
  console.log("rackId", rackId, "---", occupiedPercentage, "---occupiedBin", occupiedBin, "==", totalBin)

  await Rack.updateOne({ _id: rackId }, { occupiedPercentage: occupiedPercentage })
  return occupiedPercentage;
}
async function calculatePercentageOfShelf(shelfId) {


  const occupiedBin = await Bin.countDocuments({ 'shelfId': shelfId, 'status': 3 });
  const totalBin = await Bin.countDocuments({ 'shelfId': shelfId });

  const occupiedPercentage = (occupiedBin / totalBin) * 100;

  console.log("shelfId", shelfId, "---", occupiedPercentage, "---occupiedBin", occupiedBin, "==", totalBin)

  await Shelf.updateOne({ _id: shelfId }, { occupiedPercentage: occupiedPercentage })
  return occupiedPercentage;
}





// router.post('/taskCompleteCopy', async (req, res) => {
//   try {
//     const reqBody = req.body;

//     const packageDetail = await Package.findOne({ "_id": reqBody.packageId });
//     if (!packageDetail) return res.status(404).json({ status: -1, message: 'Package not found' });

//     const taskDetail = await Task.findOne({ "_id": reqBody.taskId });
//     if (!taskDetail) return res.status(404).json({ status: -1, message: 'Task not found' });

//     if (!reqBody.type) return res.status(400).json({ "status": -1, message: "Validation error" });

//     // const userDetail = await userModel.findOne({}, { _id: 1, fullName: 1 });
//     if (req.body.createdBy == undefined) {
//       var userDetail = await userModel.findOne({}, { _id: 1, fullName: 1 }
//       );
//     } else {
//       var userDetail = await userModel.findOne({ _id: createdBy }, { _id: 1, fullName: 1 }
//       );
//     }

//     if (reqBody.type >= 1 && reqBody.type <= 5) {
//       const taskInfo = await Task.findOne({ '_id': packageDetail.taskInfo.taskId });
//       if (!taskInfo) {
//         return res.status(400).json({ status: -2, message: "Task information not found" });
//       }

//       if (taskInfo.locationInfo != undefined) {
//         // console.log("taskInfo.locationInfo._id", taskInfo.locationInfo._id);
//         // console.log("reqBody.locationId", reqBody.locationId);
//         if ((taskInfo.locationInfo._id).toString() !== (new mongoose.Types.ObjectId(reqBody.locationId)).toString()) {
//           return res.status(400).json({ status: -2, message: "Information Mismatched please check" });
//         }

//         const locationInfo = await locationModel.findOne({ "_id": taskInfo.locationInfo._id });
//         if (!locationInfo) return res.status(400).json({ status: -2, message: "Location information not found" });

//         await Package.updateOne({ "_id": reqBody.packageId }, {
//           $set: {
//             locationInfo: locationInfo
//           }
//         });
//       }
//     }
//     // Find the index of the package within packageDetails array
//     const packageIndex = taskDetail.packageDetails.findIndex(pkg => pkg._id.toString() == reqBody.packageId);
//     if (packageIndex == -1) return res.status(404).json({ status: -1, message: 'Package not found in task' });

//     // Update the status of the specific package within packageDetails array
//     taskDetail.packageDetails[packageIndex].status = 3;

//     // Save the updated task details
//     await taskDetail.save();

//     if (reqBody.type == 1) {
//       await storeOnBin(taskDetail.packageDetails[0].selectedBin);
//     }
//     var jobInfo = await Job.findOne({ "_id": packageDetail.jobId })

//     const subtaskName = { "1": "Put away", "2": "Sort", "3": "Assemble", "4": "Relocate", "5": "Unload", "6": "QA", "7": "Repackage", "8": "Picker", "9": "Load", "10": "Pack" };





//     if (reqBody.type == 6) {
//       if (!reqBody.approvedProductCount || !reqBody.rejectA || !reqBody.rejectB || !reqBody.rejectC) {
//         return res.status(400).json({ status: -1, message: "Validation error for QA type" });
//       }

//       const newLog = {
//         description: 'test',
//         status: 29,
//         createdBy: userDetail.fullName,
//         rejected: {
//           rejectedA: reqBody.rejectA,
//           rejectedB: reqBody.rejectB,
//           rejectedC: reqBody.rejectC
//         },
//         createdAt: new Date(),
//       };
//       newLog.rejectedCount = reqBody.rejectA + reqBody.rejectB + reqBody.rejectC;


//       const rejectedImages = [];

//       if (reqBody.rejectA.image) {
//         commonFunction.moveToSingleImage(reqBody.rejectA.image, taskDetail.jobInfo.consignmentId);
//         rejectedImages.push(reqBody.rejectA.image);
//       }
//       if (reqBody.rejectB.image) {
//         commonFunction.moveToSingleImage(reqBody.rejectB.image, taskDetail.jobInfo.consignmentId);
//         rejectedImages.push(reqBody.rejectB.image);
//       }
//       if (reqBody.rejectC.image) {
//         commonFunction.moveToSingleImage(reqBody.rejectC.image, taskDetail.jobInfo.consignmentId);
//         rejectedImages.push(reqBody.rejectC.image);
//       }
//       // console.log('result',rejectedImages)

//       // Push moved images to documents.inbound.qaRejected array
//       await Job.updateOne({ "_id": packageDetail.jobId }, {
//         $push: {
//           "documents.inbound.qaRejected": { $each: rejectedImages.filter(image => image) }
//         }
//       });
//       const taskName = subtaskName[reqBody.type] || ""; // Use "Unknown Task" as a fallback if the type is not found in the mapping

//       await Package.updateOne({ "_id": reqBody.packageId }, {
//         $set: {
//           taskInfo: {
//             taskId: packageDetail.taskInfo.taskId,
//             type: packageDetail.taskInfo.type,
//             // taskName: packageDetail.taskInfo.typeName,
//             taskName: taskName,
//             status: 3
//           },
//           status: 3,
//           approvedProductCount: reqBody.approvedProductCount,
//           rejectedA: reqBody.rejectA,
//           rejectedB: reqBody.rejectB,
//           rejectedC: reqBody.rejectC
//         }
//       });
//       await userModel.updateOne({ _id: reqBody.userId }, { $unset: { equipmentInfo: 1 } });

//       if (jobInfo.clientDetail != undefined && jobInfo.clientDetail.email != undefined) {
//         const transporter = nodemailer.createTransport({
//           service: 'gmail',
//           auth: {
//             user: process.env.EMAILID,
//             pass: process.env.PASSWORD,
//           },
//         });
//         // jobInfo.clientDetail.email
//         const mailOptions = {
//           from: process.env.EMAILID,
//           to: jobInfo.clientDetail.email,
//           subject: 'Report For Quality Assurance',
//           text: `ConsignmentID - ${jobInfo.consignmentId},\n\n Approved Product Count - ${reqBody.approvedProductCount},\n Rejected A - ${reqBody.rejectA.count},\n Rejected B - ${reqBody.rejectB.count},\n Rejected C - ${reqBody.rejectC.count}`
//         };

//         transporter.sendMail(mailOptions, (error, info) => {
//           if (error) {
//             console.error('Error sending email:', error);
//             return res.status(500).json({ status: -1, message: 'Failed to send email' });
//           } else {
//             console.log('Email sent:', info.response);
//             return res.status(200).json({ status: 1, message: 'User created successfully' });
//           }
//         });
//         const newLog = {
//           description: `ConsignmentID - ${jobInfo.consignmentId},\n\n Approved Product Count - ${reqBody.approvedProductCount},\n Rejected A - ${reqBody.rejectA.count},\n Rejected B - ${reqBody.rejectB.count},\n Rejected C - ${reqBody.rejectC.count}`,
//           status: 29,
//           createdBy: userDetail.fullName,
//           createdAt: new Date(),
//         };

//         await Job.updateOne({ "_id": packageDetail.jobId }, {
//           $push: {
//             logs: newLog
//           }
//         });
//       }
//     } else {
//       const logStatusMap = {
//         1: 17,
//         2: 20,
//         3: 23,
//         4: 26,
//         5: 30,
//         6: 29,
//         7: 33,
//         8: 36,
//         9: 39
//       };

//       const logStatus = logStatusMap[reqBody.type];

//       const newLog = {
//         description: 'test',
//         status: logStatus,
//         createdBy: userDetail.fullName,
//         createdAt: new Date(),
//       };



//       if (reqBody.type == 1) {
//         await storeOnBin(taskDetail.packageDetails[0].selectedBin);

//         // Change the main status of the job collection to 7 (or the desired status)
//         await Job.updateOne({ _id: packageDetail.jobId }, {
//           $set: {
//             status: 7,
//             "statusInfo.status": 7,
//             "statusInfo.createdBy": userDetail.fullName,
//             "statusInfo.createdAt": new Date(),
//           }
//         });
//       }

//     }

//     const taskName = subtaskName[reqBody.type] || ""; // Use "Unknown Task" as a fallback if the type is not found in the mapping


//     await Package.updateOne({ "_id": reqBody.packageId }, {
//       $set: {
//         taskInfo: {
//           taskId: packageDetail.taskInfo.taskId,
//           type: packageDetail.taskInfo.type,
//           // taskName: packageDetail.taskInfo.typeName,
//           taskName: taskName,
//           status: 3
//         }
//       }
//     });

//     // const task = await Task.findOne({ _id: reqBody.taskId });
//     const taskDetails = await Task.findOne({ "_id": reqBody.taskId });
//     if (!taskDetails) return res.status(404).json({ status: -1, message: 'Task not found' });

//     let gateStatus;


//     if (!taskDetails || !taskDetails.jobInfo || taskDetails.type !== 9) {
//       gateStatus = 0; // Task not related to job type 9
//     } else if (taskDetails.status == 3) {
//       gateStatus = 1; // (completed)
//     } else {
//       gateStatus = 0; // (not completed)
//     }

//     // const cartToRemove = await Cart.findOneAndUpdate(
//     //   { userId: reqBody.userId },
//     //   { $pull: { packageInfo: { _id: new mongoose.Types.ObjectId(reqBody.packageId) } } }
//     // );
//     const cartToRemove = await Cart.deleteMany({ userId: reqBody.userId });

//     const bayIdToUpdate = taskDetail.bayInfo._id;
//     if (bayIdToUpdate != undefined) {
//       myObjectIdString = bayIdToUpdate.toString();
//       const updatedJob = await Bay.findByIdAndUpdate({ _id: myObjectIdString }, { $set: { status: 1 } }, { new: true });
//     }




//     const task = await Task.findOne({ _id: reqBody.taskId });
//     if (!task) {
//       return res.status(404).json({ status: -1, message: 'Task not found' });
//     }

//     if (task.equipmentInfo != undefined && task.equipmentInfo != null) {
//       const equipmentId = task.equipmentInfo._id;

//       const updateResult = await equipment.updateOne({ _id: equipmentId }, { $set: { status: 0 } });

//       if (updateResult.nModified === 1) {
//         const equipmentLogData = {
//           userId: reqBody.userId,
//           taskId: reqBody.taskId,
//           equipmentId: equipmentId,
//           status: 0,
//         };
//         const equipmentLog = new EquipmentLog(equipmentLogData);
//         await equipmentLog.save();
//       } else {
//         // // console.log("Equipment status update failed");
//       }

//       await userModel.updateOne(
//         { _id: reqBody.userId },
//         { $set: { equipmentInfo: [], status: 0 } }
//       );
//     }

//     await Task.updateOne(
//       { _id: reqBody.taskId },
//       { $set: { status: 3 } }
//     );

//     if (reqBody.type == 9) {
//       // Generate a GRN number
//       const grnNumber = Math.floor(1000 + Math.random() * 9000);


//       const taskId = reqBody.taskId;


//       const taskInfo = await Task.findOne({ "_id": taskId }, { "jobInfo._id": 1 });
//       if (!taskInfo || !taskInfo.jobInfo || !taskInfo.jobInfo._id) {
//         return res.status(400).json({ status: -1, message: 'JobId not found for the provided taskId' });
//       }

//       const jobId = taskInfo.jobInfo._id;

//       // Create the grnInfo object
//       const grnInfo = {
//         no: grnNumber,
//         generatedBy: reqBody.userId,
//         generatedAt: new Date()
//       };


//       const jobResult = await Job.updateOne(
//         { "_id": jobId },
//         {
//           $set: {
//             grnInfo: grnInfo,
//             loadStatus: 1,
//             gateStatus: 2
//           }
//         }
//       );
//       console.log("jobResult:", jobResult);

//       // } else {

//       //   return res.status(400).json({ status: -1, message: 'Type is not 9. GRN not generated.' });
//       // }
//     }

//     return res.status(200).json({ status: 1, message: 'Task completed and collections updated successfully.', gateStatus });
//   } catch (err) {
//     console.log(err);
//     return res.status(500).json({ status: -1, message: 'Internal server error' });
//   }
// });


router.post('/taskCompleteCopy', async (req, res) => {
  try {
    const reqBody = req.body;

    const packageDetail = await Package.findOne({ "_id": reqBody.packageId });
    if (!packageDetail) return res.status(404).json({ status: -1, message: 'Package not found' });

    const taskDetail = await Task.findOne({ "_id": reqBody.taskId });
    if (!taskDetail) return res.status(404).json({ status: -1, message: 'Task not found' });

    if (!reqBody.type) return res.status(400).json({ "status": -1, message: "Validation error" });

    // const userDetail = await userModel.findOne({}, { _id: 1, fullName: 1 });
    if (req.body.createdBy == undefined) {
      var userDetail = await userModel.findOne({}, { _id: 1, fullName: 1 }
      );
    } else {
      var userDetail = await userModel.findOne({ _id: createdBy }, { _id: 1, fullName: 1 }
      );
    }

    if (reqBody.type >= 1 && reqBody.type <= 5) {
      const taskInfo = await Task.findOne({ '_id': packageDetail.taskInfo.taskId });
      if (!taskInfo) {
        return res.status(400).json({ status: -2, message: "Task information not found" });
      }

      if (taskInfo.locationInfo != undefined) {
        // console.log("taskInfo.locationInfo._id", taskInfo.locationInfo._id);
        // console.log("reqBody.locationId", reqBody.locationId);
        if ((taskInfo.locationInfo._id).toString() !== (new mongoose.Types.ObjectId(reqBody.locationId)).toString()) {
          return res.status(400).json({ status: -2, message: "Information Mismatched please check" });
        }

        const locationInfo = await locationModel.findOne({ "_id": taskInfo.locationInfo._id });
        if (!locationInfo) return res.status(400).json({ status: -2, message: "Location information not found" });

        await Package.updateOne({ "_id": reqBody.packageId }, {
          $set: {
            locationInfo: locationInfo
          }
        });
      }
    }
    // Find the index of the package within packageDetails array
    const packageIndex = taskDetail.packageDetails.findIndex(pkg => pkg._id.toString() == reqBody.packageId);
    if (packageIndex == -1) return res.status(404).json({ status: -1, message: 'Package not found in task' });

    // Update the status of the specific package within packageDetails array
    taskDetail.packageDetails[packageIndex].status = 3;

    // Save the updated task details
    await taskDetail.save();

    if (reqBody.type == 1) {
      await storeOnBin(taskDetail.packageDetails[0].selectedBin);
    }
    var jobInfo = await Job.findOne({ "_id": packageDetail.jobId })

    // const subtaskName = { "1": "Put away", "2": "Sort", "3": "Assemble", "4": "Relocate", "5": "Unload", "6": "QA", "7": "Repackage", "8": "Picker", "9": "Load", "10": "Pack" };

    const subtaskName = { "1": "Put away", "2": "Sort", "3": "Assemble", "4": "Relocate", "5": "Unload", "6": "QA", "7": "Repackage", "8": "Picker", "9": "Pack", "10": "Load" };




    if (reqBody.type == 6) {
      if (!reqBody.approvedProductCount || !reqBody.rejectA || !reqBody.rejectB || !reqBody.rejectC) {
        return res.status(400).json({ status: -1, message: "Validation error for QA type" });
      }

      const newLog = {
        description: 'test',
        status: 29,
        createdBy: userDetail.fullName,
        rejected: {
          rejectedA: reqBody.rejectA,
          rejectedB: reqBody.rejectB,
          rejectedC: reqBody.rejectC
        },
        createdAt: new Date(),
      };
      newLog.rejectedCount = reqBody.rejectA + reqBody.rejectB + reqBody.rejectC;


      const rejectedImages = [];

      if (reqBody.rejectA.image) {
        commonFunction.moveToSingleImage(reqBody.rejectA.image, taskDetail.jobInfo.consignmentId);
        rejectedImages.push(reqBody.rejectA.image);
      }
      if (reqBody.rejectB.image) {
        commonFunction.moveToSingleImage(reqBody.rejectB.image, taskDetail.jobInfo.consignmentId);
        rejectedImages.push(reqBody.rejectB.image);
      }
      if (reqBody.rejectC.image) {
        commonFunction.moveToSingleImage(reqBody.rejectC.image, taskDetail.jobInfo.consignmentId);
        rejectedImages.push(reqBody.rejectC.image);
      }
      // console.log('result',rejectedImages)

      // Push moved images to documents.inbound.qaRejected array
      await Job.updateOne({ "_id": packageDetail.jobId }, {
        $push: {
          "documents.inbound.qaRejected": { $each: rejectedImages.filter(image => image) }
        }
      });
      const taskName = subtaskName[reqBody.type] || ""; 
      
      await Package.updateOne({ "_id": reqBody.packageId }, {
        $set: {
          taskInfo: {
            taskId: packageDetail.taskInfo.taskId,
            type: packageDetail.taskInfo.type,
            // taskName: packageDetail.taskInfo.typeName,
            taskName: taskName,
            status: 3
          },
          status: 3,
          approvedProductCount: reqBody.approvedProductCount,
          rejectedA: reqBody.rejectA,
          rejectedB: reqBody.rejectB,
          rejectedC: reqBody.rejectC
        }
      });
      await userModel.updateOne({ _id: reqBody.userId }, { $unset: { equipmentInfo: 1 } });

      if (jobInfo.clientDetail != undefined && jobInfo.clientDetail.email != undefined) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAILID,
            pass: process.env.PASSWORD,
          },
        });
        // jobInfo.clientDetail.email
        const mailOptions = {
          from: process.env.EMAILID,
          to: jobInfo.clientDetail.email,
          subject: 'Report For Quality Assurance',
          text: `ConsignmentID - ${jobInfo.consignmentId},\n\n Approved Product Count - ${reqBody.approvedProductCount},\n Rejected A - ${reqBody.rejectA.count},\n Rejected B - ${reqBody.rejectB.count},\n Rejected C - ${reqBody.rejectC.count}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ status: -1, message: 'Failed to send email' });
          } else {
            console.log('Email sent:', info.response);
            return res.status(200).json({ status: 1, message: 'User created successfully' });
          }
        });
        const newLog = {
          description: `ConsignmentID - ${jobInfo.consignmentId},\n\n Approved Product Count - ${reqBody.approvedProductCount},\n Rejected A - ${reqBody.rejectA.count},\n Rejected B - ${reqBody.rejectB.count},\n Rejected C - ${reqBody.rejectC.count}`,
          status: 29,
          createdBy: userDetail.fullName,
          createdAt: new Date(),
        };

        await Job.updateOne({ "_id": packageDetail.jobId }, {
          $push: {
            logs: newLog
          }
        });
      }
    } else {
      const logStatusMap = {
        1: 17,
        2: 20,
        3: 23,
        4: 26,
        5: 30,
        6: 29,
        7: 33,
        8: 36,
        9: 39
      };

      const logStatus = logStatusMap[reqBody.type];

      const newLog = {
        description: 'test',
        status: logStatus,
        createdBy: userDetail.fullName,
        createdAt: new Date(),
      };



      // if (reqBody.type == 1) {
      //   await storeOnBin(taskDetail.packageDetails[0].selectedBin);

      //   // Change the main status of the job collection to 7 (or the desired status)
      //   await Job.updateOne({ _id: packageDetail.jobId }, {
      //     $set: {
      //       status: 7,
      //       "statusInfo.status": 7,
      //       "statusInfo.createdBy": userDetail.fullName,
      //       "statusInfo.createdAt": new Date(),
      //     }
      //   });
      // }

    }

    const taskName = subtaskName[reqBody.type] || ""; // Use "Unknown Task" as a fallback if the type is not found in the mapping


    await Package.updateOne({ "_id": reqBody.packageId }, {
      $set: {
        taskInfo: {
          taskId: packageDetail.taskInfo.taskId,
          type: packageDetail.taskInfo.type,
          // taskName: packageDetail.taskInfo.typeName,
          taskName: taskName,
          status: 3
        }
      }
    });

    // const task = await Task.findOne({ _id: reqBody.taskId });
    const taskDetails = await Task.findOne({ "_id": reqBody.taskId });
    if (!taskDetails) return res.status(404).json({ status: -1, message: 'Task not found' });

    let gateStatus;


    if (!taskDetails || !taskDetails.jobInfo || taskDetails.type !== 9) {
      gateStatus = 0; // Task not related to job type 9
    } else if (taskDetails.status == 3) {
      gateStatus = 1; // (completed)
    } else {
      gateStatus = 0; // (not completed)
    }

    // const cartToRemove = await Cart.findOneAndUpdate(
    //   { userId: reqBody.userId },
    //   { $pull: { packageInfo: { _id: new mongoose.Types.ObjectId(reqBody.packageId) } } }
    // );
    const cartToRemove = await Cart.deleteMany({ userId: reqBody.userId });

    const bayIdToUpdate = taskDetail.bayInfo._id;
    if (bayIdToUpdate != undefined) {
      myObjectIdString = bayIdToUpdate.toString();
      const updatedJob = await Bay.findByIdAndUpdate({ _id: myObjectIdString }, { $set: { status: 1 } }, { new: true });
    }




    const task = await Task.findOne({ _id: reqBody.taskId });
    if (!task) {
      return res.status(404).json({ status: -1, message: 'Task not found' });
    }

    if (task.equipmentInfo != undefined && task.equipmentInfo != null) {
      const equipmentId = task.equipmentInfo._id;

      const updateResult = await equipment.updateOne({ _id: equipmentId }, { $set: { status: 0 } });

      if (updateResult.nModified === 1) {
        const equipmentLogData = {
          userId: reqBody.userId,
          taskId: reqBody.taskId,
          equipmentId: equipmentId,
          status: 0,
        };
        const equipmentLog = new EquipmentLog(equipmentLogData);
        await equipmentLog.save();
      } else {
        // // console.log("Equipment status update failed");
      }

      await userModel.updateOne(
        { _id: reqBody.userId },
        { $set: { equipmentInfo: [], status: 0 } }
      );
    }

    await Task.updateOne(
      { _id: reqBody.taskId },
      { $set: { status: 3 } }
    );

    if (reqBody.type == 10) {
      // Generate a GRN number
      const grnNumber = Math.floor(1000 + Math.random() * 9000);

      const taskId = reqBody.taskId;

      const taskInfo = await Task.findOne({ "_id": taskId }, { "jobInfo._id": 1 });
      if (!taskInfo || !taskInfo.jobInfo || !taskInfo.jobInfo._id) {
        return res.status(400).json({ status: -1, message: 'JobId not found for the provided taskId' });
      }

      const jobId = taskInfo.jobInfo._id;

      // Create the grnInfo object
      const grnInfo = {
        no: grnNumber,
        generatedBy: reqBody.userId,
        generatedAt: new Date()
      };

      const jobResult = await Job.updateOne(
        { "_id": jobId },
        {
          $set: {
            grnInfo: grnInfo,
            loadStatus: 2,
            gateStatus: 2
          }
        }
      );
      console.log("jobResult:", jobResult);
    }
    console.log("reqBody.type", reqBody.type);
    console.log("packageDetail.jobId", packageDetail.jobId);
    if (reqBody.type === 5) {
      console.log("5");
      // If type is 5, update main status to 5
      var jobId = taskInfo.jobInfo._id;
      await Job.updateOne({ "_id": packageDetail.jobId }, {
        $set: {
          status: 5,//unload task complete
          "statusInfo.status": 5,
          "statusInfo.createdBy": userDetail.fullName,
          "statusInfo.createdAt": new Date(),
        }
      });
    } else if (reqBody.type === 1) {
      console.log("1");
      // If type is 1, update main status to 8
      await Job.updateOne({ "_id": packageDetail.jobId }, {
        $set: {
          status: 8,//task complete
          "statusInfo.status": 8,
          "statusInfo.createdBy": userDetail.fullName,
          "statusInfo.createdAt": new Date(),
        }
      });
    } else {
      console.log("else");
      // For other types, update main status to 7
      await Job.updateOne({ "_id": packageDetail.jobId }, {
        $set: {
          status: 7,//inbound Inprogress 
          "statusInfo.status": 7,
          "statusInfo.createdBy": userDetail.fullName,
          "statusInfo.createdAt": new Date(),
        }
      });
    }



    return res.status(200).json({ status: 1, message: 'Task completed and collections updated successfully.', gateStatus });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ status: -1, message: 'Internal server error' });
  }
});




router.post('/taskComplete', async (req, res) => {
  try {
    const reqBody = req.body;

    const packageDetail = await Package.findOne({ "_id": reqBody.packageId });
    if (!packageDetail) return res.status(404).json({ status: -1, message: 'Package not found' });

    const taskDetail = await Task.findOne({ "_id": reqBody.taskId });
    if (!taskDetail) return res.status(404).json({ status: -1, message: 'Task not found' });

    if (!reqBody.type) return res.status(400).json({ "status": -1, message: "Validation error" });

    // const userDetail = await userModel.findOne({}, { _id: 1, fullName: 1 });
    if (req.body.createdBy == undefined) {
      var userDetail = await userModel.findOne({}, { _id: 1, fullName: 1 }
      );
    } else {
      var userDetail = await userModel.findOne({ _id: createdBy }, { _id: 1, fullName: 1 }
      );
    }

   
    if (reqBody.type == 4 && reqBody.dockId) {
      // Check if dockId is provided in the request body
      const dockInfo = await bayModel.findOne({ "_id": reqBody.dockId });
      if (!dockInfo) return res.status(400).json({ status: -2, message: "Dock information not found" });

    
      // Update the bayInfo field in the Package collection
      await Package.updateOne({ "_id": reqBody.packageId }, {
        $set: {
          bayInfo: dockInfo
        }
      });
    } else if (reqBody.type >= 1 && reqBody.type <= 5) {
      const taskInfo = await Task.findOne({ '_id': packageDetail.taskInfo.taskId });
      if (!taskInfo) {
        return res.status(400).json({ status: -2, message: "Task information not found" });
      }

      if (taskInfo.locationInfo != undefined) {
        if ((taskInfo.locationInfo._id).toString() !== (new mongoose.Types.ObjectId(reqBody.locationId)).toString()) {
          return res.status(400).json({ status: -2, message: "Information Mismatched please check" });
        }

        const locationInfo = await locationModel.findOne({ "_id": taskInfo.locationInfo._id });
        if (!locationInfo) return res.status(400).json({ status: -2, message: "Location information not found" });

        await Package.updateOne({ "_id": reqBody.packageId }, {
          $set: {
            locationInfo: locationInfo
          }
        });
      }
    }
    // Find the index of the package within packageDetails array
    const packageIndex = taskDetail.packageDetails.findIndex(pkg => pkg._id.toString() == reqBody.packageId);
    if (packageIndex == -1) return res.status(404).json({ status: -1, message: 'Package not found in task' });

    // Update the status of the specific package within packageDetails array
    taskDetail.packageDetails[packageIndex].status = 3;

    // Save the updated task details
    await taskDetail.save();

    if (reqBody.type == 1) {
      await storeOnBin(taskDetail.packageDetails[0].selectedBin);
    }
    var jobInfo = await Job.findOne({ "_id": packageDetail.jobId })

    // const subtaskName = { "1": "Put away", "2": "Sort", "3": "Assemble", "4": "Relocate", "5": "Unload", "6": "QA", "7": "Repackage", "8": "Picker", "9": "Load", "10": "Pack" };

    const subtaskName = { "1": "Put away", "2": "Sort", "3": "Assemble", "4": "Relocate", "5": "Unload", "6": "QA", "7": "Repackage", "8": "Picker", "9": "Pack", "10": "Load" };




    if (reqBody.type == 6) {
      if (!reqBody.approvedProductCount || !reqBody.rejectA || !reqBody.rejectB || !reqBody.rejectC) {
        return res.status(400).json({ status: -1, message: "Validation error for QA type" });
      }

      const newLog = {
        description: 'test',
        status: 29,
        createdBy: userDetail.fullName,
        rejected: {
          rejectedA: reqBody.rejectA,
          rejectedB: reqBody.rejectB,
          rejectedC: reqBody.rejectC
        },
        createdAt: new Date(),
      };
      newLog.rejectedCount = reqBody.rejectA + reqBody.rejectB + reqBody.rejectC;


      const rejectedImages = [];

      if (reqBody.rejectA.image) {
        commonFunction.moveToSingleImage(reqBody.rejectA.image, taskDetail.jobInfo.consignmentId);
        rejectedImages.push(reqBody.rejectA.image);
      }
      if (reqBody.rejectB.image) {
        commonFunction.moveToSingleImage(reqBody.rejectB.image, taskDetail.jobInfo.consignmentId);
        rejectedImages.push(reqBody.rejectB.image);
      }
      if (reqBody.rejectC.image) {
        commonFunction.moveToSingleImage(reqBody.rejectC.image, taskDetail.jobInfo.consignmentId);
        rejectedImages.push(reqBody.rejectC.image);
      }
      // console.log('result',rejectedImages)

      // Push moved images to documents.inbound.qaRejected array
      await Job.updateOne({ "_id": packageDetail.jobId }, {
        $push: {
          "documents.inbound.qaRejected": { $each: rejectedImages.filter(image => image) }
        }
      });
      const taskName = subtaskName[reqBody.type] || ""; 
      
      await Package.updateOne({ "_id": reqBody.packageId }, {
        $set: {
          taskInfo: {
            taskId: packageDetail.taskInfo.taskId,
            type: packageDetail.taskInfo.type,
            // taskName: packageDetail.taskInfo.typeName,
            taskName: taskName,
            status: 3
          },
          status: 3,
          approvedProductCount: reqBody.approvedProductCount,
          rejectedA: reqBody.rejectA,
          rejectedB: reqBody.rejectB,
          rejectedC: reqBody.rejectC
        }
      });
      await userModel.updateOne({ _id: reqBody.userId }, { $unset: { equipmentInfo: 1 } });

      if (jobInfo.clientDetail != undefined && jobInfo.clientDetail.email != undefined) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAILID,
            pass: process.env.PASSWORD,
          },
        });
        // jobInfo.clientDetail.email
        const mailOptions = {
          from: process.env.EMAILID,
          to: jobInfo.clientDetail.email,
          subject: 'Report For Quality Assurance',
          text: `ConsignmentID - ${jobInfo.consignmentId},\n\n Approved Product Count - ${reqBody.approvedProductCount},\n Rejected A - ${reqBody.rejectA.count},\n Rejected B - ${reqBody.rejectB.count},\n Rejected C - ${reqBody.rejectC.count}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ status: -1, message: 'Failed to send email' });
          } else {
            console.log('Email sent:', info.response);
            return res.status(200).json({ status: 1, message: 'User created successfully' });
          }
        });
        const newLog = {
          description: `ConsignmentID - ${jobInfo.consignmentId},\n\n Approved Product Count - ${reqBody.approvedProductCount},\n Rejected A - ${reqBody.rejectA.count},\n Rejected B - ${reqBody.rejectB.count},\n Rejected C - ${reqBody.rejectC.count}`,
          status: 29,
          createdBy: userDetail.fullName,
          createdAt: new Date(),
        };

        await Job.updateOne({ "_id": packageDetail.jobId }, {
          $push: {
            logs: newLog
          }
        });
      }
    } else {
      const logStatusMap = {
        1: 17,
        2: 20,
        3: 23,
        4: 26,
        5: 30,
        6: 29,
        7: 33,
        8: 36,
        9: 39
      };

      const logStatus = logStatusMap[reqBody.type];

      const newLog = {
        description: 'test',
        status: logStatus,
        createdBy: userDetail.fullName,
        createdAt: new Date(),
      };



      // if (reqBody.type == 1) {
      //   await storeOnBin(taskDetail.packageDetails[0].selectedBin);

      //   // Change the main status of the job collection to 7 (or the desired status)
      //   await Job.updateOne({ _id: packageDetail.jobId }, {
      //     $set: {
      //       status: 7,
      //       "statusInfo.status": 7,
      //       "statusInfo.createdBy": userDetail.fullName,
      //       "statusInfo.createdAt": new Date(),
      //     }
      //   });
      // }

    }

    const taskName = subtaskName[reqBody.type] || ""; // Use "Unknown Task" as a fallback if the type is not found in the mapping


    await Package.updateOne({ "_id": reqBody.packageId }, {
      $set: {
        taskInfo: {
          taskId: packageDetail.taskInfo.taskId,
          type: packageDetail.taskInfo.type,
          // taskName: packageDetail.taskInfo.typeName,
          taskName: taskName,
          status: 3
        }
      }
    });

    // const task = await Task.findOne({ _id: reqBody.taskId });
    const taskDetails = await Task.findOne({ "_id": reqBody.taskId });
    if (!taskDetails) return res.status(404).json({ status: -1, message: 'Task not found' });

    let gateStatus;


    if (!taskDetails || !taskDetails.jobInfo || taskDetails.type !== 9) {
      gateStatus = 0; // Task not related to job type 9
    } else if (taskDetails.status == 3) {
      gateStatus = 1; // (completed)
    } else {
      gateStatus = 0; // (not completed)
    }

    // const cartToRemove = await Cart.findOneAndUpdate(
    //   { userId: reqBody.userId },
    //   { $pull: { packageInfo: { _id: new mongoose.Types.ObjectId(reqBody.packageId) } } }
    // );
    const cartToRemove = await Cart.deleteMany({ userId: reqBody.userId });

    const bayIdToUpdate = taskDetail.bayInfo._id;
    if (bayIdToUpdate != undefined) {
      myObjectIdString = bayIdToUpdate.toString();
      const updatedJob = await Bay.findByIdAndUpdate({ _id: myObjectIdString }, { $set: { status: 1 } }, { new: true });
    }




    const task = await Task.findOne({ _id: reqBody.taskId });
    if (!task) {
      return res.status(404).json({ status: -1, message: 'Task not found' });
    }

    if (task.equipmentInfo != undefined && task.equipmentInfo != null) {
      const equipmentId = task.equipmentInfo._id;

      const updateResult = await equipment.updateOne({ _id: equipmentId }, { $set: { status: 0 } });

      if (updateResult.nModified === 1) {
        const equipmentLogData = {
          userId: reqBody.userId,
          taskId: reqBody.taskId,
          equipmentId: equipmentId,
          status: 0,
        };
        const equipmentLog = new EquipmentLog(equipmentLogData);
        await equipmentLog.save();
      } else {
        // // console.log("Equipment status update failed");
      }

      await userModel.updateOne(
        { _id: reqBody.userId },
        { $set: { equipmentInfo: [], status: 0 } }
      );
    }

    await Task.updateOne(
      { _id: reqBody.taskId },
      { $set: { status: 3 } }
    );

    if (reqBody.type == 10) {
      // Generate a GRN number
      const grnNumber = Math.floor(1000 + Math.random() * 9000);

      const taskId = reqBody.taskId;

      const taskInfo = await Task.findOne({ "_id": taskId }, { "jobInfo._id": 1 });
      if (!taskInfo || !taskInfo.jobInfo || !taskInfo.jobInfo._id) {
        return res.status(400).json({ status: -1, message: 'JobId not found for the provided taskId' });
      }

      const jobId = taskInfo.jobInfo._id;

      // Create the grnInfo object
      const grnInfo = {
        no: grnNumber,
        generatedBy: reqBody.userId,
        generatedAt: new Date()
      };

      const jobResult = await Job.updateOne(
        { "_id": jobId },
        {
          $set: {
            grnInfo: grnInfo,
            loadStatus: 2,
            gateStatus: 2
          }
        }
      );
      console.log("jobResult:", jobResult);
    }
    console.log("reqBody.type", reqBody.type);
    console.log("packageDetail.jobId", packageDetail.jobId);
    if (reqBody.type === 5) {
      console.log("5");
      // If type is 5, update main status to 5
      var jobId = taskInfo.jobInfo._id;
      await Job.updateOne({ "_id": packageDetail.jobId }, {
        $set: {
          status: 5,//unload task complete
          "statusInfo.status": 5,
          "statusInfo.createdBy": userDetail.fullName,
          "statusInfo.createdAt": new Date(),
        }
      });
    } else if (reqBody.type === 1) {
      console.log("1");
      // If type is 1, update main status to 8
      await Job.updateOne({ "_id": packageDetail.jobId }, {
        $set: {
          status: 8,//task complete
          "statusInfo.status": 8,
          "statusInfo.createdBy": userDetail.fullName,
          "statusInfo.createdAt": new Date(),
        }
      });
    } else {
      console.log("else");
      // For other types, update main status to 7
      await Job.updateOne({ "_id": packageDetail.jobId }, {
        $set: {
          status: 7,//inbound Inprogress 
          "statusInfo.status": 7,
          "statusInfo.createdBy": userDetail.fullName,
          "statusInfo.createdAt": new Date(),
        }
      });
    }



    return res.status(200).json({ status: 1, message: 'Task completed and collections updated successfully.', gateStatus });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ status: -1, message: 'Internal server error' });
  }
});






router.post('/taskCompleteAllPackage', async (req, res) => {
  try {
    const reqBody = req.body;

    const taskDetail = await Task.findOne({ "_id": reqBody.taskId });
    if (!taskDetail) return res.status(404).json({ status: -1, message: 'Task not found' });

    const userDetail = await userModel.findOne({}, { _id: 1, fullName: 1 });
    const logStatusMap = {
      1: 17,
      2: 20,
      3: 23,
      4: 26,
      5: 29,
      6: 30,
      7: 33,
      8: 36
    };

    const logStatus = logStatusMap[reqBody.type];

    const newLog = {
      description: 'test',
      status: logStatus,
      createdBy: userDetail.fullName,
      createdAt: new Date(),
    };
    packageDetailArr = taskDetail.packageDetails.map(async (element) => {



      if (reqBody.type === 1) {

        let allBin = [...new Set(element.selectedBin.map(data => data.name))];
        console.log("allBin.toString", allBin.toString(), "------", element._id)
        await Package.updateOne({ _id: element._id }, { $set: { status: 3, "locationInfo.name": allBin.toString(), taskInfo: { taskId: reqBody.taskId, type: reqBody.type, taskName: '', status: 3 } } })


      } else {
        await Package.updateOne({ _id: element._id }, { $set: { status: 3, taskInfo: { taskId: reqBody.taskId, type: reqBody.type, taskName: '', status: 3 } } })

      }
    });
    // // console.log("packageDetailArr",packageIdArray);
    await Job.updateOne({ "_id": taskDetail.jobInfo._id }, {
      $push: {
        logs: newLog
      },
      $set: {
        status: 7,
        "statusInfo.status": 7,
        "statusInfo.createdBy": userDetail.fullName,
        "statusInfo.createdAt": new Date(),
      }
    });

    // if (reqBody.type >= 1 && reqBody.type <= 5) {
    //   const taskInfo = await Task.findOne({ '_id': packageDetail.taskInfo.taskId });
    //   if (!taskInfo) {
    //     return res.status(400).json({ status: -2, message: "Task information not found" });
    //   }

    //   if (taskInfo.locationInfo != undefined) {
    //     if ((taskInfo.locationInfo._id).toString() !== (new mongoose.Types.ObjectId(reqBody.locationId)).toString()) {
    //       return res.status(400).json({ status: -2, message: "Information Mismatched please check" });
    //     }

    //     const locationInfo = await locationModel.findOne({ "_id": taskInfo.locationInfo._id });
    //     if (!locationInfo) return res.status(400).json({ status: -2, message: "Location information not found" });

    //     await Package.updateOne({ "_id": reqBody.packageId }, {
    //       $set: {
    //         locationInfo: locationInfo
    //       }
    //     });
    //   }
    // }

    await Cart.deleteMany({ userId: reqBody.userId });

    const task = await Task.findOne({ _id: reqBody.taskId });
    if (!task) {
      return res.status(404).json({ status: -1, message: 'Task not found' });
    }

    if (task.equipmentInfo != undefined && task.equipmentInfo != null) {
      const equipmentId = task.equipmentInfo._id;

      const updateResult = await equipment.updateOne({ _id: equipmentId }, { $set: { status: 0 } });

      if (updateResult.nModified === 1) {
        const equipmentLogData = {
          userId: reqBody.userId,
          taskId: reqBody.taskId,
          equipmentId: equipmentId,
          status: 0,
        };
        const equipmentLog = new EquipmentLog(equipmentLogData);
        await equipmentLog.save();
      } else {
        // // console.log("Equipment status update failed");
      }

      await userModel.updateOne(
        { _id: reqBody.userId },
        { $set: { equipmentInfo: [], status: 0 } }
      );

      /* await Package.updateOne(
        { "_id": reqBody.packageId },
        { $set: { taskInfo: {} } }
      ); */
    }

    await Task.updateOne(
      { _id: reqBody.taskId },
      { $set: { status: 3 } }
    );
    await Bay.updateOne(
      { _id: reqBody.taskId },
      { $set: { status: 1 } }
    );

    if (taskDetail.type == 1) {
      await storeOnBin(taskDetail.packageDetails[0].selectedBin)
    }




    //  if (taskDetail.type == 8) {
    //   await releaseBin(taskDetail.packageDetails[0].selectedBin)
    // }


    return res.status(200).json({ status: 1, message: 'Task completed and collections updated successfully.' });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ status: -1, message: 'Internal server error' });
  }
});


router.post('/reassignTaskToUser', async (req, res) => {
  try {
    const { jobId, taskId, userId } = req.body;

    // Check if the user exists in the User collection and their status is 0 (free)
    const user = await userModel.findOne({ _id: userId, status: 0 });

    if (!user) {
      return res.status(404).json({ status: -2, message: 'User not found or user is not free' });
    }

    // Find the task based on the given jobId and taskId
    const task = await Task.findOne({ jobId, _id: taskId });

    if (!task) {
      return res.status(404).json({ status: -3, message: 'Task not found' });
    }

    // Check if the task status is not completed (status is not 2)
    if (task.status === 2) {
      return res.status(400).json({ status: -4, message: 'Task is already completed and cannot be reassigned' });
    }

    // Reassign the task to the new user (update the assignedTo field)
    task.assignedTo = userId;

    // Save the updated task
    await task.save();

    // console.log('Task reassigned successfully!');
    return res.status(200).json({ status: 1, message: 'Task reassigned successfully!' });
  } catch (error) {
    console.error('Error reassigning task:', error);
    return res.status(500).json({ status: -1, message: 'Internal server error' });
  }
});


router.post('/unloadTaskCompleteCopy', async (req, res) => {
  try {
    const reqBody = req.body;
    const taskId = req.body.taskId;

    if (!reqBody.id1) {
      return res.status(400).json({ "status": -1, message: "validation error" });
    }
    if (!reqBody.id2) {
      return res.status(400).json({ "status": -1, message: "validation error" });
    }


    const taskInfo = await Task.findOne({
      'jobInfo._id': new mongoose.Types.ObjectId(reqBody.id1),
      'locationInfo._id': new mongoose.Types.ObjectId(reqBody.id2)
    });

    if (taskInfo == null) {
      return res.status(400).json({ status: -2, message: "information mismatch please check" });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $set: { status: 3 } },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const jobInfo = await Job.findOne({ _id: reqBody.id1 });


    // // console.log("jobInfo---",jobInfo);
    if (!jobInfo) {
      return res.status(404).json({ status: -3, message: "Job info not found" });
    } else {

      console.log("unloadLocationInfo", reqBody.id1)
      await Job.findByIdAndUpdate(reqBody.id1,
        { $set: { unloadLocationInfo: taskInfo.locationInfo } },
        { new: true });
    }
    const task = await Task.findOne({ _id: taskId });
    if (!task) {
      return res.status(404).json({ status: -1, message: 'Task not found' });
    }

    if (task.equipmentInfo && task.equipmentInfo._id) {
      const equipmentId = task.equipmentInfo._id;
      myObjectIdString = equipmentId.toString();
      const updateResult = await equipment.findByIdAndUpdate(
        { _id: myObjectIdString },
        { $set: { status: 0 } },
        { new: true }
      );

      // if (task.equipmentInfo && task.equipmentInfo.equipmentId) {
      //   const equipmentId = task.equipmentInfo._id;
      //   const updateResult = await equipment.updateOne(
      //     { $set: { status: 0 } },
      //     );

      if (updateResult.nModified === 1) {
        // console.log('Equipment status updated to 0');
      } else {
        // console.log('Failed to update equipment status');
      }
    }

    const bayIdToUpdate = jobInfo.bayInfo._id;
    myObjectIdString = bayIdToUpdate.toString();
    const updatedJob = await Bay.findByIdAndUpdate({ _id: myObjectIdString }, { $set: { status: 1 } }, { new: true });


    await userModel.updateOne(
      { _id: reqBody.userId },
      { $set: { equipmentInfo: [], status: 0 } }
    );

    // const cartToRemove = await Cart.findOneAndUpdate(
    //   { userId: reqBody.userId },
    //   { $pull: { packageInfo: { _id: new mongoose.Types.ObjectId(reqBody.packageId) } } }
    // );

    // if (cartToRemove.packageInfo.length === 0) {
    //   await Cart.deleteMany({ userId: reqBody.userId });
    // }
    const cartToRemove = await Cart.deleteMany({ userId: reqBody.userId });

    for (const packageDetail of updatedTask.packageDetails) {
      if (packageDetail._id.toString() === reqBody.packageId) {
        await Package.updateOne(
          { "_id": packageDetail._id },
          { $set: { taskInfo: {} } }
        );
        break;
      }
    }

    console.log("reqBody.type", reqBody.type);
    console.log("packageDetail.jobId", packageDetail.jobId);
    if (reqBody.type === 5) {
      console.log("5");
      // If type is 5, update main status to 5
      var jobId = taskInfo.jobInfo._id;
      await Job.updateOne({ "_id": packageDetail.jobId }, {
        $set: {
          status: 5,//unload task complete
          "statusInfo.status": 5,
          "statusInfo.createdBy": userDetail.fullName,
          "statusInfo.createdAt": new Date(),
        }
      });
    } else if (reqBody.type === 1) {
      console.log("1");
      // If type is 1, update main status to 8
      await Job.updateOne({ "_id": packageDetail.jobId }, {
        $set: {
          status: 8,//task complete
          "statusInfo.status": 8,
          "statusInfo.createdBy": userDetail.fullName,
          "statusInfo.createdAt": new Date(),
        }
      });
    }

    return res.status(200).json({ status: 1, message: 'Task completed successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: -1, message: 'Internal server error' });
  }
});

router.post('/unloadTaskComplete', async (req, res) => {
  try {
    const reqBody = req.body;
    const taskId = req.body.taskId;

    // Statically set reqBody.type to 5
    reqBody.type = 5;

    // Validate id1 and id2
    if (!reqBody.id1 || !reqBody.id2) {
      return res.status(400).json({ "status": -1, message: "Validation error" });
    }

    // Find taskInfo based on id1 and id2
    const taskInfo = await Task.findOne({
      'jobInfo._id': new mongoose.Types.ObjectId(reqBody.id1),
      'locationInfo._id': new mongoose.Types.ObjectId(reqBody.id2)
    });

    if (!taskInfo) {
      return res.status(400).json({ status: -2, message: "Information mismatch, please check" });
    }

    // Update the task status
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $set: { status: 3 } },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Find jobInfo
    const jobInfo = await Job.findOne({ _id: reqBody.id1 });

    if (!jobInfo) {
      return res.status(404).json({ status: -3, message: "Job info not found" });
    }

    // Update unloadLocationInfo
    console.log("unloadLocationInfo", reqBody.id1);
    await Job.findByIdAndUpdate(reqBody.id1, { $set: { unloadLocationInfo: taskInfo.locationInfo } }, { new: true });

    // Update equipment status
    if (taskInfo.equipmentInfo && taskInfo.equipmentInfo._id) {
      const equipmentId = taskInfo.equipmentInfo._id;
      const equipmentObjectIdString = equipmentId.toString();
      const updateResult = await equipment.findByIdAndUpdate(
        equipmentObjectIdString,
        { $set: { status: 0 } },
        { new: true }
      );

      if (updateResult.nModified === 1) {
        // Equipment status updated to 0
      } else {
        // Failed to update equipment status
      }
    }

    // Update bay status
    const bayIdToUpdate = jobInfo.bayInfo._id;
    const bayObjectIdString = bayIdToUpdate.toString();
    await Bay.findByIdAndUpdate(bayObjectIdString, { $set: { status: 1 } }, { new: true });

    // Update user equipmentInfo and status
    await userModel.updateOne(
      { _id: reqBody.userId },
      { $set: { equipmentInfo: [], status: 0 } }
    );

    // Remove cart items
    const cartToRemove = await Cart.deleteMany({ userId: reqBody.userId });

    // Update package details
    for (const packageDetail of updatedTask.packageDetails) {
      if (packageDetail._id.toString() === reqBody.packageId) {
        await Package.updateOne(
          { "_id": packageDetail._id },
          { $set: { taskInfo: {} } }
        );
        break;
      }
    }

    // Find user detail based on createdBy or leave it undefined
    let userDetail;
    if (req.body.createdBy === undefined) {
      userDetail = await userModel.findOne({}, { _id: 1, fullName: 1 });
    } else {
      userDetail = await userModel.findOne({ _id: req.body.createdBy }, { _id: 1, fullName: 1 });
    }

    // Update job status based on reqBody.type
    let jobStatus;
    if (reqBody.type == 5) {
      console.log("5");
      // If type is 5, update main status to 5
      jobStatus = 5; // unload task complete
    } else if (reqBody.type == 1) {
      console.log("1");
      // If type is 1, update main status to 8
      jobStatus = 8; // task complete
    } else {
      console.log("Updating main status to 7 (Inbound In Progress)");

      jobStatus = 7;
    }

    const jobId = taskInfo.jobInfo._id;
    await Job.updateOne({ "_id": jobId }, {
      $set: {
        status: jobStatus,
        "statusInfo.status": jobStatus,
        "statusInfo.createdBy": userDetail ? userDetail.fullName : '',
        "statusInfo.createdAt": new Date(),
      }
    });

    return res.status(200).json({ status: 1, message: 'Task completed successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: -1, message: 'Internal server error' });
  }
});



router.post('/reassignTask', async (req, res) => {
  try {
    const { taskId, userId } = req.body;
    if (!taskId || !userId) {
      return res.status(400).json({ status: -1, message: "Invalid input data" });
    }

    // Find the user with the provided userId
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ status: -2, message: "User not found" });
    }

    // Check if the new taskId is different from the existing taskId in taskInfo object
    if (user.taskInfo && user.taskInfo._id && user.taskInfo._id.toString() !== taskId) {
      // The new taskId is different, remove the existing task from the taskInfo object
      user.taskInfo = undefined;
    }

    // Find the task with the given taskId from the Task collection
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ status: -3, message: "Task not found" });
    }

    // Reassign the new task to the user
    user.taskInfo = {
      _id: task._id,
      type: task.type,
      status: task.status,
    };

    // Save the updated user document
    await user.save();

    return res.status(200).json({ status: 1, message: "Task reassigned successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: -1, message: "Internal server error" });
  }
});


router.post('/startTaskCopy', async (req, res) => {
  const reqBody = req.body;

  try {
    const { type, taskId, userId } = reqBody;

    if (!type || !taskId || !userId) {
      return res.status(400).json({ 'status': -1, 'message': 'Invalid input data.' });
    }

    // Update task status to "inprogress"
    const taskInfo = await Task.findOne({ _id: taskId });
    const taskUserInfo = await Task.find({ userId: new mongoose.Types.ObjectId(userId), status: 2 });
    if (taskUserInfo.length != 0) {
      return res.status(400).json({ 'status': -3, 'message': 'User Already In Task' });
    }

    const equipmentInfo = taskInfo.equipmentInfo;

    const equipmentStatusInfo = await equipment.findOne({ _id: equipmentInfo._id });
    if (equipmentStatusInfo != null) {
      if (equipmentStatusInfo.status == 1) {
        return res.status(400).json({ 'status': -4, 'message': 'Equipment is already assigned, Please choose other equipment' });
      }
    }



    // // Get the equipment _id from the task's equipmentInfo
    // const equipmentIdFromTask = taskInfo.equipmentInfo._id;

    // // Fetch the equipment information from the equipment collection
    // const chosenEquipment = await equipment.findOne({ _id: equipmentIdFromTask });

    // if (!chosenEquipment) {
    //   return res.status(404).json({ 'status': -6, 'message': 'Equipment not found.' });
    // }

    // // Create an equipment object with the chosen equipment information
    // const equipmentData = {
    //   _id: chosenEquipment._id,
    //   name: chosenEquipment.name,
    // };


    //   // Update the user document's equipmentInfo array
    //   await userModel.updateOne(
    //     { _id: userId },
    //     { $push: { equipmentInfo: equipmentData } }
    //   );


    // Get the equipment _id and name from the task's equipmentInfo
    const equipmentInfoFromTask = taskInfo.equipmentInfo;

    // // Create an equipment object with the chosen equipment information
    // const equipmentData = {
    //   _id: equipmentInfoFromTask._id,
    //   name: equipmentInfoFromTask.name,
    // };

    // Update the user document's equipmentInfo array
    await userModel.updateOne(
      { _id: userId },
      { $push: { equipmentInfo: equipmentInfoFromTask } }
    );


    // Get user information from the user collection
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ status: -5, message: 'User not found.' });
    }

    // if (req.body.createdBy == undefined) {
    //   var user = await userModel.find({}, { _id: 1, fullName: 1 }
    //   );
    // } else {
    //   var user = await userModel.find({ _id: createdBy }, { _id: 1, fullName: 1}
    //   );
    // }

    // Define the userInfo object
    const userInfo = {
      _id: user._id,
      fullName: user.fullName,
      emailAddress: user.emailAddress,
      role: user.role,
    };


    const updateTaskResult = await Task.updateOne({ _id: taskId }, { $set: { status: 2 } });

    const updateUserStatus = await userModel.updateOne({ _id: userId }, { $set: { status: 1 } });

    // console.log("userInfo", userInfo);
    // Update the equipment collection's userInfo field
    const updateEquipmentResult = await equipment.updateOne(
      { _id: equipmentInfo._id },
      {
        $set: {
          userInfo: userInfo,
          status: 1
        },
      },

    );


    // console.log("updateEquipmentResult", updateEquipmentResult);
    if (updateEquipmentResult.nModified === 0) {
      return res.status(400).json({ 'status': -2, 'message': 'Equipment userInfo update failed.' });
    }

    // Update the task status in the package's taskInfo object if it exists
    if (type != 5) {
      for (const packageInfo of taskInfo.packageDetails) {
        const newProductDetail = await Package.updateOne({ _id: new mongoose.Types.ObjectId(packageInfo._id) }, { $set: { cartStatus: 1 } });
        // console.log("newProductDetail",newProductDetail);
      }
    }


    // Find the task with the given taskId
    const task = await Task.findOne({ _id: taskId });

    if (!task) {
      return res.status(404).json({ status: -1, message: 'Task not found for the provided taskId' });
    }
    // Retrieve packageDetails from task
    const packageDetailsFromTask = task.packageDetails;

    var arrayData = [];
    packageDetailsFromTask.map((element) => {
      element.consignmentId = taskInfo.jobInfo.consignmentId;
      arrayData.push(element);
    });


    // Remove existing cart data for the provided userId
    await Cart.deleteMany({ userId: userId });

    // Create a new cart entry with the packageDetails
    const newCart = new Cart({
      userId: userId,
      packageInfo: arrayData
    });

    await newCart.save();
    // await Cart.updateOne(
    //   { userId: userId },
    //   { $set: { packageInfo: arrayData } },
    //   { upsert: true } // This option creates a new document if it doesn't exist
    // );

    return res.status(200).json({ 'status': 1, 'message': 'Task was started successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ 'status': -3, 'message': 'Internal server error.' });
  }
});


router.post('/startTask', async (req, res) => {
  const reqBody = req.body;

  try {
    const { type, taskId, userId } = reqBody;

    if (!type || !taskId || !userId) {
      return res.status(400).json({ 'status': -1, 'message': 'Invalid input data.' });
    }

    // Update task status to "inprogress"
    const taskInfo = await Task.findOne({ _id: taskId });
    const taskUserInfo = await Task.find({ userId: new mongoose.Types.ObjectId(userId), status: 2 });
    if (taskUserInfo.length != 0) {
      return res.status(400).json({ 'status': -3, 'message': 'User Already In Task' });
    }

    const equipmentInfo = taskInfo.equipmentInfo;

    const equipmentStatusInfo = await equipment.findOne({ _id: equipmentInfo._id });
    if (equipmentStatusInfo != null) {
      if (equipmentStatusInfo.status == 1) {
        return res.status(400).json({ 'status': -4, 'message': 'Equipment is already assigned, Please choose other equipment' });
      }
    }

    // Create a new equipment log entry
    const newEquipmentLog = new EquipmentLog({
      userId: userId,
      taskId: taskId,
      equipmentId: equipmentInfo._id, 
      status:0
      
    });

    // Save the new equipment log entry to the database
    await newEquipmentLog.save();

    // // Get the equipment _id from the task's equipmentInfo
    // const equipmentIdFromTask = taskInfo.equipmentInfo._id;

    // // Fetch the equipment information from the equipment collection
    // const chosenEquipment = await equipment.findOne({ _id: equipmentIdFromTask });

    // if (!chosenEquipment) {
    //   return res.status(404).json({ 'status': -6, 'message': 'Equipment not found.' });
    // }

    // // Create an equipment object with the chosen equipment information
    // const equipmentData = {
    //   _id: chosenEquipment._id,
    //   name: chosenEquipment.name,
    // };


    //   // Update the user document's equipmentInfo array
    //   await userModel.updateOne(
    //     { _id: userId },
    //     { $push: { equipmentInfo: equipmentData } }
    //   );


    // Get the equipment _id and name from the task's equipmentInfo
    const equipmentInfoFromTask = taskInfo.equipmentInfo;

    // // Create an equipment object with the chosen equipment information
    // const equipmentData = {
    //   _id: equipmentInfoFromTask._id,
    //   name: equipmentInfoFromTask.name,
    // };

    // Update the user document's equipmentInfo array
    await userModel.updateOne(
      { _id: userId },
      { $push: { equipmentInfo: equipmentInfoFromTask } }
    );


    // Get user information from the user collection
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ status: -5, message: 'User not found.' });
    }

    // if (req.body.createdBy == undefined) {
    //   var user = await userModel.find({}, { _id: 1, fullName: 1 }
    //   );
    // } else {
    //   var user = await userModel.find({ _id: createdBy }, { _id: 1, fullName: 1}
    //   );
    // }

    // Define the userInfo object
    const userInfo = {
      _id: user._id,
      fullName: user.fullName,
      emailAddress: user.emailAddress,
      role: user.role,
    };


    const updateTaskResult = await Task.updateOne({ _id: taskId }, { $set: { status: 2 } });

    const updateUserStatus = await userModel.updateOne({ _id: userId }, { $set: { status: 1 } });

    // console.log("userInfo", userInfo);
    // Update the equipment collection's userInfo field
    const updateEquipmentResult = await equipment.updateOne(
      { _id: equipmentInfo._id },
      {
        $set: {
          userInfo: userInfo,
          status: 1
        },
      },

    );


    // console.log("updateEquipmentResult", updateEquipmentResult);
    if (updateEquipmentResult.nModified === 0) {
      return res.status(400).json({ 'status': -2, 'message': 'Equipment userInfo update failed.' });
    }

    // Update the task status in the package's taskInfo object if it exists
    if (type != 5) {
      for (const packageInfo of taskInfo.packageDetails) {
        const newProductDetail = await Package.updateOne({ _id: new mongoose.Types.ObjectId(packageInfo._id) }, { $set: { cartStatus: 1 } });
        // console.log("newProductDetail",newProductDetail);
      }
    }


    // Find the task with the given taskId
    const task = await Task.findOne({ _id: taskId });

    if (!task) {
      return res.status(404).json({ status: -1, message: 'Task not found for the provided taskId' });
    }
    // Retrieve packageDetails from task
    const packageDetailsFromTask = task.packageDetails;

    var arrayData = [];
    packageDetailsFromTask.map((element) => {
      element.consignmentId = taskInfo.jobInfo.consignmentId;
      arrayData.push(element);
    });


    // Remove existing cart data for the provided userId
    await Cart.deleteMany({ userId: userId });

    // Create a new cart entry with the packageDetails
    const newCart = new Cart({
      userId: userId,
      packageInfo: arrayData
    });

    await newCart.save();
    // await Cart.updateOne(
    //   { userId: userId },
    //   { $set: { packageInfo: arrayData } },
    //   { upsert: true } // This option creates a new document if it doesn't exist
    // );

    return res.status(200).json({ 'status': 1, 'message': 'Task was started successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ 'status': -3, 'message': 'Internal server error.' });
  }
});


router.post("/generateGRNChallan", async (req, res) => {
  const reqQuery = req.query;
  try {
    const reqBody = req.body;
    challanInfo = {
      "no": Math.floor(1000 + Math.random() * 9000),
      "date": moment().format('YYYY-MM-DD'),
      "GENo": "04D-" + Math.floor(1000 + Math.random() * 9000),
      "billNo": "B" + Math.floor(1000 + Math.random() * 9000),
      "challanNo": Math.floor(1000 + Math.random() * 9000),
      "LRNo": "2023",
      "transporter": "SMD",
      "vehicle": "TN37H" + Math.floor(1000 + Math.random() * 9000)
    }


    // const userDetail = await userModel.findOne({ /* role: 3 */ }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 });
    if (req.body.createdById == undefined) {
      var userDetail = await userModel.findOne({}, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 }
      );
    } else {
      var userDetail = await userModel.findOne({ _id: req.body.createdById }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 }
      );
    }


    if (userDetail.length === 0) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##user not found##', reqQuery.language) });
    }

    var dataDesc = userDetail.fullName + ' started the quantity verification process for the products,then checked the devices in each package to ensure that the correct quantity was received as per the order.';

    statusInfo = {
      status: 5, // GRN Generator
      createdBy: userDetail.fullName,
      createdAt: new Date(),
      description: dataDesc
    };
    jobStatus = 5; // GRN Generator



    let jobDetail = await Job.findOne({ consignmentId: reqBody._id }).select('bayInfo  consignmentId clientDetail vehicleDetail invoiceNo purchaseOrderNo shipmentDetail  skuDetails ftlVerification pallet  binAllocate bookingDate bookingTime shipmentType packageDetails grnInfo challanInfo');
    if (!jobDetail) {
      jobDetail = await Job.findOne({ _id: reqBody._id }).select('bayInfo  consignmentId clientDetail vehicleDetail invoiceNo purchaseOrderNo shipmentDetail  skuDetails ftlVerification pallet  binAllocate bookingDate bookingTime shipmentType packageDetails grnInfo challanInfo');
    }
    await Job.updateOne({ "jobId": jobDetail._id }, {
      $set: {
        challanInfo: challanInfo,
        status: jobStatus,
        statusInfo: statusInfo
      }
    });
    const packageList = await Package.find({ "jobId": jobDetail._id });
    console.log("packageList", packageList);
    jobDetail.packageList = packageList;
    jobDetail.challanInfo = challanInfo;
    // const jobDetail = await Job.findOne({ _id: reqBody._id }).select('bayInfo  consignmentId clientDetail vehicleDetail invoiceNo purchaseOrderNo shipmentDetail  skuDetails ftlVerification pallet  binAllocate bookingDate bookingTime shipmentType packageDetails challanInfo');
    // const consignmentDetail = await Job.findOne({ _id: reqBody.consignmentId }).select('bayInfo  consignmentId clientDetail vehicleDetail invoiceNo purchaseOrderNo shipmentDetail  skuDetails ftlVerification pallet  binAllocate bookingDate bookingTime shipmentType packageDetails challanInfo');
    return res.status(200).json({ status: 1, message: "Success", responseData: jobDetail });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
});

router.post("/outboundAssignPickerCopy", async (req, res) => {
  try {
    const reqBody = req.body;

    const user = await userModel.findById(reqBody.userId); // Use reqBody.userId
    if (!user) {
      return res.status(404).json({ status: -2, message: commonFunction.translate('##user not found##', reqQuery.language) });
    }

    // const userDetail = await userModel.findOne({}, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 });

    if (req.body.createdBy == undefined) {
      var assignedByUser = await userModel.findOne({}, { _id: 1, fullName: 1 }).sort({ _id: 1 });
    } else {
      var assignedByUser = await userModel.findOne({ _id: createdBy }, { _id: 1, fullName: 1 }).sort({ _id: 1 });
    }
    // const assignedByUser = await userModel.findOne({}, { _id: 1, fullName: 1 }).sort({ _id: 1 });

    // Fetch location details based on locationId
    const locationDetails = await locationModel.findById(reqBody.locationId);

    if (!locationDetails) {
      return res.status(404).json({ message: "Location not found" });
    }
    const jobInfo = await Job.findById({ _id: reqBody.jobId });

    let skuDetailsArray = reqBody.skuDetails.map((data) => {
      data.cartStatus = 0;
      return data
    })

    const newTaskData = {
      type: 8,
      status: 1,
      note: reqBody.note,
      items: reqBody.skuDetails.toBeOutbound,
      date: commonFunction.currentDate(),
      time: commonFunction.currentTime(),
      jobInfo: {
        _id: jobInfo._id,
        consignmentId: reqBody.consignmentId,
        skuDetails: skuDetailsArray,
      },
      userId: reqBody.userId,
      locationInfo: {
        locationId: reqBody.locationId,
        ...locationDetails.toObject(), // Add the location details fetched from the Location model
      },
      taskName: "Assigned Picker",
      assignedBy: { _id: assignedByUser._id, name: assignedByUser.fullName },
      assignedTo: { _id: reqBody.userId, name: user.fullName },
      wareHouseId: reqBody.wareHouseId,
      companyId: reqBody.companyId
    };

    const newTask = new Task(newTaskData);
    await newTask.save();

    res.status(201).json({ message: "Task created and assigned successfully", task: newTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
});

router.post("/outboundAssignPicker", async (req, res) => {
  try {
    const reqBody = req.body;

    const user = await userModel.findById(reqBody.userId); // Use reqBody.userId
    if (!user) {
      return res.status(404).json({ status: -2, message: commonFunction.translate('##user not found##', reqQuery.language) });
    }

    // const userDetail = await userModel.findOne({}, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 });

    if (req.body.createdBy == undefined) {
      var assignedByUser = await userModel.findOne({}, { _id: 1, fullName: 1 }).sort({ _id: 1 });
    } else {
      var assignedByUser = await userModel.findOne({ _id: createdBy }, { _id: 1, fullName: 1 }).sort({ _id: 1 });
    }
    // const assignedByUser = await userModel.findOne({}, { _id: 1, fullName: 1 }).sort({ _id: 1 });

    // Fetch location details based on locationId
    const locationDetails = await locationModel.findById(reqBody.locationId);

    if (!locationDetails) {
      return res.status(404).json({ message: "Location not found" });
    }
    const jobInfo = await Job.findById({ _id: reqBody.jobId });

    let skuDetailsArray = reqBody.skuDetails.map((data) => {
      data.cartStatus = 0;
      return data
    })

    const newTaskData = {
      type: 8,
      status: 1,
      note: reqBody.note,
      items: reqBody.skuDetails.toBeOutbound,
      date: commonFunction.currentDate(),
      time: commonFunction.currentTime(),
      jobInfo: {
        _id: jobInfo._id,
        consignmentId: reqBody.consignmentId,
        skuDetails: skuDetailsArray,
      },
      userId: reqBody.userId,
      locationInfo: {
        locationId: reqBody.locationId,
        ...locationDetails.toObject(), // Add the location details fetched from the Location model
      },
      taskName: "Assigned Picker",
      assignedBy: { _id: assignedByUser._id, name: assignedByUser.fullName },
      assignedTo: { _id: reqBody.userId, name: user.fullName },
      wareHouseId: reqBody.wareHouseId,
      companyId: reqBody.companyId
    };
    subtaskName = { "1": "Put away", "2": "Sort", "3": "Assemble", "4": "Relocate", "5": "Unload", "6": "QA", "7": "Repackage", "8": "Picker", "9": "Load", "10": "Pack" };

    const newTask = new Task(newTaskData);
    await newTask.save();
    if (user.deviceToken !== undefined && user.deviceToken !== "") {
      const dataValue = JSON.stringify({
        "to": user.deviceToken,
        "notification": {
          "title": "WMS",
          "body": subtaskName[8] + " task assigned to you",
          "icon": "task assign to you",
          "sound": "default",
        },
        "data": {
          "message": {
            "title": "Wms",
            "message": subtaskName[8] + " task assigned to you",
            "priority": 0,
            "status": 1,
          },
        },
      });
      commonFunction.sendPushNotification(dataValue);
    }
    res.status(201).json({ message: "Task created and assigned successfully", task: newTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
});

router.post('/crossDockingTask', async (req, res) => {
  try {
    const { type, userId, jobId, packageDetails, equipmentId, locationId, time, date, note, shipmentTo, wareHouseId, companyId } = req.body;

    // Fetch user information

    if (req.body.createdBy == undefined) {
      var userDetail = await userModel.findOne({}, { _id: 1, fullName: 1 }
      );
    } else {
      var userDetail = await userModel.findOne({ _id: createdBy }, { _id: 1, fullName: 1 }
      );
    }
    // const userDetail = await userModel.findOne({}, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 });
    const user = await userModel.findOne({ _id: userId }, { _id: 1, fullName: 1, deviceToken: 1 });
    if (!user) {
      return res.status(404).json({ status: -2, message: "User not found" });
    }

    // Fetch job information
    const jobInfo = await Job.findById(jobId, { _id: 1, consignmentId: 1, clientId: 1, clientDetail: 1, invoiceNo: 1, purchaseOrderNo: 1, bayInfo: 1 });
    if (!jobInfo) {
      return res.status(404).json({ status: -3, message: "Job not found" });
    }

    // Fetch equipment information based on equipmentId
    const equipmentInfo = await equipment.findById(equipmentId);
    if (!equipmentInfo) {
      return res.status(404).json({ status: -4, message: "Equipment info not found" });
    }

    const locationInfo = await locationModel.findOne({ _id: locationId });
    if (!locationInfo) {
      return res.status(400).json({ status: -3, message: "location info not found" });
    }

    // Your other data validation and processing logic here
    var packageIdArray = [];
    const packageDetailArr = packageDetails.map((element) => {
      packageIdArray.push(element._id);
      return {
        ...element,
        type: 40, // cross docking
      };
    });

    // Create a new task document
    const newTask = new Task({
      type: type,
      userId: userId,
      jobId: jobId,
      time: time,
      date: date,
      note: note,
      shipmentTo: shipmentTo,
      status: 1,
      bayInfo: jobInfo.bayInfo,
      items: packageDetails.length,
      packageDetails: packageDetailArr,
      equipmentInfo: equipmentInfo,
      locationInfo: locationInfo,
      jobInfo: {
        _id: jobInfo._id,
        consignmentId: jobInfo.consignmentId,
        clientId: jobInfo.clientId,
        clientDetail: jobInfo.clientDetail,
        invoiceNo: jobInfo.invoiceNo,
        purchaseOrderNo: jobInfo.purchaseOrderNo,
        bayInfo: jobInfo.bayInfo,
      },
      assignedBy: { _id: userDetail._id, name: userDetail.fullName },
      assignedTo: { _id: user._id, name: user.fullName },
      wareHouseId: wareHouseId,
      companyId: companyId
    });

    // Save the task document
    const savedTask = await newTask.save();
    console.log("savedTask", savedTask);
    // subtaskName = { "1": "Put away", "2": "Sort", "3": "Assemble", "4": "Relocate", "5": "Unload", "6": "QA", "10": "Cross Docking", "11": "Pack" };
    const subtaskName = { "1": "Put away", "2": "Sort", "3": "Assemble", "4": "Relocate", "5": "Unload", "6": "QA", "7": "Repackage", "8": "Picker", "9": "Pack", "10": "Load" };

    
    const dataDesc = 'Cross Docking Task was assigned to by ' + user.fullName;

    const subtaskLog = {
      description: dataDesc,
      status: 40,
      createdBy: user.fullName,
      createdAt: new Date(),
    };

    await Job.updateOne(
      { _id: jobId },
      {
        $push: { logs: subtaskLog, subtask: newTask },
        $set: { statusInfo: subtaskLog },
      }
    );

    const taskInfo = {
      taskId: newTask._id,
      type: type,
      taskName: "Cross Docking",
      status: newTask.status,
    };

    if (packageIdArray.length != 0) {
      await Package.updateMany(
        { _id: { $in: packageIdArray } },
        {
          $set: { taskStatus: "Cross Docking", taskInfo: taskInfo },
        }
      );
    }

    await userModel.updateOne(
      { _id: userId },
      {
        $push: {
          taskInfo: {
            taskId: newTask._id,
            type: 40,
            status: newTask.status,
          },
        },
      }
    );

    // console.log("user====",user);
    // Send push notification
    if (user.deviceToken !== undefined && user.deviceToken !== "") {
      console.log("user.deviceToken", user.deviceToken);
      const dataValue = JSON.stringify({
        "to": user.deviceToken,
        "notification": {
          "title": "WMS",
          "body": "Cross Docking task assigned to you",
          "icon": "task assign to you",
          "sound": "default",
        },
        "data": {
          "message": {
            "title": "Wms",
            "message": "Cross Docking task assigned to you",
            "priority": 0,
            "status": 1,
          },
        },
      });
      commonFunction.sendPushNotification(dataValue);
    }

    return res.status(200).json({ status: 1, message: "Success" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: -1, message: "Internal Server Error" });
  }
});

async function getNextConsignmentId(clientId) {
  try {
    const client = await Client.findOne({ _id: clientId });

    if (!client) {
      throw new Error('Client not found');
    }

    const clientAbbreviation = client.name.substring(0, 2).toUpperCase();

    const latestJob = await Job.findOne({}, { consignmentId: 1 }).sort({ _id: -1 });

    let lastNumber = 0;

    if (latestJob && latestJob.consignmentId) {
      const lastConsignmentId = latestJob.consignmentId;
      const lastNumberString = lastConsignmentId.substring(4);
      lastNumber = parseInt(lastNumberString);
    }

    let newNumber = lastNumber + 1;

    const paddedNumber = newNumber.toString().padStart(4, '0');
    const consignmentId = 'WM' + clientAbbreviation + paddedNumber;

    // Create the consignmentId directory
    const consignmentIdPath = path.join('public', 'inbound', consignmentId);
    await fs.promises.mkdir(consignmentIdPath, { recursive: true });

    return { consignmentId };
  } catch (error) {
    // console.log(error);
    throw new Error('Failed to generate consignmentId');
  }
}

router.post('/cdTaskComplete', async (req, res) => {
  try {
    const reqBody = req.body;

    const packageDetail = await Package.findOne({ "_id": reqBody.packageId });
    if (!packageDetail) return res.status(404).json({ status: -1, message: 'Package not found' });

    const packageLocationInfo = await locationModel.findOne({ _id: reqBody.locationId });
    if (!packageLocationInfo) return res.status(404).json({ status: -3, message: 'Package Location not found' });

    const taskDetail = await Task.findOne({ "_id": reqBody.taskId });
    if (!taskDetail) return res.status(404).json({ status: -1, message: 'Task not found' });

    if (!reqBody.type) return res.status(400).json({ "status": -1, message: "Validation error" });

    // const userDetail = await userModel.findOne({}, { _id: 1, fullName: 1 });
    if (req.body.createdBy == undefined) {
      var userDetail = await userModel.findOne({}, { _id: 1, fullName: 1 }
      );
    } else {
      var userDetail = await userModel.findOne({ _id: req.body.createdBy }, { _id: 1, fullName: 1 }
      );
    }

    // Find the index of the package within packageDetails array
    const packageIndex = taskDetail.packageDetails.findIndex(pkg => pkg._id.toString() == reqBody.packageId);
    if (packageIndex == -1) return res.status(404).json({ status: -1, message: 'Package not found in task' });

    // Update the status of the specific package within packageDetails array
    taskDetail.packageDetails[packageIndex].status = 3;

    // Save the updated task details
    await taskDetail.save();

    const logStatusMap = {
      1: 17,
      2: 20,
      3: 23,
      4: 26,
      5: 29,
      6: 30,
      7: 33,
      8: 36,
      10: 42
    };

    const logStatus = logStatusMap[reqBody.type];

    const newLog = {
      description: 'test',
      status: logStatus,
      createdBy: userDetail.fullName,
      createdAt: new Date(),
    };

    await Job.updateOne({ "_id": packageDetail.jobId }, {
      $push: {
        logs: newLog
      },
      $set: {
        status: 7,
        "statusInfo.status": 7,
        "statusInfo.createdBy": userDetail.fullName,
        "statusInfo.createdAt": new Date(),
      }
    });

    if (reqBody.type >= 1 && reqBody.type <= 5) {
      const taskInfo = await Task.findOne({ '_id': packageDetail.taskInfo.taskId });
      if (!taskInfo) {
        return res.status(400).json({ status: -2, message: "Task information not found" });
      }

      if (taskInfo.locationInfo != undefined) {
        if ((taskInfo.locationInfo._id).toString() !== (new mongoose.Types.ObjectId(reqBody.locationId)).toString()) {
          return res.status(400).json({ status: -2, message: "Information Mismatched please check" });
        }

        const locationInfo = await locationModel.findOne({ "_id": taskInfo.locationInfo._id });
        if (!locationInfo) return res.status(400).json({ status: -2, message: "Location information not found" });

        await Package.updateOne({ "_id": reqBody.packageId }, {
          $set: {
            locationInfo: locationInfo
          }
        });
      }
    }

    await Package.updateOne({ "_id": reqBody.packageId }, {
      $set: {
        taskInfo: {
          taskId: packageDetail.taskInfo.taskId,
          type: packageDetail.taskInfo.type,
          taskName: packageDetail.taskInfo.typeName,
          status: 3
        }
      }
    });

    const cartToRemove = await Cart.findOneAndUpdate(
      { userId: reqBody.userId },
      { $pull: { packageInfo: { _id: new mongoose.Types.ObjectId(reqBody.packageId) } } }
    );

    const task = await Task.findOne({ _id: reqBody.taskId });
    if (!task) {
      return res.status(404).json({ status: -1, message: 'Task not found' });
    }

    if (task.equipmentInfo != undefined && task.equipmentInfo != null) {
      const equipmentId = task.equipmentInfo._id;

      const updateResult = await equipment.updateOne({ _id: equipmentId }, { $set: { status: 0 } });

      if (updateResult.nModified === 1) {
        const equipmentLogData = {
          userId: reqBody.userId,
          taskId: reqBody.taskId,
          equipmentId: equipmentId,
          status: 0,
        };
        const equipmentLog = new EquipmentLog(equipmentLogData);
        await equipmentLog.save();
      } else {
        // // console.log("Equipment status update failed");
      }

      await userModel.updateOne(
        { _id: reqBody.userId },
        { $set: { equipmentInfo: [], status: 0 } }
      );
    }

    await Task.updateOne(
      { _id: reqBody.taskId },
      { $set: { status: 3 } }
    );

    const jobDetail = await Job.findOne({ _id: packageDetail.jobId });
    // outbound create
    const clientId = jobDetail.clientId;
    const skuDetails = jobDetail.skuDetails;
    const packageDetails = jobDetail.packageDetails;

    // Check if the client exists
    const client = await Client.findOne({ _id: clientId });
    if (!client) {
      return res.status(400).json({ status: -1, message: 'Client not found' });
    }

    // Generate the consignmentId
    const { consignmentId } = await getNextConsignmentId(clientId);

    // Create a new job
    const newJob = new Job({
      bayInfo: {},
      clientId: clientId,
      consignmentId: consignmentId,
      jobId: consignmentId,
      clientDetail: client,
      vehicleDetail: {
        vehicleNo: '',
        vehicleType: '',
        trailer: '',
        containerNo: '',
        estimatedTimeOfArrival: '',
        vehicleRc: false,
        vehicleInsurance: false,
        driverLicense: false,
        vehicleRcImage: '',
        vehicleInsuranceImage: '',
        driverLicenseImage: '',
        uploadPictureImage: ''
      },
      invoiceNo: reqBody.invoiceNo || '',
      purchaseOrderNo: reqBody.purchaseOrderNo || '',
      shipmentDetail: {
        from: '',
        to: '',
        titleNumber: '',
        description: '',
        inboundShipmentType: '',
        unloadShipmentType: ''
      },
      skuDetails: [],
      status: 8, // outbound Created
      statusInfo: {
        status: 8, // outbound Created
        createdBy: '',
        createdAt: new Date(),
      },
      appointmentStatus: 1,
      specialRequest: '',
      specifyDetails: '',
      incoterms: reqBody.incoterms || '',
      vehicleDocVerified: false,
      otlLockingSystem: 0,
      otlImage: '',
      subtask: [],
      pallet: [],
      binAllocate: [],
      bookingDate: reqBody.bookingDate || '',
      bookingTime: reqBody.bookingTime || '',
      shipmentType: null,
      logs: [],
      comments: '',
      type: 2,
      shipmentTo: taskDetail.shipmentTo,
      wareHouseId: jobDetail.wareHouseId,
      companyId: jobDetail.companyId
    });

    // Save the new job
    const savedJob = await newJob.save();
    console.log("savedJob", savedJob);

    // Check if each skuDetail already exists in the productDetails collection
    for (const skuDetail of skuDetails) {
      const existingSku = await ProductDetail.findOne({ msku: skuDetail.msku });

      if (!existingSku) {
        // If the skuDetail doesn't exist, create it in productDetails collection
        const newSku = await ProductDetail.create(skuDetail);
        skuDetail._id = newSku._id; // Update the _id to match the newly created document's _id
      } else {
        // If the skuDetail already exists, use its _id in the skuDetails array
        skuDetail._id = existingSku._id;
      }
    }

    // Construct the update query for the job collection
    const updateQuery = {
      $push: {
        skuDetails: { $each: skuDetails },
        packageDetails: { $each: packageDetails },
      },
    };
    // Construct the response object
    const responseObject = {
      status: 1,
      message: 'Task completed and collections updated successfully.',
      packageDetails: packageDetails,
      locationInfo: packageLocationInfo,

    };
    // Update the job collection with the new skuDetails and packageDetails
    await Job.updateOne({ _id: savedJob._id }, updateQuery);
    return res.status(200).json({ status: 1, message: 'Task completed and collections updated successfully.', responseObject });
  } catch (err) {
    console.log("err", err);
    return res.status(500).json({ status: -1, message: 'Internal server error' });
  }
});


// router.post('/relocateBayCreate', async (req, res) => {
//   const reqQuery = req.query;
//   try {
//     const {
//       type,
//       note,
//       userId,
//       jobId,
//       packageDetails,
//       equipmentId,
//       wareHouseId,
//       companyId,
//       companyUserId,
//       locationId,
//     } = req.body;

//     // Check if jobId is provided
//     if (!jobId || !userId) {
//       return res.status(400).json({ status: -1, message: commonFunction.translate('##validation error##', reqQuery.language) });
//     }



//     const user = await userModel.findById(userId);
//     if (!user) {
//       return res.status(404).json({ status: -2, message: commonFunction.translate('##user not found##', reqQuery.language) });
//     }
//     const userDetail = await userModel.findOne({}, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 });
//     if (req.body.createdBy == undefined) {
//       var assignedByUser = await userModel.findOne({}, { _id: 1, fullName: 1 }).sort({ _id: 1 })
//     } else {
//       var assignedByUser = await userModel.findOne({ _id: req.body.createdBy }, { _id: 1, fullName: 1 }).sort({ _id: 1 })

//     }

//     // Fetch jobInfo based on jobId
//     const jobInfo = await Job.findById(jobId);

//     if (!jobInfo) {
//       return res.status(404).json({ status: -3, message: commonFunction.translate('##job not found##', reqQuery.language) });
//     }
//     // Fetch equipment information based on equipmentId
//     const equipmentInfo = await equipment.findById(equipmentId).select('_id name');

//     if (!equipmentInfo) {
//       return res.status(404).json({ status: -3, message: "Equipment info not found" });
//     }

//     let bayInfo = null;

//     if (type === 4 && locationId === "") {
//       bayInfo = jobInfo.bayInfo;
//       if (!bayInfo) {
//         return res.status(400).json({ status: -4, message: "Bay info is not available for this job" });
//       }
//     } else {
//       if (locationId) {
//         const locationInfo = await locationModel.findOne({ _id: locationId });
//         if (locationInfo === null) {
//           return res.status(400).json({ status: -3, message: "Location info not found" });
//         }
//         // Include locationInfo in the response when locationId is not empty
//         return res.status(200).json({
//           status: 1,
//           message: commonFunction.translate('##success##', reqQuery.language),
//           responseData: locationInfo,
//         });
//       }
//     }

//     let packageLength = 0;
//     let packageIdArray = [];
//     let newTask;
//     let logStatus;
//     let typeName;
//     let subtaskName;

//     if (packageDetails) {
//       packageLength = packageDetails.length;

//       switch (type) {
//         case 1: logStatus = 15; typeName = "Put away"; break;
//         case 2: logStatus = 18; typeName = "Sort"; break;
//         case 3: logStatus = 21; typeName = "Assemble"; break;
//         case 4: logStatus = 24; typeName = "Relocate"; break;
//         case 5: logStatus = 10; typeName = "Unload"; break;
//         case 6: logStatus = 27; typeName = "QA"; break;
//         case 7: logStatus = 31; typeName = "Repackage"; break;
//         case 8: logStatus = 34; typeName = "Picker"; break;
//         case 9: logStatus = 37; typeName = "Load"; break;
//         default: break;
//       }

//       const packageDetailArr = packageDetails.map((element) => {
//         packageIdArray.push(element._id);
//         return {
//           ...element,
//           type: logStatus,
//         };
//       });

//       let packageLocationInfo = {};

//       if (locationId !== undefined && locationId !== "") {
//         packageLocationInfo = await locationModel.findOne({ _id: locationId });
//         if (packageLocationInfo === null) {
//           return res.status(400).json({ status: -3, message: "Location info not found" });
//         }
//       }

//       // Create an empty object for locationInfo if locationId is an empty string or undefined
//       if (locationId === "" || locationId === undefined) {
//         packageLocationInfo = {};
//       }

//       newTask = new Task({
//         type: type,
//         note: note,
//         userId: userId,
//         status: 1,
//         bayInfo: bayInfo,
//         locationInfo: packageLocationInfo,
//         equipmentInfo: equipmentInfo,
//         date: commonFunction.currentDate(),
//         time: commonFunction.currentTime(),
//         items: packageLength,
//         packageDetails: packageDetailArr,
//         jobInfo: {
//           _id: jobInfo._id,
//           consignmentId: jobInfo.consignmentId,
//           clientId: jobInfo.clientId,
//           clientDetail: jobInfo.clientDetail,
//           invoiceNo: jobInfo.invoiceNo,
//           purchaseOrderNo: jobInfo.purchaseOrderNo,
//           bayInfo: jobInfo.bayInfo,
//         },
//         companyUserInfo: await userModel.findOne({ _id: companyUserId }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1, companyInfo: 1 }),
//         wareHouseId: wareHouseId,
//         companyId: companyId,
//         assignedBy: { _id: assignedByUser._id, name: assignedByUser.fullName },
//         assignedTo: { _id: userId, name: user.fullName },
//       });

//       await newTask.save();

//       subtaskName = { "1": "Put away", "2": "Sort", "3": "Assemble", "4": "Relocate", "5": "Unload", "6": "QA", "7": "Repackage", "8": "Picker", "9": "Load", "10": "Pack" };
//       const dataDesc = 'A task was assigned to ' + user.fullName + ' by ' + assignedByUser.fullName;

//       const subtaskLog = {
//         description: dataDesc,
//         status: logStatus,
//         createdBy: userDetail.fullName,
//         createdAt: new Date(),
//       };

//       await Job.updateOne(
//         { _id: jobId },
//         {
//           $push: { logs: subtaskLog, subtask: newTask },
//           $set: { statusInfo: subtaskLog },
//         }
//       );

//       const taskInfo = {
//         taskId: newTask._id,
//         type: type,
//         taskName: typeName,
//         status: newTask.status,
//       };

//       await Package.updateMany(
//         { _id: { $in: packageIdArray } },
//         {
//           $set: { taskStatus: subtaskName[type], taskInfo: taskInfo },
//         }
//       );

//       await userModel.updateOne(
//         { _id: userId },
//         {
//           $push: {
//             taskInfo: {
//               taskId: newTask._id,
//               type: logStatus,
//               status: newTask.status,
//             },
//           },
//         }
//       );
//     }

//     if (user.deviceToken !== undefined && user.deviceToken !== "") {
//       const dataValue = JSON.stringify({
//         "to": user.deviceToken,
//         "notification": {
//           "title": "WMS",
//           "body": subtaskName[type] + " task assigned to you",
//           "icon": "task assign to you",
//           "sound": "default",
//         },
//         "data": {
//           "message": {
//             "title": "Wms",
//             "message": subtaskName[type] + " task assigned to you",
//             "priority": 0,
//             "status": 1,
//           },
//         },
//       });
//       commonFunction.sendPushNotification(dataValue);
//     }

//     return res.status(200).json({
//       status: 1,
//       message: commonFunction.translate('##success##', reqQuery.language),
//       responseData: locationId === "" ? jobInfo.bayInfo : locationInfo,
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({ status: -1, message: commonFunction.translate('##internal server error##', reqQuery.language) });
//   }
// });





module.exports = router;