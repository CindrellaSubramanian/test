const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const commonFunction = require('../public/js/commonFunction');
const Equipment = require('../schema/equipment');
const Task = require('../schema/task');
const userModel = require('../schema/userModel');
const Location = require('../schema/location');
const departmentModel = require('../schema/departmentType');
const EquipmentLog = require('../schema/equipmentLog');
const bayModel = require('../schema/bay');
const equipmentTypeModel = require('../schema/equipmentType');
const Cart = require('../schema/cart');
const QRCode = require('qr-image');
const qr = require('qr-image');
const fs = require('fs');
const path = require('path');


// Create Equipment
router.post('/create', async (req, res) => {
  const reqQuery = req.query;
  try {
    const reqBody = req.body;
    reqBody.status = 0;

    if (!reqBody.type || !reqBody.parkingArea) {
      return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##validation error##', reqQuery.language) });
    }

    const uniqueIdCheck = await Equipment.findOne({ 'assetNumber': reqBody.assetNumber });
    if (uniqueIdCheck != null) {
      return res.status(200).json({ 'status': -2, 'message': commonFunction.translate('##Asset Number Already Exist##', reqQuery.language) });
    }

    const equipmentTypeInfo = await equipmentTypeModel.findOne({ '_id': reqBody.type._id });
    if (!equipmentTypeInfo) {
      return res.status(400).json({ 'status': -3, 'message': commonFunction.translate('##equipment type not found##', reqQuery.language) });
    }

    const bayInfo = await bayModel.findOne({ '_id': reqBody.parkingArea._id });
    if (!bayInfo) {
      return res.status(400).json({ 'status': -4, 'message': commonFunction.translate('##bay not found##', reqQuery.language) });
    }
    reqBody.parkingArea = bayInfo;
    reqBody.type = equipmentTypeInfo;
    
    if (req.body.serviceRecords) {
      await commonFunction.moveToSingleDoc(reqBody.serviceRecords, "equipmentDoc");
      req.body.serviceRecords = "equipmentDoc/"+reqBody.serviceRecords;
    } else {
      req.body.serviceRecords = "";
    }
    if (req.body.insurance) {
      await commonFunction.moveToSingleDoc(reqBody.insurance, "equipmentDoc");
      req.body.insurance = "equipmentDoc/"+reqBody.insurance;
    } else {
      req.body.insurance = "";
    }
    

    if (Array.isArray(reqBody.documents) && reqBody.documents.length > 0) {
      const folderName = 'equipmentDoc';
      const movedImageUrls = await Promise.all(reqBody.documents.map(imageName => commonFunction.moveToSingleDoc(imageName, folderName)));
      reqBody.documents = movedImageUrls;
    } else {
      reqBody.documents = [];
    }
    reqBody.locationInfo = reqBody.parkingArea

    const equipment = new Equipment(reqBody);
    const newEquipment = await equipment.save();

    const qrCodeData = JSON.stringify({ equipmentId: newEquipment._id });
    const qrImage = qr.image(qrCodeData, { type: 'png' });
    const fileName = newEquipment._id + "_Equipment_QR.png";
    const qrImagePath = "equipment_qr/" + fileName;

    qrImage.pipe(fs.createWriteStream("./public/" + qrImagePath));

    await Equipment.updateOne({ _id: newEquipment._id }, { $set: { qrCode: qrImagePath } });

    if (reqBody.handler.length !== 0) {
      const handlerInfo = reqBody.handler;
      handlerInfo.map(async function (user) {
        await userModel.updateOne({ _id: user._id }, { $push: { assessableEquipment: newEquipment } });
      });
    }

    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##equipment created successfully##', reqQuery.language), 'responseData': newEquipment });
    // return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##equipment created successfully##', reqQuery.language) });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

// Equipment List
router.post('/list', async (req, res) => {
  const reqQuery = req.query;
  try {
    const reqBody = req.body;
    var filter = {};
    if (reqBody.status != "") {
      filter.status = reqBody.status;
    }
    if (reqBody.search != "") {
      const searchRegex = new RegExp(reqBody.search, 'i');
      filter.$or = [
        { name: searchRegex },
        { uniqueId: searchRegex }
      ];
    }
    if (reqBody.type != "") {
      filter['type.name'] = reqBody.type;
    }
    if (reqBody.wareHouseId != undefined && reqBody.wareHouseId != "") {
      filter.wareHouseId = new mongoose.Types.ObjectId(reqBody.wareHouseId);
    }
    if (reqBody.companyId != undefined && reqBody.companyId != "") {
      filter.companyId = new mongoose.Types.ObjectId(reqBody.companyId);
    }
    const equipment = await Equipment.find(filter, '_id type name assignTo status uniqueId userInfo locationInfo qrCode assetNumber').sort({ _id: -1 });
    filter.status = 1;
    var assignCount = await Equipment.count({ filter });
    filter.status = 0;
    var unAssignCount = await Equipment.count({ filter });
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), 'assignCount': assignCount, 'unAssignCount': unAssignCount, 'responseData': equipment });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

// Equipment Find by ID
router.post('/getById', async (req, res) => {
  const reqQuery = req.query;
  try {
    if (!req.body._id) return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##validation error##', reqQuery.language) });
    const equipment = await Equipment.findOne({ _id: req.body._id });

    if (!equipment) {
      return res.status(404).json({ 'status': -2, 'message': commonFunction.translate('##equipment not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), responseData: equipment });

  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

// // Equipment Update
// router.post('/update', async (req, res) => {
//   const reqQuery = req.query;
//   try {
//     if (!req.body._id) return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##validation error##', reqQuery.language) });

//     const equipment = await Equipment.findByIdAndUpdate(req.body._id, req.body, { new: true, runValidators: true });
//     if (!equipment) 
//       return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##equipment not found##', reqQuery.language) });
    
//     return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##equipment updated successfully##', reqQuery.language), responseData: equipment });
//   } catch (error) {
//     return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
//   }
// });



router.post('/update', async (req, res) => {
  const reqQuery = req.query;
  try {
    if (!req.body._id) return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##validation error##', reqQuery.language) });

    const equipment = await Equipment.findByIdAndUpdate(req.body._id, req.body, { new: true, runValidators: true });
    if (!equipment) 
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##equipment not found##', reqQuery.language) });
    
    if (req.body.serviceRecords) {
      await commonFunction.moveToSingleDoc(req.body.serviceRecords, "equipmentDoc");
      req.body.serviceRecords = "equipmentDoc/"+req.body.serviceRecords;
    } else {
      req.body.serviceRecords = "";
    }
    
    if (req.body.insurance) {
      await commonFunction.moveToSingleDoc(req.body.insurance, "equipmentDoc");
      req.body.insurance = "equipmentDoc/"+req.body.insurance;
    } else {
      req.body.insurance = "";
    }

    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##equipment updated successfully##', reqQuery.language), responseData: equipment });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});



router.delete('/delete', async (req, res) => {
  const reqQuery = req.query;
  try {
    if (!req.body._id) return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##validation error##', reqQuery.language) });

    const equipment = await Equipment.findByIdAndDelete(req.body._id);
    if (!equipment) 
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##equipment not found##', reqQuery.language) });
    
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##equipment deleted successfully##', reqQuery.language) });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

router.post('/equipmentAssignToUser', async (req, res) => {
  const reqQuery = req.query;
  try {
    const { userId, taskId, equipmentId } = req.body;

    const equipmentLog = await EquipmentLog.create({
      userId,
      taskId,
      equipmentId,
      status: 1, // 1: free equipment
      logs: [], // Initialize the logs array as an empty array
      createdAt: new Date(),
    });

    const userInfo = await userModel.findOne({ _id: req.body.userId }, { firstName: 1, lastName: 1, fullName: 1, dateOfBirth: 1, gender: 1, contactNumber: 1, address: 1 });
    if (!userInfo) 
      return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##user not found.##', reqQuery.language) });
    

    const equipmentInfo = await Equipment.findOne({ _id: req.body.equipmentId }, { type: 1, name: 1, manufacturer: 1, serialNumber: 1, purchaseDate: 1, purchasePrice: 1, condition: 1, location: 1, model: 1, notes: 1, status: 1 });
    if (!equipmentInfo) {
      return res.status(400).json({ 'status': -3, 'message': commonFunction.translate('##equipment not found.##', reqQuery.language) });
    }
    if (equipmentInfo.status != 0) {
      return res.status(400).json({ 'status': -4, 'message': commonFunction.translate('##equipment already assigned##', reqQuery.language) });
    }

    const taskInfo = await Task.findOne({ _id: req.body.taskId });
    if (!taskInfo) {
      return res.status(400).json({ 'status': -3, 'message': commonFunction.translate('##task not found.##', reqQuery.language) });
    }
    if (taskInfo.status == 3) {
      return res.status(400).json({ 'status': -5, 'message': commonFunction.translate('##task already completed##', reqQuery.language) });
    }

    await userModel.updateOne({ _id: req.body.userId }, { $push: { equipmentInfo }, $set: { status: 1 } }, { new: true });

    await Equipment.updateOne({ _id: req.body.equipmentId }, { $set: { userInfo, status: 1 } }, { new: true });

    await Task.updateOne({ _id: req.body.taskId }, { $set: { equipmentInfo, userInfo, status: 2 } }, { new: true });

    var dataDesc = userInfo.fullName + 'equipment is assigned to the user';

    const logEqu = {
      description: dataDesc,
      status: 16, // putAway Inprogress status
      createdBy: userInfo.fullName,
      createdAt: new Date(),
    };

    await EquipmentLog.findOneAndUpdate({ _id: equipmentLog._id }, { $push: { logs: logEqu } }, { new: true });
    
    return res.status(200).json({ status: 1, message: 'Equipment assigned to user successfully' });

  } catch (error) {
    console.log('Error assigning equipment to user:', error);
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

router.post('/responsiblePerson', async (req, res) => {
  const reqQuery = req.query;
  try {
    var userList = await userModel.find();
    var departmentList = await departmentModel.find();
    var userArr = userList.map((element) => {
      element.type = 1;
      return element;
    });
    departArr = [];
    departmentList.map((object) => {
      eleObj = {};
      eleObj._id = object._id;
      eleObj.description = object.description;
      eleObj.type = 2;
      eleObj.fullName = object.name;
      departArr.push(eleObj);
    });

    const responseData = {};
    responseData.employeeList = userArr;
    responseData.departmentList = departArr;

    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), responseData: responseData });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

const updateUserEquipmentInfo = async (userId, updatedEquipmentInfo) => {
  try {
    await userModel.updateOne( { _id: userId }, { $set: { equipmentInfo: updatedEquipmentInfo } } );

    return { status: 1, message: 'User equipment info updated successfully.' };
  } catch (err) {
    console.log('Error updating user equipment info:', err);
    return { status: -1, message: 'Internal server error.' };
  }
};

const releaseEquipment = async (cartId, userId, newEquipmentId) => {
  try {
    const cart = await Cart.findOne({ _id: cartId });

    if (!cart) {
      return { status: -1, message: 'Cart not found.' };
    }

    const existingEquipment = cart.equipmentLogData?.equipmentId;

    if (existingEquipment) {
      const data = await Equipment.updateOne( { _id: existingEquipment }, { $set: { status: 0, cartId: null, userId: null } } );
      const releasedEquipmentLog = { equipmentId: existingEquipment, userId, releasedAt: new Date() };
      await EquipmentLog.create(releasedEquipmentLog);

      cart.equipmentLogData = null;
      await cart.save();
    }

    return { status: 1, message: 'Equipment released successfully.' };
  } catch (err) {
    console.log('Error releasing equipment:', err);
    return { status: -1, message: 'Internal server error.' };
  }
};

const assignEquipment = async (cartId, userId, equipmentId) => {
  try {
    const equipment = await Equipment.findOne({ _id: equipmentId });

    if (!equipment) {
      return { status: -1, message: 'Equipment is not available.' };
    }

    if (equipment.status !== 0) {
      return { status: -1, message: 'Equipment is already assigned.' };
    }

    const cart = await Cart.findOne({ _id: cartId });

    if (!cart) {
      return { status: -1, message: 'Cart not found.' };
    }

    const newEquipmentLog = new EquipmentLog({
      userId,
      equipmentId,
      status: 1,
      createdAt: new Date(),
    });

    await newEquipmentLog.save();

    cart.equipmentLogData = newEquipmentLog;
    await cart.save();

    const updatedEquipmentInfo = { equipmentId: equipmentId, assignedAt: new Date() };

    const userUpdateResult = await updateUserEquipmentInfo(userId, updatedEquipmentInfo);
    if (userUpdateResult.status !== 1) {
      return { status: -1, message: userUpdateResult.message };
    }

    // await Equipment.updateOne({ _id: equipmentId }, { $set: { status: 1, cartId, userId,userInfo } });
    await Equipment.updateOne( { _id: equipmentId }, { $set: { status: 1, cartId, userId, userInfo: { userId: userId, userName: userModel.fullName } } } );

    return { status: 1, message: 'Equipment assigned successfully.' };
  } catch (err) {
    console.log('Error assigning equipment:', err);
    return { status: -1, message: 'Internal server error.' };
  }
};

router.post('/selectEquipmentCopy', async (req, res) => {
  try {
    const { cartId, userId, equipmentId, taskId } = req.body;

    if (!cartId || !userId || !equipmentId || !taskId) {
      return res.status(400).json({ error: 'Invalid input data.' });
    }

    if (req.body.createdBy == undefined) {
      var userDetail = await userModel.find({}, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 }
      );
    } else {
      var userDetail = await userModel.find({ _id: createdBy }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 }
      );
    }
    // const userDetail = await userModel.findOne({ /* role: 3 */ }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 });

    if (!userDetail) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##user not found##', reqQuery.language) });
    }


    const equipment = await Equipment.findOne({ _id: equipmentId });

    if (!equipment) {
      return res.status(404).json({ status: -1, message: 'Equipment not found.' });
    }

    if (equipment.status == 1) {
      return res.status(400).json({ status: -1, message: 'Equipment is already assigned.' });
    }

    // Find the task
    const task = await Task.findOne({ _id: taskId });

    if (!task) {
      return res.status(404).json({ status: -1, message: 'Task not found.' });
    }
    // Check if the task status is 1 (equipment is taken)
    if (task.status == 1) {

      // Return a response indicating that equipment status remains unchanged
      return res.status(200).json({ status: 1, message: 'Equipment status remains unchanged.' });
    } else if ((task.status == 2)|| (task.status == 3)) {
      // Task status is 2 (free), update equipment status accordingly

      // Check if the equipment status is not already 0 (free)
      if (equipment.status !== 0) {
        // Update previous equipment status to 0 (free)
        await Equipment.updateOne({ _id: equipmentId }, { $set: { status: 0 } });
      }

      // Set the new equipmentInfo from the request body
      await Task.updateOne(
        { _id: taskId },
        {
          $set: {
            'equipmentInfo._id': equipment._id,
            'equipmentInfo.name': equipment.name,
            'equipmentInfo.assignedAt': new Date(),
          },
          status: 1,
        }
      );

    }  else {
      return res.status(400).json({ status: -1, message: 'Invalid task status.' });
    }



    const releaseResult = await releaseEquipment(cartId, userId, equipmentId);

    if (releaseResult.status !== 1) {
      return res.status(404).json({ status: -1, message: releaseResult.message });
    }

    const assignResult = await assignEquipment(cartId, userId, equipmentId);

    if (assignResult.status === 1) {
      const user = await userModel.findOne({ _id: userId });

      if (!user) {
        return res.status(404).json({ status: -1, message: 'User not found.' });
      }

      const newEquipmentLog = new EquipmentLog({
        equipmentId: equipmentId,
        userId: userId,
        taskId: assignResult.taskId,
        releasedAt: new Date(),
      });
      await newEquipmentLog.save();

      await updateUserEquipmentInfo(userId, {
        equipmentId: equipmentId,
        name: equipment.name,
        assignedAt: new Date(),
      });

      res.status(200).json({ status: 1, message: 'Equipment assigned successfully.' });
    } else {
      res.status(404).json({ status: -1, message: assignResult.message });
    }
  } catch (err) {
    console.log('Error selecting equipment:', err);
    res.status(500).json({ status: -1, message: 'Internal server error.' });
  }
});

// router.post('/selectEquipment', async (req, res) => {
//   try {
//     const { cartId, userId, equipmentId, taskId } = req.body;

//     if (!cartId || !userId || !equipmentId || !taskId) {
//       return res.status(400).json({ error: 'Invalid input data.' });
//     }

//     if (req.body.createdBy == undefined) {
//       var userDetail = await userModel.find({}, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 }
//       );
//     } else {
//       var userDetail = await userModel.find({ _id: createdBy }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 }
//       );
//     }
//     // const userDetail = await userModel.findOne({ /* role: 3 */ }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 });

//     if (!userDetail) {
//       return res.status(400).json({ status: -1, message: commonFunction.translate('##user not found##', reqQuery.language) });
//     }


//     const equipment = await Equipment.findOne({ _id: equipmentId });

//     if (!equipment) {
//       return res.status(404).json({ status: -1, message: 'Equipment not found.' });
//     }

//     if (equipment.status == 1) {
//       return res.status(400).json({ status: -1, message: 'Equipment is already assigned.' });
//     }

//     // Find the task
//     const task = await Task.findOne({ _id: taskId });

//     if (!task) {
//       return res.status(404).json({ status: -1, message: 'Task not found.' });
//     }
//     // Check if the task status is 1 (equipment is taken)
//     if (task.status == 1) {

//       // Return a response indicating that equipment status remains unchanged
//       return res.status(200).json({ status: 1, message: 'Equipment status remains unchanged.' });
//     } else if ((task.status == 2)|| (task.status == 3)) {
//       // Task status is 2 (free), update equipment status accordingly

//       // Check if the equipment status is not already 0 (free)
//       if (equipment.status !== 0) {
//         // Update previous equipment status to 0 (free)
//         await Equipment.updateOne({ _id: equipmentId }, { $set: { status: 0 } });
//       }

//       // Set the new equipmentInfo from the request body
//       await Task.updateOne(
//         { _id: taskId },
//         {
//           $set: {
//             'equipmentInfo._id': equipment._id,
//             'equipmentInfo.name': equipment.name,
//             'equipmentInfo.assignedAt': new Date(),
//           },
//           // status: 1,
//         }
//       );

//     }  else {
//       return res.status(400).json({ status: -1, message: 'Invalid task status.' });
//     }

//     const releaseResult = await releaseEquipment(cartId, userId, equipmentId);

//     if (releaseResult.status !== 1) {
//       return res.status(404).json({ status: -1, message: releaseResult.message });
//     }

//     const assignResult = await assignEquipment(cartId, userId, equipmentId);

//     if (assignResult.status === 1) {
//       const user = await userModel.findOne({ _id: userId });

//       if (!user) {
//         return res.status(404).json({ status: -1, message: 'User not found.' });
//       }

//       const newEquipmentLog = new EquipmentLog({
//         equipmentId: equipmentId,
//         userId: userId,
//         taskId: assignResult.taskId,
//         releasedAt: new Date(),
//       });
//       await newEquipmentLog.save();

//       await updateUserEquipmentInfo(userId, {
//         equipmentId: equipmentId,
//         name: equipment.name,
//         assignedAt: new Date(),
//       });

//       res.status(200).json({ status: 1, message: 'Equipment assigned successfully.' });
//     } else {
//       res.status(404).json({ status: -1, message: assignResult.message });
//     }
//   } catch (err) {
//     console.log('Error selecting equipment:', err);
//     res.status(500).json({ status: -1, message: 'Internal server error.' });
//   }
// });




router.post('/selectEquipment', async (req, res) => {
  try {
      const { cartId, userId, equipmentId, taskId, createdBy } = req.body;

      if (!userId || !equipmentId || !taskId || createdBy) {
          return res.status(400).json({ error: 'Invalid input data.' });
      }

      var userDetail = await userModel.find({ _id: createdBy }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 });
      var userInfo = await userModel.findOne({ _id: userId }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, role: 1 });

      if (!userDetail && userInfo != null) {
          return res.status(400).json({ status: -1, message: commonFunction.translate('##user not found##', reqQuery.language) });
      }

      const equipment = await Equipment.findOne({ _id: equipmentId });

      if (!equipment) {
          return res.status(404).json({ status: -1, message: 'Equipment not found.' });
      }

      if (equipment.status == 1) {
          return res.status(400).json({ status: -1, message: 'Equipment is already assigned.' });
      }

      // Find the task
      const task = await Task.findOne({ _id: taskId });

      if (!task) {
          return res.status(404).json({ status: -1, message: 'Task not found.' });
      }
      // Check if the task status is 1 (equipment is taken)
      var oldEquipmentId = task.equipmentInfo._id;
      if (task.status == 1) {
       
        // Check if the equipmentId is assigned to another task with status 1
        const otherTask = await Task.findOne({ 'equipmentInfo._id': equipmentId, status: 1 });
  
        if (otherTask && otherTask._id.toString() !== taskId) {
          return res.status(400).json({ status: -1, message: 'Equipment is chosen by another user.' });
        }
  
        await Task.updateOne(
          { _id: taskId },
          {
              $set: {
                  'equipmentInfo._id': equipment._id,
                  'equipmentInfo.name': equipment.name,
                  'equipmentInfo.assignedAt': new Date(),
              },
              // status: 1,
          }
      );

          // Return a response indicating that equipment status remains unchanged
          return res.status(200).json({ status: 1, message: 'Equipment selected start the task' });
      } else if (task.status == 2) {  // Task status is 2 (free), update equipment status accordingly
          // Set the new equipmentInfo from the request body
          await Task.updateOne(
              { _id: taskId },
              {
                  $set: {
                      'equipmentInfo._id': equipment._id,
                      'equipmentInfo.name': equipment.name,
                      'equipmentInfo.assignedAt': new Date(),
                  },
                  // status: 1,
              }
          );
          await Equipment.updateOne(
              { _id: equipmentId },
              {
                  $set: {
                      status: 1,
                      userInfo: userInfo
                  }
              }
          );

          const cart = await Cart.findOne({ _id: cartId });

          if (!cart)
              return res.status(400).json({ status: -1, message: commonFunction.translate('##Cart not found##', reqQuery.language) });

        const newEquipmentLog = new EquipmentLog({ userId, equipmentId, status: 1, createdAt: new Date() });
          await newEquipmentLog.save();

          cart.equipmentLogData = newEquipmentLog;
          await cart.save();
          const equipmentInfo = {
            _id: equipment._id,
            name: equipment.name
          };
          
          await userModel.updateOne({ _id: userId }, { $set: { equipmentInfo } });
          
          // Release Equipment
          if (oldEquipmentId != undefined && oldEquipmentId != null && oldEquipmentId != "") {
              const oldEquipmentInfo = await Equipment.findOne({ _id: oldEquipmentId });
              if (oldEquipmentInfo != null) {
                  await Equipment.updateOne({ _id: oldEquipmentInfo._id }, { $set: { status: 0, userInfo: {} } });

                  const newEquipmentLog = new EquipmentLog({ userId: userId, equipmentId: oldEquipmentInfo._id, status: 0, createdAt: new Date() });
                  await newEquipmentLog.save();

                  await userModel.updateOne({ _id: userId }, { $pull: { equipmentInfo: { _id: oldEquipmentId} } });
              }
          }
      } else {
          return res.status(400).json({ status: -1, message: 'Invalid task status.' });
      }

      res.status(200).json({ status: 1, message: 'Equipment assigned successfully.' });
  } catch (err) {
      console.log('Error selecting equipment:', err);
      res.status(500).json({ status: -1, message: 'Internal server error.' });
  }
});




router.post('/locationEquipment', async (req, res) => {
  try {
    const equipmentId = req.body.equipmentId;
    const locationId = req.body.locationId;

    // Check if the equipment is free (status: 0)
    const equipment = await Equipment.findById(equipmentId);

    if (!equipment) {
      return res.status(404).json({ status: -2, message: 'Equipment not found' });
    }

    if (equipment.status == 1) {
      return res.status(400).json({ status: -2, message: 'Equipment is busy' });
    }
    const locationInfo = await Location.findById(locationId);

    if (!locationInfo) {
      return res.status(404).json({ status: -2, message: 'Location not found' });
    }

    const updatedEquipment = await Equipment.findByIdAndUpdate(
      equipmentId,
      { $set: { locationInfo: locationInfo.toObject() } },
      { new: true }
    );

    if (!updatedEquipment) {
      return res.status(404).json({ status: -2, message: 'Equipment not found' });
    }

    return res.status(200).json({ status: 1, message: 'Location information updated successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: -1, message: 'Internal server error' });
  }
});


router.post('/equipmentLogList', async (req, res) => {
  try {
    const { userId } = req.body;

    // Use the $lookup aggregation to fetch equipment names
    const logs = await EquipmentLog.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(userId) },
      },
      {
        $lookup: {
          from: 'equipment', 
          localField: 'equipmentId',
          foreignField: '_id',
          as: 'equipmentData',
        },
      },
      {
        $unwind: '$equipmentData',
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          equipmentId: 1,
          equipmentName: '$equipmentData.name', // Include equipmentName from the equipment collection
          status: 1,
          logs: 1,
          createdAt: 1,
        },
      },
    ]);

    return res.status(200).json({
      status: 1,
      message: 'EquipmentLog is listed successfully',
      responseData: logs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: -1, message: 'Internal server error' });
  }
});


module.exports = router;