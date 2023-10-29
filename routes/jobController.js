const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Job = require('../schema/job');
const Bays = require('../schema/bay');
const Client = require('../schema/client');
const Task = require('../schema/task');
const userModel = require('../schema/userModel');
const wareHouseModel = require('../schema/warehouse');
const Gate = require('../schema/gate');
const ProductDetail = require('../schema/productDetail');
const commonFunction = require('../public/js/commonFunction');
const multer = require('multer');
const xlsx = require('xlsx');
const Package = require('../schema/package');
const ProductController = require('../routes/productController');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const qr = require('qrcode');
const nodeHtmlToImage = require('node-html-to-image')

/**
 * @swagger
 * /job/gateSecurityUpdate:
 *   post:
 *     summary: Update job details for gate security
 *     tags:
 *       - Job
 *     requestBody:
 *       description: The job details to be updated
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 description: The ID of the job to be updated
 *               vehicleDetail:
 *                 type: object
 *                 description: The details of the vehicle
 *                 properties:
 *                   vehicleRc:
 *                     type: string
 *                     description: The vehicle's RC information
 *                   vehicleInsurance:
 *                     type: string
 *                     description: The vehicle's insurance information
 *                   driverLicense:
 *                     type: string
 *                     description: The driver's license information
 *                   vehicleRcImage:
 *                     type: string
 *                     description: The image URL of the vehicle's RC
 *                   vehicleInsuranceImage:
 *                     type: string
 *                     description: The image URL of the vehicle's insurance
 *                   driverLicenseImage:
 *                     type: string
 *                     description: The image URL of the driver's license
 *                   uploadPictureImage:
 *                     type: string
 *                     description: The image URL of the uploaded picture
 *               invoiceNo:
 *                 type: string
 *                 description: The invoice number
 *               purchaseOrderNo:
 *                 type: string
 *                 description: The purchase order number
 *               shipmentType:
 *                 type: string
 *                 description: The type of shipment
 *               shipmentDetail:
 *                 type: string
 *                 description: The details of the shipment
 *               skuDetails:
 *                 type: string
 *                 description: The details of the SKU
 *               specialRequest:
 *                 type: string
 *                 description: Any special requests
 *               incoterms:
 *                 type: string
 *                 description: The Incoterms
 *               vehicleDocVerified:
 *                 type: string
 *                 description: The verification status of the vehicle documents
 *               otlLockingSystem:
 *                 type: string
 *                 description: The OTL locking system information
 *               otlImage:
 *                 type: string
 *                 description: The image URL of the OTL
 *               currentTask:
 *                 type: string
 *                 description: The current task
 *               unload:
 *                 type: string
 *                 description: The unload information
 *               subtask:
 *                 type: string
 *                 description: The subtask information
 *               pallet:
 *                 type: string
 *                 description: The pallet information
 *               binAllocate:
 *                 type: string
 *                 description: The bin allocation information
 *               relocate:
 *                 type: string
 *                 description: The relocation information
 *               comments:
 *                 type: string
 *                 description: Any additional comments
 *               bookingDate:
 *                 type: string
 *                 description: The booking date
 *               bookingTime:
 *                 type: string
 *                 description: The booking time
 *               isVerified:
 *                 type: boolean
 *                 description: The verification status of the job
 *               type:
 *                 type: number
 *                 description: The type of update (1 for information update, 2 for document verification)
 *             example:
 *               _id: 12345
 *               vehicleDetail:
 *                 vehicleRc: ABC123
 *                 vehicleInsurance: XYZ789
 *                 driverLicense: DEF456
 *                 vehicleRcImage: http://example.com/vehicleRcImage.jpg
 *                 vehicleInsuranceImage: http://example.com/vehicleInsuranceImage.jpg
 *                 driverLicenseImage: http://example.com/driverLicenseImage.jpg
 *                 uploadPictureImage: http://example.com/uploadPictureImage.jpg
 *               invoiceNo: INV123
 *               purchaseOrderNo: PO123
 *               shipmentType: Type1
 *               shipmentDetail: Detail1
 *               skuDetails: SKU1
 *               specialRequest: Request1
 *               incoterms: Incoterm1
 *               vehicleDocVerified: Verified
 *               otlLockingSystem: OTL1
 *               otlImage: http://example.com/otlImage.jpg
 *               currentTask: Task1
 *               unload: Unload1
 *               subtask: Subtask1
 *               pallet: Pallet1
 *               binAllocate: Bin1
 *               relocate: Relocate1
 *               comments: Comment1
 *               bookingDate: 2023-07-05
 *               bookingTime: 12:00 PM
 *               isVerified: true
 *               type: 1
 *     responses:
 *       200:
 *         description: Success response
 *       400:
 *         description: Bad request response
 *       404:
 *         description: Job not found response
 *       500:
 *         description: Internal server error response
 */

router.post('/gateSecurityUpdate', async (req, res) => {
  const reqQuery = req.query;
  try {
    const {
      _id,
      vehicleDetail,
      invoiceNo,
      purchaseOrderNo,
      shipmentDetail,
      specialRequest,
      incoterms,
      vehicleDocVerified,
      otlLockingSystem,
      otlImage,
      currentTask,
      unload,
      subtask,
      pallet,
      binAllocate,
      relocate,
      comments,
      appointmentStatus,
      createdById
    } = req.body;
    // console.log("reqBody",vehicleDetail);
    const updateFilter = { _id: new mongoose.Types.ObjectId(_id) };
    const existingAppointment = await Job.findById(updateFilter);

    if (!existingAppointment) {
      return res.status(404).json({
        status: -1,
        message: 'Job not found',
      });
    }

    let isVerified;
    if (req.body.isVerified === true) {
      isVerified = true;
    } else if (req.body.isVerified === false) {
      isVerified = false;
    }

    const updatedFields = {
      vehicleDetail,
      invoiceNo,
      purchaseOrderNo,
      shipmentDetail,
      specialRequest,
      incoterms,
      vehicleDocVerified,
      otlLockingSystem,
      otlImage,
      currentTask,
      unload,
      subtask,
      pallet,
      binAllocate,
      relocate,
      comments,
      appointmentStatus,
      bookingDate: req.body.bookingDate,
      bookingTime: req.body.bookingTime,
      isVerified,
    };
    // // console.log("updatedFields",updatedFields);
    let newLog;
    let jobStatus;
    if (req.body.createdById == undefined) {
      var userDetail = await userModel.findOne({}, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 }
      );
    } else {
      var userDetail = await userModel.findOne({ _id: createdById }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 }
      );
    }


    if (userDetail.length === 0) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##user not found##', reqQuery.language) });
    }


    if (req.body.type === 1) {
      // console.log("existingAppointment.status", existingAppointment.status);
      newLog = {
        description: req.body.comments,
        status: 6, // informationUpdate
        createdBy: userDetail.fullName,
        createdAt: new Date(),
      };
      jobStatus = existingAppointment.status;
      await Job.updateOne({ _id: req.body._id }, { $push: { logs: newLog } });
    } else {
      if (req.body.vehicleDetail.vehicleRc || req.body.vehicleDetail.vehicleInsurance || req.body.vehicleDetail.driverLicense) {
        newLog = {
          description: req.body.comments,
          status: 7, // documentVerified
          createdBy: userDetail.fullName,
          createdAt: new Date(),
        };
        jobStatus = 2;
        updatedFields.statusInfo = {
          status: 2, // documentVerified
          createdBy: userDetail.fullName,
          createdAt: new Date(),
        };
      } else {
        newLog = {
          description: req.body.comments,
          status: 7, // documentVerified
          createdBy: userDetail.fullName,
          createdAt: new Date(),
        };
        jobStatus = 1;
      }
    }

    updatedFields.status = jobStatus;
    if (existingAppointment.status <= 1) {
      await Job.updateOne({ _id: req.body._id }, { $push: { logs: newLog } });
    }
    // Move the images
    updatedFields.documents = {}
    updatedFields.documents.inbound = {
      gs_vehicleImage: [],
      gs_driverLicenseImage: [],
      gs_vehicleRcImage: [],
      gs_vehicleInsuranceImage: [],
      gs_others: []
    }
    const consignmentId = existingAppointment.consignmentId;
    updatedFields.vehicleDetail = existingAppointment.vehicleDetail;

    // Move vehicleRcImage
    if (req.body.vehicleDetail.vehicleRcImage) {
      const vehicleRcImage = await commonFunction.moveToSingleImage(req.body.vehicleDetail.vehicleRcImage, consignmentId);
      updatedFields.vehicleDetail.vehicleRcImage = vehicleRcImage || req.body.vehicleDetail.vehicleRcImage;
      updatedFields.documents.inbound.gs_vehicleRcImage.push(vehicleRcImage || req.body.vehicleDetail.vehicleRcImage);
    } else {
      updatedFields.vehicleDetail.vehicleRcImage = '';

    }

    // Move vehicleInsuranceImage
    if (req.body.vehicleDetail.vehicleInsuranceImage) {
      const vehicleInsuranceImage = await commonFunction.moveToSingleImage(req.body.vehicleDetail.vehicleInsuranceImage, consignmentId);
      updatedFields.vehicleDetail.vehicleInsuranceImage = vehicleInsuranceImage || req.body.vehicleDetail.vehicleInsuranceImage;
      updatedFields.documents.inbound.gs_vehicleInsuranceImage.push(vehicleInsuranceImage || req.body.vehicleDetail.vehicleInsuranceImage);
    } else {
      updatedFields.vehicleDetail.vehicleInsuranceImage = '';
    }

    // Move driverLicenseImage
    if (req.body.vehicleDetail.driverLicenseImage) {
      const driverLicenseImage = await commonFunction.moveToSingleImage(req.body.vehicleDetail.driverLicenseImage, consignmentId);
      updatedFields.vehicleDetail.driverLicenseImage = driverLicenseImage || req.body.vehicleDetail.driverLicenseImage;
      updatedFields.documents.inbound.gs_driverLicenseImage.push(driverLicenseImage || req.body.vehicleDetail.driverLicenseImage);
    } else {
      updatedFields.vehicleDetail.driverLicenseImage = '';
    }

    // Move uploadPictureImage
    if (req.body.vehicleDetail.uploadPictureImage) {
      const uploadPictureImage = await commonFunction.moveToSingleImage(req.body.vehicleDetail.uploadPictureImage, consignmentId);
      updatedFields.vehicleDetail.uploadPictureImage = uploadPictureImage || req.body.vehicleDetail.uploadPictureImage;
      updatedFields.documents.inbound.gs_vehicleImage.push(uploadPictureImage || req.body.vehicleDetail.uploadPictureImage);
    } else {
      updatedFields.vehicleDetail.uploadPictureImage = '';
    }
    if (isVerified === false) {
      newLog = {
        description: req.body.comments,
        status: -1, // gateSecurity reject
        createdBy: userDetail.fullName,
        createdAt: new Date(),
      };
      jobStatus = -1;

      updatedFields.statusInfo = {
        status: -1, // document reject
        createdBy: userDetail.fullName,
        createdAt: new Date(),
      };

      await Job.updateOne({ _id: req.body._id }, { $push: { logs: newLog }, $set: { status: jobStatus, statusInfo: updatedFields.statusInfo } });

      return res.status(200).json({
        status: -1,
        message: 'Job rejected successfully',
      });
    }
    updatedFields.vehicleDetail.vehicleType = vehicleDetail.vehicleType ? vehicleDetail.vehicleType : "";
    const result = await Job.findOneAndUpdate(updateFilter, { $set: updatedFields }, { new: true });

    return res.status(200).json({ status: 1, message: 'Job updated successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: -1, message: 'An error occurred', error: err.message });
  }
});


router.post('/getDocumentByID', async (req, res) => {
  const reqQuery = req.query;
  const { _id, type } = req.body;

  const updateFilter = { _id: new mongoose.Types.ObjectId(_id) };
  let filterQuery = "documents.inbound";
  if (type === 2) {
    filterQuery = "documents.outbound";
  }

  try {
    const document = await Job.findById(updateFilter).select(filterQuery);
    if (!document) {
      return res.status(404).json({ status: -1, message: 'Document not found' });
    }

    let consignmentId = "";

    // Fetch the consignmentId only if the type is 1 (inbound)
    if (type === 1) {
      const job = await Job.findOne(updateFilter).select('consignmentId');
      if (!job) {
        return res.status(404).json({ status: -1, message: 'Job not found' });
      }
      consignmentId = job.consignmentId;
    }

    // Create the desired response object
    const response = {
      _id: _id,
      consignmentId: consignmentId,
      documents: document.documents || {}
    };
    return res.status(200).json({ status: 1, message: 'success', response });
    // res.send(response);
  } catch (error) {
    // Handle any errors that occur during the database query
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


router.post('/getALLConsignmentID', async (req, res) => {
  const reqQuery = req.query;

  const consignmentList = await Job.find({}).select("consignmentId");
  res.send(consignmentList);
});


/**
 * @swagger
 * /job/bayAllocateToJob:
 *   post:
 *     summary: Assign bay to a job
 *     tags:
 *       - Job
 *     requestBody:
 *       description: The details for assigning a bay to a job
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bayId:
 *                 type: string
 *                 description: The ID of the bay to be assigned
 *               _id:
 *                 type: string
 *                 description: The ID of the job to which the bay will be assigned
 *               specifyDetails:
 *                 type: string
 *                 description: Additional details for the assignment
 *             example:
 *               bayId: 64a5287182ec4d034cfc58c2
 *               _id: 64a5287182ec4d034cfc58c2
 *               specifyDetails: Additional details for the assignment
 *     responses:
 *       200:
 *         description: Success response
 *       400:
 *         description: Bad request response
 *       404:
 *         description: Bay or job not found response
 *       500:
 *         description: Internal server error response
 */

// router.post('/bayAllocateToJob', async (req, res) => {
//   const reqQuery = req.query;
//   try {
//     const { bayId, _id, specifyDetails, createdById } = req.body;

//     if (!req.body.bayId || !req.body._id) {
//       return res.status(400).json({ status: -1, message: commonFunction.translate('##validation error##', reqQuery.language) });
//     }

//     const bay = await Bays.findOne({ _id: bayId }, { name: 1, _id: 1, groupId: 1 });
//     if (!bay) {
//       return res.status(404).json({ status: -2, message: commonFunction.translate('##bay not found##', reqQuery.language) });
//     }
//     if (bay.status === 2) {
//       return res.status(400).json({ status: -3, message: commonFunction.translate('##bay is already occupied##', reqQuery.language) });
//     }

//     const job = await Job.findById(_id);
//     if (!job) {
//       return res.status(404).json({ status: -1, message: commonFunction.translate('##job not found##', reqQuery.language) });
//     }
//     if (req.body.createdById == undefined) {
//       var userDetail = await userModel.findOne({}, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 }
//       );
//     } else {
//       var userDetail = await userModel.findOne({ _id: createdById }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 }
//       );
//     }

//     // const userDetail = await userModel.find({
//     //   _id: createdBy
//     //   /* role: 3 */
//     // }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 });

//     if (userDetail.length == 0) {
//       return res.status(400).json({ status: -1, message: commonFunction.translate('##user not found##', reqQuery.language) });
//     }
//     const logEntry = {
//       bayInfo: bay,
//       createdBy: userDetail.fullName,
//       description: specifyDetails,
//       status: 9,//bayAllocated
//       createdAt: new Date(),
//     };

//     const updatedFields = {
//       $push: { logs: logEntry },
//       statusInfo: {
//         createdBy: userDetail.fullName,
//         description: specifyDetails,
//         status: 3,//bayAllocated
//         createdAt: new Date(),
//       },
//       bayInfo: bay,
//       status: 3,
//       specifyDetails: specifyDetails ? specifyDetails : '', // Include specifyDetails in the updatedFields
//     };

//     // Update the status_info field 

//     const updatedJob = await Job.findOneAndUpdate({ _id: _id }, updatedFields, { new: true });

//     // Update the status in the Bays collection
//     await Bays.updateOne({ _id: bayId }, { $set: { status: 2 } });

//     return res.status(200).json({ status: 1, message: commonFunction.translate('bay allocated successfully', reqQuery.language) });
//   } catch (error) {
//     // console.log(error);
//     return res.status(500).json({ status: -1, message: commonFunction.translate('internet server error', reqQuery.language) });
//   }
// });


router.post('/bayAllocateToJobCopy', async (req, res) => {
  const reqQuery = req.query;
  try {
    const { bayId, _id, specifyDetails, createdById } = req.body;

    if (!req.body.bayId || !req.body._id) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##validation error##', reqQuery.language) });
    }

    const bay = await Bays.findOne({ _id: bayId }, { name: 1, _id: 1, groupId: 1 });
    if (!bay) {
      return res.status(404).json({ status: -2, message: commonFunction.translate('##bay not found##', reqQuery.language) });
    }
    if (bay.status === 2) {
      return res.status(400).json({ status: -3, message: commonFunction.translate('##bay is already occupied##', reqQuery.language) });
    }

    // Find the job in the database
    const job = await Job.findById(_id);
    if (!job) {
      return res.status(404).json({ status: -1, message: commonFunction.translate('##job not found##', reqQuery.language) });
    }

    // Extract the consignmentId from the job (adjust the field name accordingly)
    const consignmentId = job.consignmentId;

    // Generate the QR code content for bayInfo
    const bayInfoQrCodeContent = JSON.stringify({ consignmentId, jobId: _id, bayId });

    // Generate the QR code for bayInfo
    const bayInfoQrCode = await qr.toDataURL(bayInfoQrCodeContent);

    // Define the folder path to save the bayInfo QR code (inside the consignmentId folder)
    const consignmentFolder = path.join(__dirname, '..', 'public', 'inbound', consignmentId);

    // Create the consignment folder if it doesn't exist
    if (!fs.existsSync(consignmentFolder)) {
      fs.mkdirSync(consignmentFolder, { recursive: true });
    }

    // Define the file path to save the bayInfo QR code inside the consignment folder
    const bayInfoQrCodeFileName = `${bayId}_bayInfo.png`; // Use _id, bayId, and "bayInfo" as the file name
    const bayInfoQrCodeFilePath = path.join(consignmentFolder, bayInfoQrCodeFileName);

    // Save the bayInfo QR code image to the file
    await fs.promises.writeFile(bayInfoQrCodeFilePath, bayInfoQrCode.replace(/^data:image\/png;base64,/, ''), 'base64');

    // Set the path for job_QrCode
    const job_QrCodePath = `inbound/${consignmentId}/${bayInfoQrCodeFileName}`;

    if (req.body.createdById == undefined) {
      var userDetail = await userModel.findOne({}, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 });
    } else {
      var userDetail = await userModel.findOne({ _id: req.body.createdById }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 });
    }

    if (userDetail.length == 0) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##user not found##', reqQuery.language) });
    }

    const logEntry = {
      bayInfo: bay,
      createdBy: userDetail.fullName,
      description: specifyDetails,
      status: 9, // bayAllocated
      createdAt: new Date(),
    };
    const updatedFields = {
      $push: { logs: logEntry },
      statusInfo: {
        createdBy: userDetail.fullName,
        description: specifyDetails,
        status: 3, // bayAllocated
        createdAt: new Date(),
      },
      'bayInfo.jobBayQrCode': job_QrCodePath, // Set the job_QrCode path here within the bayInfo object
      'bayInfo.name': bay.name, // Update status property of bayInfo
      'bayInfo.groupId': bay.groupId, // Update status property of bayInfo
      'bayInfo._id': bay._id, // Include bayId property in bayInfo
      status: 3,
      specifyDetails: specifyDetails ? specifyDetails : '', // Include specifyDetails in the updatedFields
    };

    

    // Update the status_info field
    const updatedJob = await Job.findOneAndUpdate({ _id: _id }, updatedFields, { new: true });

    // Update the status in the Bays collection
    await Bays.updateOne({ _id: bayId }, { $set: { status: 2 } });

    return res.status(200).json({ status: 1, message: 'Bay assignment successful.', jobInfo: updatedJob, });



    // return res.status(200).json({ status: 1, message: commonFunction.translate('bay allocated successfully', reqQuery.language) });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: -1, message: commonFunction.translate('internet server error', reqQuery.language) });
  }
});


router.post('/bayAllocateToJob', async (req, res) => {
  const reqQuery = req.query;
  try {
    const { bayId, _id, specifyDetails, createdById } = req.body;

    if (!req.body.bayId || !req.body._id) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##validation error##', reqQuery.language) });
    }

    const bay = await Bays.findOne({ _id: bayId }, { name: 1, _id: 1, groupId: 1 });
    if (!bay) {
      return res.status(404).json({ status: -2, message: commonFunction.translate('##bay not found##', reqQuery.language) });
    }
    if (bay.status === 2) {
      return res.status(400).json({ status: -3, message: commonFunction.translate('##bay is already occupied##', reqQuery.language) });
    }

    // Find the job in the database
    const job = await Job.findById(_id);
    if (!job) {
      return res.status(404).json({ status: -1, message: commonFunction.translate('##job not found##', reqQuery.language) });
    }

    // Extract the consignmentId from the job (adjust the field name accordingly)
    const consignmentId = job.consignmentId;

    // Generate the QR code content for bayInfo
    const bayInfoQrCodeContent = JSON.stringify({ consignmentId, jobId: _id, bayId });

    // Generate the QR code for bayInfo
    const bayInfoQrCode = await qr.toDataURL(bayInfoQrCodeContent);

    // Define the folder path to save the bayInfo QR code (inside the consignmentId folder)
    const consignmentFolder = path.join(__dirname, '..', 'public', 'inbound', consignmentId);

    // Create the consignment folder if it doesn't exist
    if (!fs.existsSync(consignmentFolder)) {
      fs.mkdirSync(consignmentFolder, { recursive: true });
    }

    // Define the file path to save the bayInfo QR code inside the consignment folder
    const bayInfoQrCodeFileName = `${bayId}_bayInfo.png`; // Use _id, bayId, and "bayInfo" as the file name
    const bayInfoQrCodeFilePath = path.join(consignmentFolder, bayInfoQrCodeFileName);

    // Save the bayInfo QR code image to the file
    await fs.promises.writeFile(bayInfoQrCodeFilePath, bayInfoQrCode.replace(/^data:image\/png;base64,/, ''), 'base64');

    // Set the path for job_QrCode
    const job_QrCodePath = `inbound/${consignmentId}/${bayInfoQrCodeFileName}`;

    if (req.body.createdById == undefined) {
      var userDetail = await userModel.findOne({}, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 });
    } else {
      var userDetail = await userModel.findOne({ _id: req.body.createdById }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 });
    }

    if (userDetail.length == 0) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##user not found##', reqQuery.language) });
    }

    const logEntry = {
      bayInfo: bay,
      createdBy: userDetail.fullName,
      description: specifyDetails,
      status: 9, // bayAllocated
      createdAt: new Date(),
    };
    const updatedFields = {
      $push: { logs: logEntry },
      statusInfo: {
        createdBy: userDetail.fullName,
        description: specifyDetails,
        status: 3, // bayAllocated
        createdAt: new Date(),
      },
      'bayInfo.jobBayQrCode': job_QrCodePath, // Set the job_QrCode path here within the bayInfo object
      'bayInfo.name': bay.name, // Update status property of bayInfo
      'bayInfo.groupId': bay.groupId, // Update status property of bayInfo
      'bayInfo._id': bay._id, // Include bayId property in bayInfo
      status: 3,
      specifyDetails: specifyDetails ? specifyDetails : '', // Include specifyDetails in the updatedFields
      loadStatus: 1, // Set loadStatus to 1
      gateStatus: 1, // Set gateStatus to 1
    };

    

    // Update the status_info field
    const updatedJob = await Job.findOneAndUpdate({ _id: _id }, updatedFields, { new: true });

    // Update the status in the Bays collection
    await Bays.updateOne({ _id: bayId }, { $set: { status: 2 } });

    return res.status(200).json({ status: 1, message: 'Bay assignment successful.', jobInfo: updatedJob, });



    // return res.status(200).json({ status: 1, message: commonFunction.translate('bay allocated successfully', reqQuery.language) });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: -1, message: commonFunction.translate('internet server error', reqQuery.language) });
  }
});



/**
 * @swagger
 * /job/delete:
 *   delete:
 *     summary: Delete an appointment
 *     description: "Status -1 => validation error || Status -2 => ##job not found ||Status 1 => job deleted successfully"
 *     tags:
 *       - Job
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 example: 646df4ab9bac06d857fcf386
 *             required:
 *               - _id
 *     responses:
 *       '200':
 *         description: Appointment deleted successfully
 *       '404':
 *         description: Appointment not found
 *       '500':
 *         description: Failed to delete appointment
 */

router.delete('/delete', async (req, res) => {
  const reqQuery = req.query;
  try {
    const jobInfo = await Job.findOne({ _id: req.body._id }, { gateInfo: 1, bayInfo: 1, consignmentId: 1 });
    if (!jobInfo) {
      return res.status(500).json({ status: -2, message: commonFunction.translate('##job not found##', reqQuery.language) });
    }

    const jobId = await Job.findByIdAndDelete(req.body._id);
    return res.status(200).json({ status: 1, message: commonFunction.translate('##job deleted successfully##', reqQuery.language) });

  } catch (error) {
    return res.status(404).json({ status: -1, message: commonFunction.translate('##internet Server error##', reqQuery.language) });
  }
});


/**
 * @swagger
 * /job/gateSecurityList:
 *   post:
 *     summary: Get gate security list
 *     tags: [Job]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GateSecurityListRequest'
 *           example:
 *             consignmentId: ""
 *             status: "0"
 *             searchTerm: ""
 *             gateId: ""
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GateSecurityListResponse'
 *       400:
 *         description: Gate not assigned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * components:
 *   schemas:
 *     GateSecurityListRequest:
 *       type: object
 *       properties:
 *         consignmentId:
 *           type: string
 *         status:
 *           type: string
 *           enum: ['0', '1', '2', '3']
 *         searchTerm:
 *           type: string
 *         gateId:
 *           type: string
 *
 *     GateSecurityListResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: number
 *         message:
 *           type: string
 *         newBookingCount:
 *           type: number
 *         documentVerifiedCount:
 *           type: number
 *         bayAllocatedCount:
 *           type: number
 *         available:
 *           type: number
 *         occupied:
 *           type: number
 *         jobList:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/JobDetail'
 *
 *     JobDetail:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         specialRequest:
 *           type: string
 *         consignmentId:
 *           type: string
 *         status:
 *           type: string
 *         gateId:
 *           type: string
 *         gateInfo:
 *           type: object
 *
 *     Error:
 *       type: object
 *       properties:
 *         status:
 *           type: number
 *         message:
 *           type: string
 */

router.post('/gateSecurityList', async (req, res) => {
  try {
    const { consignmentId, status, searchTerm, gateId } = req.body;

    var gateInfo = await Gate.findOne({ _id: gateId }).sort({ _id: 1 });

    const query = {};
    if (consignmentId) {
      query.consignmentId = consignmentId;
    }

    if (status !== '0') {
      const statusInt = parseInt(status);
      if (statusInt >= 1 && statusInt <= 3) {
        query.status = statusInt;
      }
    }

    if (searchTerm !== '') {
      const searchRegex = new RegExp(searchTerm, 'i');
      query.$or = [
        { consignmentId: searchRegex },
        { specialRequest: searchRegex },
      ];
    }

    if (gateInfo == null) {
      return res.status(400).json({ "status": -1, message: "Gate Not Assigned" });
    }

    if (gateId != undefined) {
      query['gateInfo._id'] = gateInfo._id;
    }
    // query.status = { $in: [1,2,3] };
    // // console.log("query",query);
    const jobList = await Job.find(query).sort({ _id: -1 });

    const jobListFinal = jobList.map((element) => {
      const clientName = element.clientDetail ? element.clientDetail.name : '';

      const jobDetail = {
        id: element._id,
        specialRequest: element.specialRequest,
        consignmentId: element.consignmentId,
        statusID: element.status,
        bayInfo: element.bayInfo,
        status: commonFunction.getStatusLabel(element.status),
        gateId: element.gateId,
        gateInfo: element.gateInfo ? element.gateInfo : {},
        gateStatus: element.gateStatus? element.gateStatus:0,
        bookingDate: element.bookingDate,
        bookingTime: element.bookingTime,
        clientName: clientName,
      };

      return jobDetail;
    });
const wareHouseId=req.body.wareHouseId;
const companyId=req.body.companyId;

    const newBookingCount = await Job.countDocuments({ status: 1, 'gateInfo._id': gateInfo._id });
    const documentVerifiedCount = await Job.countDocuments({ status: 2, 'gateInfo._id': gateInfo._id });
    const bayAllocatedCount = await Job.countDocuments({ status: { $nin: [1, 2] }, 'gateInfo._id': gateInfo._id });
    const availableCount = await Bays.countDocuments({ status: 1, groupId: 1,wareHouseId,companyId });
    const occupiedCount = await Bays.countDocuments({ status: 2, groupId: 1 ,wareHouseId,companyId});

    return res.status(200).json({ status: 1, message: commonFunction.translate('##success##', req.query.language), newBookingCount: newBookingCount, documentVerifiedCount: documentVerifiedCount, bayAllocatedCount: bayAllocatedCount, available: availableCount, occupied: occupiedCount, jobList: jobListFinal });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: -1, message: commonFunction.translate('##internal Server error##', req.query.language) });
  }
});

// getById
/**
 * @swagger
 * /job/getById:
 *   post:
 *     summary: Find an appointment by ID
 *     tags: [Job]
 *     description: "Status -1 => validation error||Status -2 => job not found || Status 1 => success"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AppointmentFindIdRequest'
 *           example:
 *             _id: "60a67da37c213e2564a4e73d"
 *     responses:
 *       '200':
 *         description: Success response
 *       '500':
 *         description: Internal server error
 */

router.post('/getByIdCopy', async (req, res) => {
  const reqQuery = req.query;
  try {
    const reqBody = req.body;
    if (!reqBody._id) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##validation error##', reqQuery.language) });
    }
    const job = await Job.findOne({ _id: reqBody._id });
    if (!job) {
      return res.status(404).json({ status: -2, message: commonFunction.translate('##job not found##', reqQuery.language) });
    }

    let skuArray = job.skuDetails.map((data) => {
      return data["msku"]
    });

    let packageDataArray = await ProductDetail.find({ "msku": { $in: skuArray } })
    job.packageInfo = packageDataArray;


    return res.status(200).json({ status: 1, message: commonFunction.translate('##success##', reqQuery.language), responseData: job });
  } catch (error) {
    // console.log(error);
    return res.status(500).json({ status: -1, message: commonFunction.translate("##internet Server error##", reqQuery.language) });
  }
});


router.post('/getById', async (req, res) => {
  const reqQuery = req.query;
  try {
    const reqBody = req.body;
    if (!reqBody._id) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##validation error##', reqQuery.language) });
    }
    const job = await Job.findOne({ _id: reqBody._id });
    if (!job) {
      return res.status(404).json({ status: -2, message: commonFunction.translate('##job not found##', reqQuery.language) });
    }

    // Extract msku values from skuDetails array
    const skuArray = job.skuDetails.map(data => data.materialCode);

    // Find packageDataArray based on msku values
    const packageDataArray = await ProductDetail.find({ materialCode: { $in: skuArray } });

    // Assign packageDataArray to the job's packageInfo field
    job.packageInfo = packageDataArray;

    return res.status(200).json({
      status: 1,
      message: commonFunction.translate('##success##', reqQuery.language),
      responseData: job
    });
  } catch (error) {
    return res.status(500).json({ status: -1, message: commonFunction.translate("##internet Server error##", reqQuery.language) });
  }
});


/**
 * @swagger
 * /job/detail:
 *   post:
 *     summary: Get appointment details
 *     description: "Status -1 => validation error || Status -2 => Job not found || Status 1 => success"
 *     tags: [Job]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AppointmentDetailRequest'
 *           example:
 *             jobId: "60a67da37c213e2564a4e73d"
 *     responses:
 *       200:
 *         description: Appointment details found successfully
 *       404:
 *         description: Job not found
 *       500:
 *         description: Internal Server Error
 */

router.post('/detail', async (req, res) => {
  const reqQuery = req.query;
  try {
    const reqBody = req.body;
    if (!req.body.jobId) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##jobId not found##', reqQuery.language) });
    }

    const { jobId } = req.body;

    const job = await Job.findById(jobId).populate('clientId', 'address').select('shipmentDetail bookingDate bookingTime invoiceNo consignmentId bayInfo specifyDetails');

    if (!job) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##job not found##', reqQuery.language) });
    }

    const { clientId, shipmentDetail, bookingDate, bookingTime } = job;

    const { inboundShipmentType } = shipmentDetail;

    const { address } = clientId;

    const appointmentDetail = {
      jobId,
      address,
      inboundShipmentType,
      bookingDate: job.bookingDate,
      bookingTime: job.bookingTime,
      consignmentNo: job.consignmentId,
      invoiceNo: job.invoiceNo,
      consignmentDate: job.bookingDate,
      availableBays: [],
      occupiedBays: [],
      bayInfo: job.bayInfo,
      specifyDetails: job.specifyDetails
    };

    var query = {};
    if (reqBody.wareHouseId != undefined && reqBody.wareHouseId != "") {
      query.wareHouseId = new mongoose.Types.ObjectId(reqBody.wareHouseId);
    }
    if (reqBody.companyId != undefined && reqBody.companyId != "") {
      query.companyId = new mongoose.Types.ObjectId(reqBody.companyId);
    }
    query.groupId = 1;
    query.status = 1;
    // const availableBays = await Bays.find({ groupId: 1, status: 1 }).select('name');
    const availableBays = await Bays.find(query).select('name');
    query.status = 2;
    // const occupiedBays = await Bays.find({ groupId: 1, status: 2 }).select('name');
    const occupiedBays = await Bays.find(query).select('name');

    availableBays.forEach((bay) => {
      appointmentDetail.availableBays.push(bay.name);
    });

    occupiedBays.forEach((bay) => {
      appointmentDetail.occupiedBays.push(bay.name);
    });

    return res.status(200).json({ status: 1, message: commonFunction.translate('##success##', reqQuery.language), responseData: appointmentDetail });
  } catch (error) {
    // console.log(error);
    return res.status(500).json({ status: -1, message: commonFunction.translate('##internet Server error##', reqQuery.language) });
  }
});

/**
 * @swagger
 * /job/consignments:
 *   post:
 *     summary: Get a list of consignments
 *     tags: [Job]
 *     description: "Status -1 => validation error || Status 1 => success"
 *     responses:
 *       200:
 *         description: Consignment list retrieved successfully
 *       500:
 *         description: Failed to retrieve consignment list
 */

//consignmentList
router.post('/consignments', async (req, res) => {
  const reqQuery = req.query;
  try {
    const jobList = await Job.find({}, { consignmentId: 1 });

    if (jobList.length === 0) {
      return res.status(404).json({ status: -1, message: commonFunction.translate('##data not found##', reqQuery.language) });
    }

    return res.status(200).json({ status: 1, message: commonFunction.translate('##success##', reqQuery.language), responseData: jobList });

  } catch (err) {
    return res.status(500).json({ status: -1, message: commonFunction.translate('##internet Server error##', reqQuery.language) });
  }
});

/**
 * @swagger
 * /job/log:
 *   post:
 *     summary: Get the logs for a job
 *     tags: [Job]
 *     description: "<b>Req param's: </b> status 1=> bookingCreated, status 2=> InformationUpdate, status 3=> DocumentVerified status 4=> BayAllocated ||  status -1=> validation error,status -2=>job not found, status 1=> success <br><br><b>  "
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LogRequest'
 *           example:
 *             _id: "646c56a1c82998fd14374b09"
 *     responses:
 *       200:
 *         description: Logs retrieved successfully
 *       400:
 *         description: Missing job ID in the request body
 *       404:
 *         description: Job not found
 *       500:
 *         description: Internal server error
 */

router.post('/log', async (req, res) => {
  const reqQuery = req.query;
  try {
    const { _id } = req.body;

    if (!_id) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##validation error##', reqQuery.language) });
    }

    const job = await Job.findOne({ _id: req.body._id }, { logs: 1, consignmentId: 1 });

    if (!job) {
      return res.status(404).json({ status: -2, message: commonFunction.translate('##job not found##', reqQuery.language) });
    }

    job.logs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    var finalList = [];

    job.logs.forEach(function (element) {
      var obj = {};
      obj.date = new Date(element.createdAt).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
      obj.data = [];

      var time = new Date(element.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
      var dataObj = {
        time: time,
        createdBy: element.createdBy ? element.createdBy : '',
        description: element.description ? element.description : '',
      };
      dataObj.status = commonFunction.getLogStatusLabel(element.status);
      obj.data.push(dataObj);

      var existingObj = finalList.find((item) => item.date === obj.date);
      if (existingObj) {
        existingObj.data.push(dataObj);
      } else {
        finalList.push(obj);
      }
    });

    return res.status(200).json({ status: 1, message: commonFunction.translate('##success##', reqQuery.language), 'consignmentId': job.consignmentId, 'logs': finalList });
  } catch (err) {
    // console.log(err);
    return res.status(500).json({ status: -1, message: commonFunction.translate('##internet Server error##', reqQuery.language) });
  }
});

/**
 * @swagger
 * tags:
 *   - Job
 * paths:
 *   /job/skuCreate:
 *     post:
 *       tags:
 *         - Job
 *       summary: Create SKU details
 *       description: Create SKU details and update the job document
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 excelFile:
 *                   type: string
 *                   format: binary
 *                 _id:
 *                   type: string
 *                 skuDetails:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       msku:
 *                         type: string
 *                       title:
 *                         type: string
 *                       information:
 *                         type: string
 *                       units:
 *                         type: number
 *                       uom:
 *                         type: string
 *             example:
 *               _id: "64a5287182ec4d034cfc58c2"
 *               skuDetails:
 *                 - msku: "SKU1"
 *                   title: "mobile"
 *                   information: "Sample information"
 *                   units: 10
 *                   uom: "kg"
 *       responses:
 *         200:
 *           description: Successful operation
 *         400:
 *           description: Bad request
 *         404:
 *           description: Resource not found
 *         500:
 *           description: Internal server error
 */

const upload = multer();


router.post('/skuCreate', upload.single('excelFile'), async (req, res) => {
  const reqQuery = req.query;
  try {
    const reqBody = req.body;
    let { _id, skuDetails, wareHouseId, companyUserId, companyId, createdById } = req.body;
    // _id = _id.trim();

    if (!_id) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##job id not found##', reqQuery.language) });
    }

    const job = await Job.findById(_id);

    if (!job) {
      return res.status(404).json({ status: -1, message: commonFunction.translate('##validation error##', reqQuery.language) });
    }

    let skuDetailsArray = [];

    if (req.file) {
      const fileExtension = req.file.originalname.split('.').pop().toLowerCase();

      if (fileExtension !== 'xlsx') {
        return res.status(400).json({ status: -3, message: commonFunction.translate('##Invalid file type. Only Excel files (xlsx) are allowed##', reqQuery.language) });
      }

      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = xlsx.utils.sheet_to_json(worksheet);

      const isValidSkuDetails = jsonData.every((data) => (
        data.materialCode && data.title && data.information && data.uom && data.expectedQuantity && data.rackType
      ));

      if (!isValidSkuDetails) {
        return res.status(400).json({ status: -4, message: commonFunction.translate('##Invalid skuDetail data in the Excel file##', reqQuery.language) });
      }

      skuDetailsArray = jsonData.map((data) => ({
        materialCode: data.materialCode,
        title: data.title,
        information: data.information,
        rackType: data.rackType,
        plantCode: data.plantCode ? data.plantCode : '',
        expectedQuantity: parseInt(data.expectedQuantity),
        uom: data.uom,
      }));
    } else if (skuDetails && skuDetails.length > 0) {
      skuDetailsArray = Array.isArray(skuDetails) ? skuDetails : [skuDetails];
    } else {
      return res.status(400).json({ status: -5, message: commonFunction.translate('##Missing skuDetails##', reqQuery.language) });
    }
    if (skuDetailsArray.length == 0) {
      return res.status(400).json({ status: -5, message: commonFunction.translate('##Missing skuDetails##', reqQuery.language) });
    }
    for (const skuDetail of skuDetailsArray) {
      if (skuDetail.materialCode.trim() == "") {
        return res.status(400).json({ status: -5, message: commonFunction.translate('##Missing skuDetails##', reqQuery.language) });
      }
      const existingProductDetail = await ProductDetail.findOne({ materialCode: skuDetail.materialCode });

      if (existingProductDetail) {
        const existingJobSkuDetailIndex = job.skuDetails.findIndex((sku) => sku.materialCode === skuDetail.materialCode);

        if (existingJobSkuDetailIndex !== -1) {
          job.skuDetails[existingJobSkuDetailIndex].expectedQuantity += parseInt(skuDetail.expectedQuantity);
        } else {
          job.skuDetails.push({ materialCode: skuDetail.materialCode, title: skuDetail.title, information: skuDetail.information, expectedQuantity: skuDetail.expectedQuantity, uom: skuDetail.uom, plantCode: skuDetail.plantCode, type: skuDetail.type ,rackType:skuDetail.rackType });
        }
      } else {
        skuDetail.companyUserInfo = await userModel.findOne({ _id: companyUserId }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1, companyInfo: 1 });
        skuDetail.wareHouseId = wareHouseId;
        skuDetail.companyId = companyId;
        const newProductDetail = await ProductDetail.create(skuDetail);
        job.skuDetails.push({ materialCode: skuDetail.materialCode, title: skuDetail.title, information: skuDetail.information, expectedQuantity: skuDetail.expectedQuantity, uom: skuDetail.uom, plantCode: skuDetail.plantCode, type: skuDetail.type,rackType:skuDetail.rackType  });
      }
    }
    if (req.body.createdById == undefined) {
      var userDetail = await userModel.findOne({}, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 });
    } else {
      var userDetail = await userModel.findOne({ _id: req.body.createdById }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 }
      );
    }
    // const userDetail = await userModel.findOne({ /* role: 3 */ _id: createdBy }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 });

    if (!userDetail) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##user not found##', reqQuery.language) });
    }
    var dataDesc = userDetail.fullName + '  added specific details about the product the information such as the quantity, model, color, and any additional features of the devices.'

    const newLog = {
      description: dataDesc,
      status: 2,//skuCreate
      createdBy: userDetail.fullName,
      createdAt: new Date(),
    };

    job.logs.push(newLog);

    await job.save();

    const updatedJob = await Job.findById(_id).populate('skuDetails');

    let skuDataArray = updatedJob.skuDetails.map(skuDetail => skuDetail.toObject());

    for (let i = 0; i < skuDataArray.length; i++) {
      const correspondingPackageInfo = await ProductDetail.findOne({ materialCode: skuDataArray[i].materialCode });
      if (correspondingPackageInfo) {
        skuDataArray[i].packageInfo = correspondingPackageInfo.toObject();
      }
    }

    await updatedJob.save();

    let skuDetail = skuDataArray.map(sku => ({
      _id: sku._id,
      materialCode: sku.materialCode,
      title: sku.title,
      information: sku.information,
      plantCode: sku.plantCode,
      rackType: sku.rackType,
      expectedQuantity: sku.expectedQuantity,
      uom: sku.uom,
    }));
    let skuArray = skuDetail.map((data) => {
      return data["materialCode"]
    })

    let packageDataArray = await ProductDetail.find({ "materialCode": { $in: skuArray } })

    let result = {
      _id: _id,
      skuDetails: skuDetails,
      packageInfo: packageDataArray
    }

    return res.status(200).json({ status: 1, message: commonFunction.translate('##skuDetails created successfully##', reqQuery.language), "responseData": result });
  } catch (err) {
    console.log("err", err);
    return res.status(500).json({ status: -1, message: commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});





/**
 * @swagger
 * /job/skuUpdate:
 *   post:
 *     summary: Update SKU details
 *     tags: [Job]
  *     description: "<b>Req param's: </b> status -1=> validation error,status -2=>job sku detail not updated,status 1=> SkuDetails updated successfully=> <br><br><b>"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 description: The ID of the job
 *               skuDetails:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: The ID of the SKU detail to update
 *                   msku:
 *                     type: string
 *                     description: The updated msku value
 *                   title:
 *                     type: string
 *                     description: The updated title value
 *                   information:
 *                     type: string
 *                     description: The updated information value
 *                   units:
 *                     type: string
 *                     description: The updated units value
 *                   uom:
 *                     type: string
 *                     description: The updated uom value
 *             example:
 *               _id: "646c56a1c82998fd14374b09"
 *               skuDetails:
 *                 _id: "610f97d6c8299830fc239d7f"
 *                 msku: "UpdatedSKU123"
 *                 title: "Updated Product 1"
 *                 information: "Updated Information 1"
 *                 units: "15"
 *                 uom: "kg"
 *     responses:
 *       200:
 *         description: SKU details updated successfully
 *       400:
 *         description: Bad request or validation error
 *       404:
 *         description: Job or SKU detail not found
 *       500:
 *         description: Internal server error
 */


router.post('/skuUpdate', async (req, res) => {
  const reqQuery = req.query;

  try {
    const { _id, skuDetails } = req.body;

    const job = await Job.findById(_id);
    if (!job || !_id) {
      return res.status(404).json({ status: -1, message: commonFunction.translate('##job id not found##', reqQuery.language) });
    }

    const isValidObjectId = mongoose.Types.ObjectId.isValid(_id);
    const isValidSkuDetailsObjectId = mongoose.Types.ObjectId.isValid(skuDetails._id);
    if (!isValidObjectId || !isValidSkuDetailsObjectId) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##validation error:invalid id or skuDetails id format##', reqQuery.language) });
    }

    const result = await Job.updateOne({ _id, 'skuDetails._id': skuDetails._id }, { $set: { 'skuDetails.$': skuDetails } });

    if (result.nModified === 0) {
      return res.status(404).json({ status: -2, message: commonFunction.translate('##job sku detail not updated##', reqQuery.language) });
    }
    if (req.body.createdById == undefined) {
      var userDetail = await userModel.findOne({}, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 }
      );
    } else {
      var userDetail = await userModel.findOne({ _id: req.body.createdById }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 }
      );
    }

    // const userDetail = await userModel.findOne({ /* role: 3 */ _id: createdBy }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 });

    if (!userDetail) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##user not found##', reqQuery.language) });
    }
    var dataDesc = userDetail.fullName + ' added specific details about the product the information such as the quantity, model, color, and any additional features of the  devices.'

    const newLog = {
      description: dataDesc,
      status: 3, // skuDetailUpdate status
      createdBy: userDetail.fullName,
      createdAt: new Date(),
    };

    await Job.updateOne({ _id }, { $push: { logs: newLog } });

    // Retrieve the updated skuDetails 
    const updatedSkuDetails = await Job.findById(_id).select('skuDetails');

    return res.status(200).json({ status: 1, message: commonFunction.translate('##skuDetails updated successfully##', reqQuery.language), responseData: updatedSkuDetails.skuDetails });
  } catch (err) {
    // console.log(err);
    return res.status(500).json({ status: -1, message: commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});


/**
 * @swagger
 * /job/skuDelete:
 *   delete:
 *     summary: Delete SKU details
 *     tags: [Job]
  *     description: "<b>Req param's: </b> status -1=> validation error, status -3=> invalid jobId format,,status -4=> No job found with the provided jobId,status -5=> No skuDetailsId provided,status -6=> invalid skuDetailsId format,status -7=> job sku detail not deleted  1=> SkuDetails deleted successfully=> <br><br><b>"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 description: The ID of the job
 *               skuDetailsId:
 *                 type: string
 *                 description: The ID of the SKU details to delete
 *             example:
 *               _id: "646c56a1c82998fd14374b09"
 *               skuDetailsId: "646c56a1c82998fd14374b09"
 *     responses:
 *       200:
 *         description: SKU details deleted successfully
 *       400:
 *         description: Bad request or validation error
 *       404:
 *         description: Job or SKU detail not found
 *       500:
 *         description: Internal server error
 */

router.delete('/skuDelete', async (req, res) => {
  const reqQuery = req.query;
  try {
    const { _id, skuDetailsId } = req.body;

    // Check if jobId is provided
    if (!_id) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##job id is not found##', reqQuery.language) });
    }

    // Check if jobId is a valid ObjectId
    const isValidObjectId = mongoose.Types.ObjectId.isValid(_id);
    if (!isValidObjectId) {
      return res.status(400).json({ status: -3, message: commonFunction.translate('##invalid jobId format##', reqQuery.language) });
    }

    // Check if the job exists in the database
    const job = await Job.findById(_id);
    if (!job) {
      return res.status(404).json({ status: -4, message: commonFunction.translate('##No job found with the provided jobId##', reqQuery.language) });
    }

    // Check if skuDetailsId is provided
    if (!skuDetailsId) {
      return res.status(400).json({ status: -5, message: commonFunction.translate('##No skuDetailsId provided##', reqQuery.language) });
    }

    // Check if skuDetailsId is a valid ObjectId
    const isValidSkuDetailsObjectId = mongoose.Types.ObjectId.isValid(skuDetailsId);
    if (!isValidSkuDetailsObjectId) {
      return res.status(400).json({ status: -6, message: commonFunction.translate('##invalid skuDetailsId format##', reqQuery.language) });
    }

    const result = await Job.updateOne({ _id }, { $pull: { skuDetails: { _id: skuDetailsId } } });

    if (result.nModified === 0) {
      return res.status(404).json({ status: -7, message: commonFunction.translate('##job sku detail not deleted##', reqQuery.language) });
    }

    if (req.body.createdById == undefined) {
      var userDetail = await userModel.findOne({}, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 }
      );
    } else {
      var userDetail = await userModel.findOne({ _id: req.body.createdById }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 }
      );
    }
    // const userDetail = await userModel.find({ /* role: 3 */ _id: createdBy }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 });

    if (userDetail.length == 0) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##user not found##', reqQuery.language) });
    }
    var dataDesc = userDetail.fullName + ' added specific details about the product the information such as the quantity, model, color, and any additional features of the  devices.'


    const newLog = {
      description: dataDesc,
      status: 4, // skuDetailDelete status
      createdBy: userDetail.fullName,
      createdAt: new Date(),
    };

    await Job.updateOne({ _id }, { $push: { logs: newLog } });// skuDetailDelete status

    // Retrieve the remaining skuDetails 
    const remainingSkuDetails = await Job.findById(_id).select('skuDetails');

    return res.status(200).json({ status: 1, message: commonFunction.translate('##skuDetails deleted successfully##', reqQuery.language), responseData: remainingSkuDetails.skuDetails });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ status: -1, message: commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

/**
 * @swagger
 * /job/inboundCreate:
 *   post:
 *     summary: Create an inbound job
 *     tags: [Job]
 *     description: "Status -1 => validation missing || Status 1 => inbound job created successfully"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InboundCreateRequest'
 *     responses:
 *       200:
 *         description: Successful response
 *       400:
 *         description: Validation error
 *       404:
 *         description: Client not found
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     InboundCreateRequest:
 *       type: object
 *       properties:
 *         clientId:
 *           type: string
 *           description: The ID of the client
 *       example:
 *         clientId: "6491595a45c273046631b9f2"
 *
 *     InboundCreateResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: number
 *           description: The status code (1 for success)
 *         message:
 *           type: string
 *           description: The message corresponding to the status
 *         jobId:
 *           type: string
 *           description: The ID of the created inbound job
 *       example:
 *         status: 1
 *         message: "Inbound job created successfully"
 *         jobId: "60986f7f9fe32b61fcd3e500"
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
 *         message: "Validation error"
 */

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

router.post('/inboundCreate', async (req, res) => {
  const reqQuery = req.query;
  const reqBody = req.body;
  try {
    if (!reqBody.clientId) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##validation error##', reqQuery.language) });
    }

    const clientDetail = await Client.findOne({ _id: reqBody.clientId }, { _id: 1, name: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1, contactNumber: 1 });

    if (!clientDetail) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##client not found##', reqQuery.language) });
    }

    if (req.body.createdById == undefined) {
      var userDetail = await userModel.findOne({}, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 }
      );
    } else {
      var userDetail = await userModel.findOne({ _id: req.body.createdById }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 }
      );
    }

    if (!userDetail) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##user not found##', reqQuery.language) });
    }
    var dataDesc = userDetail.fullName + '  initiated the inbound process for the products from a supplier and preparing for their arrival.';

    const { consignmentId } = await getNextConsignmentId(reqBody.clientId);

    const userInfo = await userModel.findOne({ _id: reqBody.companyUserId }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1, companyInfo: 1 });
    reqBody.companyUserInfo = userInfo;

    const newJob = new Job({
      bayInfo: {},
      clientId: reqBody.clientId,
      consignmentId: consignmentId,
      jobId: consignmentId,
      clientDetail: clientDetail,
      vehicleDetail: {
        vehicleNo: '',
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
      invoiceNo: '',
      purchaseOrderNo: '',
      shipmentDetail: {
        from: '',
        to: '',
        titleNumber: '',
        description: '',
        inboundShipmentType: '',
        unloadShipmentType: ''
      },
      skuDetails: [],
      status: 1, // Inbound Created
      statusInfo: {
        status: 1, // Inbound Created
        createdBy: userDetail.fullName,
        createdAt: new Date(),
      },
      appointmentStatus: 1,
      specialRequest: '',
      specifyDetails: '',
      incoterms: '',
      vehicleDocVerified: false,
      otlLockingSystem: 0,
      otlImage: '',
      subtask: [],
      pallet: [],
      binAllocate: [],
      bookingDate: '',
      bookingTime: '',
      shipmentType: null,
      logs: [{
        description: dataDesc,
        status: 1, // Inbound Created
        createdBy: userDetail.fullName,
        createdAt: new Date(),
      }],
      comments: '',
      description: req.body.description ? req.body.description : '',
      type: 1,
      companyUserInfo: reqBody.companyUserInfo ? reqBody.companyUserInfo : {},
      wareHouseId: reqBody.wareHouseId ? reqBody.wareHouseId : '',
      companyId: reqBody.companyId ? reqBody.companyId : ''
    });

    // Save the new job
    const savedJob = await newJob.save();

    let stringdata = JSON.stringify({ consignmentId: consignmentId, jobId: savedJob._id });
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
      let fileName = consignmentId + "_QR.jpeg";
      try {
        const data = fs.writeFileSync("./public/inbound/" + consignmentId + "/" + fileName, imageBuffer, 'utf8');
        // console.log("data", data);
        const updateUser = await Job.updateOne({ _id: savedJob._id }, { $set: { qrCode: "inbound/" + consignmentId + "/" + fileName } });
        // console.log("updatesd", updateUser);
      } catch (e) {
        // console.log("test", e);
        next(e);
      }
    });

    return res.status(200).json({ status: 1, message: 'inbound job created successfully', jobId: savedJob._id, consignmentId: consignmentId, qrCode: "inbound/" + consignmentId + "/" + consignmentId + "_QR.jpeg" });
  } catch (error) {
    console.log('Error creating inbound job:', error);
    return res.status(500).json({ status: -1, message: 'internal server error' });
  }
});

/**
 * @swagger
 * /job/inboundUpdate:
 *   post:
 *     summary: Update an inbound job
 *     tags: [Job]
 *     description: "<b>Req param's: </b> status -1=>job not found , status 1=> inbound job updated successfully <br><br><b>"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jobId:
 *                 type: string
 *                 description: The ID of the job to update
 *               clientId:
 *                 type: string
 *                 description: The ID of the client associated with the job
 *               vehicleDetail:
 *                 type: object
 *                 description: The details of the vehicle associated with the job
 *                 properties:
 *                   vehicleNo:
 *                     type: string
 *                     description: The vehicle number
 *                   trailer:
 *                     type: string
 *                     description: The trailer number
 *                   containerNo:
 *                     type: string
 *                     description: The container number
 *                   estimatedTimeOfArrival:
 *                     type: string
 *                     format: date-time
 *                     description: The estimated time of arrival
 *               invoiceNo:
 *                 type: string
 *                 description: The invoice number
 *               purchaseOrderNo:
 *                 type: string
 *                 description: The purchase order number
 *               shipmentType:
 *                 type: number
 *                 description: The shipment type
 *               incoterms:
 *                 type: string
 *                 description: The incoterms
 *               skuDetails:
 *                 type: array
 *                 description: The details of the SKU
 *                 items:
 *                   type: object
 *                   properties:
 *                     msku:
 *                       type: string
 *                       description: The SKU identifier
 *                     title:
 *                       type: string
 *                       description: The title of the product
 *                     information:
 *                       type: string
 *                       description: Additional information about the product
 *                     units:
 *                       type: number
 *                       description: The number of units
 *                     uom:
 *                       type: string
 *                       description: The unit of measurement
 *               bookingDate:
 *                 type: string
 *                 format: date
 *                 description: The booking date
 *               bookingTime:
 *                 type: string
 *                 format: time
 *                 description: The booking time
 *             example:
 *               jobId: "648c358aaf0ad3eda48a3a16"
 *               clientId: "646c56a1c82998fd14374b09"
 *               vehicleDetail:
 *                 vehicleNo: "TN0012"
 *                 trailer: "T45678"
 *                 containerNo: "C78901"
 *                 estimatedTimeOfArrival: "2023-06-10 10:00 AM"
 *               invoiceNo: "INV002"
 *               purchaseOrderNo: "PO002"
 *               shipmentType: 1
 *               incoterms: "noble"
 *               skuDetails:
 *                 - msku: "SKU1"
 *                   title: "Product 1"
 *                   information: "Sample information"
 *                   units: 10
 *                   uom: "kg"
 *               bookingDate: "2023-06-14"
 *               bookingTime: "09:00"
 *     responses:
 *       200:
 *         description: Successful response
 *       404:
 *         description: Job not found
 *       500:
 *         description: Internal server error
 */


router.post('/inboundUpdate', async (req, res) => {
  const reqQuery = req.query;
  try {
    const jobId = req.body.jobId;

    const job = await Job.findOne({ _id: jobId });

    if (!job) {
      return res.status(404).json({ status: -1, message: 'Job not found' });
    }

    // if (!req.body.ifNotifyTrue) {
    //   return res.status(400).json({ status: -1, message: 'ifNotifyTrue not found' });
    // }

    const updateFields = req.body;

    const updatedJob = await Job.findByIdAndUpdate(jobId, updateFields, { new: true });

    if (!updatedJob) {
      return res.status(404).json({ status: -1, message: 'Job not found' });
    }

    // Calculate expectedProductCount in packageDetails
    updatedJob.packageDetails.forEach(package => {
      const expectedQuantity = parseFloat(package.expectedQuantity) || 1;
      const productCount = parseFloat(package.productCount) || 1;
      package.expectedProductCount = expectedQuantity * productCount;
    });

    if (req.body.createdById == undefined) {
      var userDetail = await userModel.findOne({}, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 }
      );
    } else {
      var userDetail = await userModel.findOne({ _id: req.body.createdById }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 }
      );
    }
    // Create a new log entry
    // const userDetail = await userModel.findOne({ _id: createdBy }, { _id: 1, fullName: 1 });
    var dataDesc = userDetail.fullName + ' made updates to the existing inbound process for the  product. The changes are adjusting the quantity, and added additional information related to the  devices.'

    const newLog = {
      description: dataDesc,
      status: 5,
      createdBy: userDetail.fullName,
      createdAt: new Date(),
    };

    // Push the new log to logs array
    updatedJob.logs.push(newLog);

    // Update the Job collection

    // Update the expectedProductQuantity in the package collection
    for (const package of updatedJob.packageDetails) {
      const packageId = package._id;
      await Package.updateOne(
        { "packageDetails._id": packageId },
        { $set: { "packageDetails.$.expectedProductQuantity": package.expectedProductCount } }
      );
    }

    const responsePackageDetails = updatedJob.packageDetails.map(package => ({
      ...package,
      expectedProductCount: package.productCount * (package.expectedQuantity || 1)
    }));



    const responseObject = {
      ...updatedJob.toObject(),
      packageDetails: responsePackageDetails
    };
    const data1 = await Job.updateOne({ _id: req.body.jobId }, { $set: updatedJob });

    // console.log("data1", data1);
    if (req.body.ifNotifyTrue == true) {
      if (job.qrCode != '' && job.qrCode != undefined) {
        var QrcodeURL = process.env.BASEURL + job.qrCode;
        var emailId = job.clientDetail.email;
        // var html = '<body><table style="width: 100%; border: none;"><thead style="background-color: #7EA8F8;"><tr><th style="border-width: 1px; border-color: #7EA8F8; border-style: solid; padding: 0px;">Ship From</th><th style="border-width: 1px; border-color: #7EA8F8; border-style: solid; padding: 0px;">Ship To</th></tr></thead><tbody><tr><td><br><b>' + job.clientDetail.name + '</b><div>' + job.clientDetail.address + '</div><div>' + job.clientDetail.country + '</div><div>' + job.clientDetail.state + '</div><div>' + job.clientDetail.city + '</div><div>' + job.clientDetail.country + '</div><div>' + job.clientDetail.contactNumber + '</div><br></td><td><br><b>Bosch</b><div>Tidel,IT sez,Coimbatore</div><div>TamilNadu</div><div>18981</div><div>India</div><div>+1 (113) 191-9776</div><br></td></tr></tbody></table><div style="background-color: #7EA8F8; border-width: 1px; border-color: #7EA8F8; border-style: solid; padding: 0px;"><center><div style="text-align: left;"><b>Booking Date & Time :</b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + req.body.bookingDate + '/' + req.body.bookingTime + '</div><div style="text-align: right;"><b>ConsignmentId:</b> ' + job.consignmentId + '</div></center></div><div style="border-width: 1px; border-color: #7EA8F8; border-style: solid; padding: 0px;"></div><center><img src="' + QrcodeURL + '"/></center><div style="border-width: 1px; border-color: #7EA8F8; border-style: solid; padding: 0px;"></div><br><center><b>PLEASE LEAVE THIS LABEL UNCOVERED</b></center></body>';
        var html = '<body><table style="width: 100%; border: none;"><thead style="background-color: rgb(0, 123, 192); color: #ffffffff;"><tr><th style="border-width: 1px; border-color: rgb(0, 123, 192); border-style: solid; padding: 3px;width: 50%;">Ship From</th><th style="border-width: 1px; border-color: rgb(0, 123, 192); border-style: solid; padding: 3px;width: 50%;">Ship To</th></tr></thead><tbody><tr><td><br><b>' + job.clientDetail.name + '</b><div>' + job.clientDetail.address + '</div><div>' + job.clientDetail.country + '</div><div>' + job.clientDetail.state + '</div><div>' + job.clientDetail.city + '</div><div>' + job.clientDetail.country + '</div><div>' + job.clientDetail.contactNumber + '</div><br></td><td><br><b>Bosch</b><div>Tidel,IT sez,Coimbatore</div><div>TamilNadu</div><div>18981</div><div>India</div><div>+1 (113) 191-9776</div><br></td></tr></tbody></table><table style="width: 100%; border: none;"><thead style="background-color: rgb(0, 123, 192); color: #ffffffff;"><tr><th style="border-width: 1px; border-color: rgb(0, 123, 192); border-style: solid; padding: 3px;width: 50%;">Booking Date & Time : ' + req.body.bookingDate + '/' + req.body.bookingTime + '</th><th style="border-width: 1px; border-color: rgb(0, 123, 192); border-style: solid; padding: 3px;width: 50%;">ConsignmentId: ' + job.consignmentId + '</th></tr></thead></table><center><img src="' + QrcodeURL + '"/></center><div style="border-width: 1px; border-color: rgb(0, 123, 192); border-style: solid; padding: 0px;"></div><br><center><b>PLEASE LEAVE THIS LABEL UNCOVERED</b></center></body>';
        commonFunction.sendEmail(emailId, 'LAS - Your Product Information Updated', html, 'Your Inbound information updated');
      }
    }
    return res.status(200).json({ status: 1, message: commonFunction.translate('##inbound updated successfully##', reqQuery.language), responseData: responseObject });
  } catch (error) {
    // console.log('Error updating inbound job:', error);
    return res.status(500).json({ status: -1, message: commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});



/**
 * @swagger
 * /job/ftlVerification:
 *   post:
 *     summary: Verify FTL (Full Truck Load)
 *     tags: [Job]
 *     description: Endpoint for FTL verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The ID of the user
 *               jobId:
 *                 type: string
 *                 description: The ID of the job
 *               type:
 *                 type: number
 *                 description: The type of verification
 *               ftlVerification:
 *                 type: object
 *                 properties:
 *                   barCode:
 *                     type: boolean
 *                     description: Indicates if bar code is verified
 *                   asnReceipt:
 *                     type: boolean
 *                     description: Indicates if ASN receipt is verified
 *                   uploadPhoto:
 *                     type: string
 *                     description: The uploaded photo path
 *                   isVerified:
 *                     type: boolean
 *                     description: Indicates if FTL is verified
 *             example:
 *               userId: "64a01263e62c29e3c6d8b515"
 *               jobId: "64a3cdbe2db3dfb6ecf65214"
 *               type: 1
 *               ftlVerification:
 *                 barCode: true
 *                 asnReceipt: true
 *                 uploadPhoto: "1685367592.jpg"
 *                 isVerified: true
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */

router.post('/ftlVerification', async (req, res) => {
  const reqQuery = req.query;
  try {
    const { jobId, type, ftlVerification, createdById } = req.body;

    if (!jobId) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##validation error##', reqQuery.language) });
    }

    const jobInfo = await Job.findOne({ _id: jobId }, { gateInfo: 1, bayInfo: 1, consignmentId: 1, clientId: 1, clientDetail: 1, vehicleDetail: 1, invoiceNo: 1, purchaseOrderNo: 1, shipmentDetail: 1, skuDetails: 1 });
    if (!jobInfo) {
      return res.status(404).json({ status: -3, message: commonFunction.translate('##job not found##', reqQuery.language) });
    }

    // Declare the updatedFields variable
    let updatedFields = {};
    updatedFields.documents = {}
    updatedFields.documents.inbound = {
      gs_ftlImages: [],
    }

    // Handling the uploadPhoto field
    if (ftlVerification.uploadPhoto && ftlVerification.uploadPhoto !== '') {
      const newUploadPhoto = ftlVerification.uploadPhoto;
      const uploadPhotoLength = newUploadPhoto.split('/');
      if (uploadPhotoLength.length === 1) {

        const movedUploadPhoto = await commonFunction.moveToSingleImage(newUploadPhoto, jobInfo.consignmentId);
        updatedFields.documents.inbound.movedUploadPhoto = newUploadPhoto;
        updatedFields.documents.inbound.gs_ftlImages.push(newUploadPhoto);
        // updatedFields.documents.inbound.movedUploadPhoto = movedUploadPhoto || req.body.movedUploadPhoto;
        // updatedFields.documents.inbound.gs_movedUploadPhoto.push(movedUploadPhoto || req.body.movedUploadPhoto);
        ftlVerification.uploadPhoto = newUploadPhoto;
      }
    } else {
      ftlVerification.uploadPhoto = ''; // Set uploadPhoto to an empty string
    }
    // console.log("ftlVerification", ftlVerification);

    if (req.body.createdById == undefined) {
      var userDetail = await userModel.findOne({}, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 }
      );
    } else {
      var userDetail = await userModel.findOne({ _id: createdById }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 }
      );
    }
    // const userDetail = await userModel.findOne({ /* role: 3 */ _id: createdBy }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 });
    if (userDetail == null) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##user not found##', reqQuery.language) });
    }
    var dataDesc = userDetail.fullName + 'initiated the Document verification process. The checking of vehicle document and other details containing the  products.'

    let logEntry = {};
    let statusInfo = {};
    let jobStatus = 0;

    if (type === 1) {
      logEntry = {
        createdBy: userDetail.fullName,
        description: dataDesc,
        status: 13, // FTLApproved
        createdAt: new Date()
      };
      statusInfo = {
        status: 4, // Dock Verified
        createdBy: userDetail.fullName,
        createdAt: new Date(),
      };
      jobStatus = 4; // Dock Verified
    } else if (type === 2) {
      logEntry = {
        createdBy: userDetail.fullName,
        description: 'test',
        status: -2, // Reject from FTL verification
        createdAt: new Date()
      };
      statusInfo = {
        status: -2, // FTL Reject
        createdBy: userDetail.fullName,
        createdAt: new Date(),
      };
      jobStatus = -2;

      await Job.updateOne(
        { _id: jobId },
        { $set: { type, ftlVerification, status: jobStatus, statusInfo }, $push: { logs: logEntry } }
      );

      return res.status(200).json({ status: -1, message: commonFunction.translate('##otl rejected##', reqQuery.language) });
    } else {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##invalid type value##', reqQuery.language) });
    }
    // await Job.updateOne(
    //   { _id: jobId },
    //   { $set: { otlLockingSystem: type, status: jobStatus, statusInfo, ftlVerification}, $push: { logs: logEntry } },
    //   {$set:{updatedFields}}
    // );
    await Job.updateOne({ _id: jobId }, { $set: { otlLockingSystem: type, status: jobStatus, statusInfo, ftlVerification, 'documents.inbound.gs_ftlImages': updatedFields.documents.inbound.gs_ftlImages }, $push: { logs: logEntry } });

    return res.status(200).json({ status: 1, message: commonFunction.translate('##otl verify successfully##', reqQuery.language) });
  } catch (error) {
    // console.log(error);
    return res.status(500).json({ status: -1, message: commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});



//gateAssignToJob
/**
 * @swagger
 * /job/gateAssignToJob:
 *   post:
 *     summary: Assign a gate to a job
 *     tags: [Job]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GateAssignToJobRequest'
 *           example:
 *             jobId: "63ff3dc1ffcf72981d761649"
 *             gateId: "63ff3dc1ffcf72981d761648"
 *     responses:
 *       200:
 *         description: Successful response
 *       404:
 *         description: Gate not found or Job not found
 *       500:
 *         description: Internal server error
 *
 * components:
 *   schemas:
 *     GateAssignToJobRequest:
 *       type: object
 *       properties:
 *         jobId:
 *           type: string
 *           description: The ID of the job to assign the gate to
 *         gateId:
 *           type: string
 *           description: The ID of the gate to assign to the job
 *     GateAssignToJobResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: number
 *           description: The status code (1 for success)
 *         message:
 *           type: string
 *           description: The response message
 *         gateId:
 *           type: string
 *           description: The ID of the assigned gate
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: The error message
 */


router.post('/gateAssignToJob', async (req, res) => {
  const reqQuery = req.query;
  const { jobId, gateId, createdById } = req.body;

  try {
    // Retrieve the gate details based on the provided gateId
    const gateDetails = await Gate.findOne({ _id: req.body.gateId }, { _id: 1, name: 1, type: 1 });

    if (!gateDetails) {
      return res.status(404).json({ status: -1, message: 'Gate not found' });
    }
    if (req.body.createdById == undefined) {
      var userDetail = await userModel.findOne({}, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 }
      );
    } else {
      var userDetail = await userModel.findOne({ _id: createdById }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 }
      );
    }

    // const userDetail = await userModel.findOne({ /* role: 3 */ _id: createdBy }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 });

    if (userDetail == null) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##user not found##', reqQuery.language) });
    }
    var dataDesc = userDetail.fullName + ' assigned the responsibility of managing a specific gate during the shipment process for the products. This included ensuring smooth flow of incoming goods to gate security'


    // const updatedJob = await Job.findByIdAndUpdate(jobId, { gateId: gateId, "gateInfo._id": gateId, "gateInfo.name": gateDetails.name }, { new: true });
    const updatedJob = await Job.findByIdAndUpdate(
      jobId,
      {
        gateInfo: gateDetails,
        $push: {
          logs: {
            createdBy: userDetail.fullName,
            description: dataDesc,
            status: 8,//GATEASSIGN
            createdAt: new Date(),
            gateInfo: gateDetails
          }
        }
      },
      { new: true }
    );

    // console.log("updatedJob", updatedJob)


    if (!updatedJob) {
      return res.status(404).json({ status: -1, message: 'Job not found' });
    }

    const jobList = await Job.find({});

    const jobListFinal = jobList.map((element) => {
      const jobDetail = {
        id: element._id,
        consignmentId: element.consignmentId,
        status: commonFunction.getStatusLabel(element.status),
        gateId: element.gateId,
        gateInfo: element.gateInfo ? element.gateInfo : {},
        bayId: element.bayId,
        bayInfo: element.bayInfo ? element.bayInfo : {},
        clientName: element.clientId.name,
        bookingDate: element.bookingDate,
      };
      return jobDetail;
    });

    const responseObj = { status: 1, message: 'Gate is assigned to the job', jobId: jobId, gateInfo: { _id: gateId, name: gateDetails.name }, jobList: jobListFinal };
    return res.status(200).json(responseObj);
  } catch (error) {
    // console.log(error);
    return res.status(500).json({ status: -1, message: commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});


/**
 * @swagger
 * /job/skuList:
 *   post:
 *     summary: Get SKU List
 *     tags: [Job]
 *     description: Retrieve the SKU details from all job documents
 *     requestBody:
 *       required: false
 *     responses:
 *       '200':
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                 message:
 *                   type: string
 *                 responseData:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       msku:
 *                         type: string
 *                         description: The SKU identifier
 *                       title:
 *                         type: string
 *                         description: The title of the product
 *                       information:
 *                         type: string
 *                         description: Additional information about the product
 *                       units:
 *                         type: number
 *                         description: The number of units
 *                       uom:
 *                         type: string
 *                         description: The unit of measurement
 *             example:
 *               status: 1
 *               message: SkuDetails retrieved successfully
 *               responseData:
 *                 - msku: "SKU1"
 *                   title: "Product 1"
 *                   information: "Sample information"
 *                   units: 10
 *                   uom: "kg"
 *                 - msku: "SKU2"
 *                   title: "Product 2"
 *                   information: "Sample information"
 *                   units: 5
 *                   uom: "pieces"
 *       '500':
 *         description: Internal server error
 */


router.post('/skuList', async (req, res) => {
  const reqQuery = req.query;
  try {
    // Retrieve all Job documents
    const skuDetailsArray = await Job.findById(req.body.jobId).select("skuDetails");
    // const consArray = jobs.flatMap(job => job.consignmentId);
    // // console.log("consArray", consArray);
    // // Extract skuDetails array from each Job document and flatten the array
    // const skuDetailsArray = jobs.flatMap(job => job.skuDetails);
    return res.status(200).json({ status: 1, message: commonFunction.translate('##skuDetails retrieved successfully##', reqQuery.language), responseData: skuDetailsArray });
  } catch (err) {
    // console.log(err);
    return res.status(500).json({ status: -1, message: commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

/**
 * @swagger
 * /job/statusList:
 *   post:
 *     summary: Get status options list
 *     tags:
 *       - Job
 *     responses:
 *       200:
 *         description: Status options listed successfully
 *       500:
 *         description: Internal server error
 */

router.post('/statusList', (req, res) => {
  const reqQuery = req.query;
  try {
    const statusOptions = [
      { id: 0, name: 'All' },
      { id: 1, name: 'Booking Created' },
      { id: -1, name: 'Security Rejected' },
      { id: 2, name: 'Document Verified' },
      { id: 3, name: 'Bay Allocated' },
      { id: 4, name: 'Unload Verified' },
      { id: -2, name: 'Unload Reject' },
      { id: 5, name: 'GRN Generated' },
      { id: 6, name: 'Inbound InProgress' },
      { id: 7, name: 'Bin Allocated' }
    ];
    return res.status(200).json({ status: 1, message: commonFunction.translate('##statusList listed successfully##', reqQuery.language), responseData: statusOptions });


    // res.json(statusOptions);
  } catch (error) {
    // console.log(error);
    res.status(500).json({ message: 'Internal Server Error' });
    return res.status(500).json({ status: -1, message: commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});


router.post('/statusOfGoods', (req, res) => {
  const reqQuery = req.query;
  try {
    const statusOptions = [
      { id: 0, name: 'All' },
      { id: 1, name: 'Goods Waiting for Unload' },
      { id: -1, name: 'Goods In Temporary Staying Area' },
      { id: 2, name: 'Cross Docking Goods' },
      { id: 3, name: 'Goods Receipt Goods' },
      { id: 4, name: 'Quality Inspection' },
      { id: -2, name: 'Put Away' }
    ];
    return res.status(200).json({ status: 1, message: commonFunction.translate('##success##', reqQuery.language), responseData: statusOptions });


    // res.json(statusOptions);
  } catch (error) {
    // console.log(error);
    // res.status(500).json({ message: 'Internal Server Error' });
    return res.status(500).json({ status: -1, message: commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

/**
 * @swagger
 * /job/bayAssign:
 *   post:
 *     summary: Assign bay to a job
 *     tags:
 *       - Job
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 description: ID of the job
 *                 example: 64ae909b82543a7063a86b1a
 *               bayId:
 *                 type: string
 *                 description: ID of the bay
 *                 example: 64782f97da21fa02457441f5
 *     responses:
 *       200:
 *         description: Bay assigned successfully
 *       400:
 *         description: Bad request or validation error
 *       404:
 *         description: Bay or job not found
 *       500:
 *         description: Internal server error
 * 
 * components:
 *   schemas:
 *     Job:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Job ID
 *           example: 1234567890
 *         consignmentId:
 *           type: string
 *           description: Consignment ID
 *           example: WMBO00011
 *         status:
 *           type: string
 *           description: Job status
 *           example: Ongoing
 *         gateId:
 *           type: string
 *           description: Gate ID
 *           example: 9876543210
 *         gateInfo:
 *           type: object
 *           description: Gate information
 *           properties:
 *             name:
 *               type: string
 *               description: Gate name
 *               example: gate1
 *         bayId:
 *           type: string
 *           description: Bay ID
 *           example: 1230987654
 *         bayInfo:
 *           type: object
 *           description: Bay information
 *           properties:
 *             name:
 *               type: string
 *               description: Bay name
 *               example: IB1
 *         clientName:
 *           type: string
 *           description: Client name
 *           example: John Doe
 *         bookingDate:
 *           type: string
 *           format: date
 *           description: Booking date
 *           example: '2023-07-09'
 */



router.post('/bayAssign', async (req, res) => {
  const reqQuery = req.query;
  try {
    // // console.log(req.body);
    const { bayId, _id, createdById } = req.body;
    if (!req.body.bayId || !req.body._id) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##validation error##', reqQuery.language) });
    }
    const bay = await Bays.findOne({ _id: bayId }, { name: 1, _id: 1, groupId: 1 });
    if (!bay) {
      return res.status(404).json({ status: -2, message: commonFunction.translate('##bay not found##', reqQuery.language) });
    }
    if (bay.status === 2) {
      return res.status(400).json({ status: -3, message: commonFunction.translate('##bay is already occupied##', reqQuery.language) });
    }

    const job = await Job.findById(_id);
    if (!job) {
      return res.status(404).json({ status: -1, message: commonFunction.translate('##job not found##', reqQuery.language) });
    }

    if (req.body.createdById == undefined) {
      var userDetail = await userModel.findOne({ /* role: 3 */ }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 });
    } else {
      var userDetail = await userModel.findOne({ _id: createdById }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 }
      );
    }

    if (userDetail == null) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##user not found##', reqQuery.language) });
    }
    var dataDesc = userDetail.fullName + 'assigned the responsibility of managing a specific bay during the shipment process for the products'

    const logEntry = {
      bayInfo: bay,
      createdBy: userDetail.fullName,
      description: dataDesc,
      status: 9, //bayAssign
      createdAt: new Date(),
    };

    const updatedFields = {
      $push: { logs: logEntry },
      statusInfo: {
        createdBy: userDetail.fullName,
        description: '',
        status: 3, //bayAllocated
        createdAt: new Date(),
      },
      bayInfo: bay,
      status: 2,
    };

    // Update the status_info field
    const updatedJob = await Job.findOneAndUpdate({ _id: _id }, updatedFields, { new: true });

    // Fetch the updated job list with clientName populated
    const jobList = await Job.find({}).populate('clientId', 'name'); // Add necessary query filters if required

    const jobListFinal = jobList.map((element) => {
      const jobDetail = {
        id: element._id,
        consignmentId: element.consignmentId,
        status: commonFunction.getStatusLabel(element.status),
        gateId: element.gateId,
        gateInfo: element.gateInfo ? element.gateInfo : {},
        bayId: element.bayId,
        bayInfo: element.bayInfo ? element.bayInfo : {},
        clientName: element.clientDetail.name,
        bookingDate: element.bookingDate,
      };
      return jobDetail;
    });

    const responseObj = {
      jobId: _id,
      bayInfo: { _id: bayId },
      jobList: jobListFinal,
    };

    // Set the main status to 1 (inboundCreated)
    const mainStatusUpdated = await Job.findOneAndUpdate(
      { _id: _id },
      { $set: { status: 1 } },
      { new: true }
    );


    return res.status(200).json({ status: 1, message: commonFunction.translate('##bay assign to job##', reqQuery.language), responseData: responseObj });

    // return res.status(200).json(responseObj);
  } catch (error) {
    // console.log(error);
    return res.status(500).json({ status: -1, message: commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});


/**
 * @swagger
 * /job/list:
 *   post:
 *     summary: Retrieve job list
 *     tags:
 *       - Job
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               search:
 *                 type: string
 *                 description: Search keyword
 *                 example: WMBO00011
 *               bayName:
 *                 type: string
 *                 description: Name of the bay
 *                 example: IB1
 *               gateName:
 *                 type: string
 *                 description: Name of the gate
 *                 example: gate1
 *               bookingDate:
 *                 type: string
 *                 format: date
 *                 description: Booking date
 *                 example: '2023-07-09'
 *               status:
 *                 type: integer
 *                 description: Status code
 *                 example: 0
 *     responses:
 *       200:
 *         description: Jobs retrieved successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 * 
 * components:
 *   schemas:
 *     Job:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Job ID
 *           example: 1234567890
 *         consignmentId:
 *           type: string
 *           description: Consignment ID
 *           example: WMBO00011
 *         status:
 *           type: string
 *           description: Job status
 *           example: Ongoing
 *         gateId:
 *           type: string
 *           description: Gate ID
 *           example: 9876543210
 *         gateInfo:
 *           type: object
 *           description: Gate information
 *           properties:
 *             name:
 *               type: string
 *               description: Gate name
 *               example: gate1
 *         bayId:
 *           type: string
 *           description: Bay ID
 *           example: 1230987654
 *         bayInfo:
 *           type: object
 *           description: Bay information
 *           properties:
 *             name:
 *               type: string
 *               description: Bay name
 *               example: IB1
 *         clientName:
 *           type: string
 *           description: Client name
 *           example: John Doe
 *         bookingDate:
 *           type: string
 *           format: date
 *           description: Booking date
 *           example: '2023-07-09'
 */



router.post('/list', async (req, res) => {
  const reqQuery = req.query;
  try {
    const { search, bayName, gateName, bookingDate, status } = req.body;
    const reqBody = req.body;

    // Build the filter object based on the request body
    const filter = {};

    if (search) {
      const searchFilter = { $regex: search, $options: 'i' };
      filter.$or = [
        { consignmentId: searchFilter },
        { 'clientDetail.name': searchFilter }
      ];
    }

    if (bayName) {
      filter['bayInfo.name'] = bayName;
    }

    if (gateName) {
      filter['gateInfo.name'] = gateName;
    }

    if (reqBody.wareHouseId != undefined && reqBody.wareHouseId != "") {
      filter.wareHouseId = new mongoose.Types.ObjectId(reqBody.wareHouseId);
    }

    if (reqBody.companyId != undefined && reqBody.companyId != "") {
      filter.companyId = new mongoose.Types.ObjectId(reqBody.companyId);
    }

    if (bookingDate) {
      filter.bookingDate = bookingDate;
    }

    if (status !== undefined && status !== 0) {
      filter.status = parseInt(status, 10);
    }
    filter.type = 1;
    // Check if any invalid fields are provided in the request body
    // console.log("req.body",req.body);
    // const validFields = ['search', 'bayName', 'gateName', 'bookingDate', 'status'];
    // const invalidFields = Object.keys(req.body).filter(field => !validFields.includes(field));
    // if (invalidFields.length > 0) {
    //   return res.status(400).json({
    //     status: 1,
    //     message: commonFunction.translate('##Invalid fields in the request##', reqQuery.language),
    //     upComing: 0,
    //     onGoing: 0,
    //     completed: 0,
    //     jobList: []
    //   });
    // }

    // Query the jobs collection using the filter
    const jobs = await Job.find(filter).sort({ _id: -1 });

    // if (jobs.length === 0) {
    //   return res.status(400).json({
    //     status: 1,
    //     message: commonFunction.translate('##No jobs found matching the filter criteria##', reqQuery.language),
    //     upComing: 0,
    //     onGoing: 0,
    //     completed: 0,
    //     jobList: []
    //   });
    // }

    const jobList = await Job.find(filter).sort({ _id: -1 })
      .populate('clientId', 'name')
      .select('-updatedAt');

    const jobListFinal = jobList.map((element) => {
      var skuPlantCode = [];
      if (element.skuDetails.length != 0) {
        element.skuDetails.map((ele) => {
          if (ele.plantCode != undefined) {
            skuPlantCode.push(ele.plantCode);
          }
        });
      }
      if (skuPlantCode.length != 0) {
        var skuPlantCode = skuPlantCode.filter((item, index) => skuPlantCode.indexOf(item) === index);
      }
      const jobDetail = {
        id: element._id,
        consignmentId: element.consignmentId,
        status: commonFunction.getStatusLabel(element.status),
        statusID: element.status,
        gateId: element.gateId,
        gateInfo: element.gateInfo ? element.gateInfo : {},
        bayId: element.bayId,
        bayInfo: element.bayInfo ? element.bayInfo : {},
        clientName: element.clientDetail.name,
        bookingDate: element.bookingDate,
        skuPlantCode: skuPlantCode
      };
      return jobDetail;
    });

    const upcomingCount = await Job.countDocuments({ appointmentStatus: 1 });
    const onGoingCount = await Job.countDocuments({ appointmentStatus: 2 });
    const completedCount = await Job.countDocuments({ appointmentStatus: 3 });

    return res.status(200).json({
      status: 1,
      message: commonFunction.translate('##Jobs retrieved successfully##', reqQuery.language),
      upComing: upcomingCount,
      onGoing: onGoingCount,
      completed: completedCount,
      jobList: jobListFinal
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: -1,
      message: commonFunction.translate('##Internal server error##', reqQuery.language)
    });
  }
});



const multiStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const consignmentId = req.body._id; // Assuming the _id field represents the consignmentId
    const destinationFolder = `./public/temp`;

    createDirectory(destinationFolder); // Create the destination directory if it doesn't exist
    cb(null, destinationFolder);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now(); // Get the current timestamp
    const originalName = file.originalname;
    const extension = originalName.split('.').pop(); // Get the file extension
    const fileName = `${timestamp}.${extension}`; // Add timestamp to the filename
    cb(null, fileName);
  }
});

function createDirectory(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

const multiUpload = multer({ storage: multiStorage }).array('images');

router.post('/uploadMultiImages', function (req, res) {
  multiUpload(req, res, async function (err) {
    const reqBody = req.body;;
    if (err) {
      res.status(500).send(err);
    } else {
      if (!req.files || req.files.length === 0) {
        res.status(400).json({ 'status': -1, 'message': 'no file selected' });
      } else {
        // console.log("req.files", req.files);
        var fileArray = req.files;
        var imagePaths = [];
        fileArray.forEach(element => {
          imagePaths.push(element.filename);
        });

        imagePaths.forEach(ele => {
          commonFunction.moveToSingleImage(ele, reqBody.consignmentId);
        });
        // console.log("dataNew", imagePaths);
        var imageType = reqBody.imageType;
        if (imageType == 1) {
          updateObject = {
            $push: {
              'documents.inbound.gs_vehicleImage': {
                $each: imagePaths
              }
            }
          };
        } else if (imageType == 2) {
          updateObject = {
            $push: {
              'documents.inbound.gs_driverLicenseImage': {
                $each: imagePaths
              }
            }
          };
        } else if (imageType == 3) {
          updateObject = {
            $push: {
              'documents.inbound.gs_vehicleRcImage': {
                $each: imagePaths
              }
            }
          };
        } else if (imageType == 4) {
          updateObject = {
            $push: {
              'documents.inbound.gs_vehicleInsuranceImage': {
                $each: imagePaths
              }
            }
          };
        } else if (imageType == 5) {
          updateObject = {
            $push: {
              'documents.inbound.gs_movedUploadPhoto': {
                $each: imagePaths
              }
            }
          };
        } else if (imageType == 0) {
          updateObject = {
            $push: {
              'documents.inbound.gs_others': {
                $each: imagePaths
              }
            }
          };
        }

        // Update the document in the "job" collection
        await Job.updateOne(
          { _id: reqBody._id },
          updateObject,
          { upsert: true }
        );

        // Return a success response
        return res.json({ status: 1, message: 'Images uploaded and saved successfully' });
      }
    }
  });
});

function movetoOriginalImage(url, movePath) {
  const download = (url, path, callback) => {
    request.head(url, (err, res, body) => {
      request(url)
        .pipe(fs.createWriteStream(path))
        .on('close', callback)
    });
  }
  var fields = url.split('/');
  const path = './public/images/' + movePath + '/' + fields[5];
  download(url, path, () => { });
  // var originalImageUrl = 'http://54.235.152.64:4001/images/images/' + fields[5];
  var originalImageUrl = 'images/' + movePath + '/' + fields[5];
  return originalImageUrl;
}


async function moveImage(image, param) {
  fileExist = [];
  fileNotExist = [];
  imagePathUrl = [];

  var imagePath = "./public/temp/";
  image.map(function (element, index) {
    if (fs.existsSync(imagePath + element)) {
      fileExist.push(element);
    } else {
      fileNotExist.push(element);
    }
  });
  // console.log("fileNotExist", fileNotExist);
  // console.log("fileExist", fileExist);
  if (fileNotExist.length != 0) {
    fileNotExist.forEach(function (element, index) {
      tempImageUrl = env.BASEURL + 'temp/' + element;
      originalImgUrl = movetoOriginalImage(tempImageUrl, param);
      ImageUrl = 'images/' + param + '/' + element;
      imagePathUrl.push(ImageUrl);
    });
    return imagePathUrl;
  } else {
    return false;
  }
}


// router.post('/getGRNById', async (req, res) => {
//   const reqQuery = req.query;
//   try {
//     const reqBody = req.body;
//     if (!reqBody._id) {
//       return res.status(400).json({ status: -1, message: commonFunction.translate('##validation error##', reqQuery.language) });
//     }
//     let jobDetail = await Job.findOne({ consignmentId: reqBody._id }).select('bayInfo  consignmentId clientDetail vehicleDetail invoiceNo purchaseOrderNo shipmentDetail  skuDetails ftlVerification pallet  binAllocate bookingDate bookingTime shipmentType packageDetails grnInfo');
//     if (!jobDetail) {
//       jobDetail = await Job.findOne({ _id: reqBody._id }).select('bayInfo  consignmentId clientDetail vehicleDetail invoiceNo purchaseOrderNo shipmentDetail  skuDetails ftlVerification pallet  binAllocate bookingDate bookingTime shipmentType packageDetails grnInfo');
//     }


//     return res.status(200).json({ status: 1, message: commonFunction.translate('##success##', reqQuery.language), responseData: jobDetail });
//   } catch (error) {
//     // console.log(error);
//     return res.status(500).json({ status: -1, message: commonFunction.translate("##internet Server error##", reqQuery.language) });
//   }
// });

router.post('/getGRNById', async (req, res) => {
  const reqQuery = req.query;
  try {
    const reqBody = req.body;
    if (!reqBody._id) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##validation error##', reqQuery.language) });
    }
    // let jobDetail = await Job.findOne({ consignmentId: reqBody._id }).select('bayInfo  consignmentId clientDetail vehicleDetail invoiceNo purchaseOrderNo shipmentDetail  skuDetails ftlVerification pallet  binAllocate bookingDate bookingTime shipmentType packageDetails grnInfo');
    query = {}
    const searchRegex = new RegExp(reqBody._id, 'i');
    query.$or = [
      { consignmentId: searchRegex },
      { invoiceNo: searchRegex },
      { jobId: searchRegex },

    ];
    var jobDetail = await Job.findOne(query).select('bayInfo consignmentId clientDetail vehicleDetail invoiceNo purchaseOrderNo shipmentDetail skuDetails ftlVerification pallet binAllocate bookingDate bookingTime shipmentType packageDetails grnInfo');

    if (!jobDetail) {
      jobDetail = await Job.findOne({ _id: reqBody._id }).select('bayInfo  consignmentId clientDetail vehicleDetail invoiceNo purchaseOrderNo shipmentDetail  skuDetails ftlVerification pallet  binAllocate bookingDate bookingTime shipmentType packageDetails grnInfo');
    }


    return res.status(200).json({ status: 1, message: commonFunction.translate('##success##', reqQuery.language), responseData: jobDetail });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: -1, message: commonFunction.translate("##internet Server error##", reqQuery.language) });
  }
});



router.post('/listJobId', async (req, res) => {
  const reqQuery = req.query;
  try {
    const jobs = await Job.find().select('_id');

    return res.status(200).json({ status: 1, message: commonFunction.translate('##success##', reqQuery.language), responseData: jobs });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: -1,
      message: commonFunction.translate('##Internal server error##', reqQuery.language)
    });
  }
});



// createInwardAsn API
router.post('/createInwardAsn', async (req, res) => {
  try {
    const reqBody = req.body;
    const clientId = reqBody.clientId;
    const skuDetails = reqBody.skuDetails;
    const packageDetails = reqBody.packageDetails;

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
      clientDetail: client,
      vehicleDetail: {
        vehicleNo: reqBody.vehicleDetail.vehicleNo || '',
        vehicleType: reqBody.vehicleDetail.vehicleType || '',
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
      status: 1, // Inbound Created
      statusInfo: {
        status: 1, // Inbound Created
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
      comments: ''
    });

    // Save the new job
    const savedJob = await newJob.save();

    // Check if each skuDetail already exists in the productDetails collection
    for (const skuDetail of skuDetails) {
      const existingSku = await ProductDetail.findOne({ materialCode: skuDetail.materialCode });

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

    // Update the job collection with the new skuDetails and packageDetails
    await Job.updateOne({ _id: savedJob._id }, updateQuery);

    res.status(200).json({ status: 1, message: 'Data inserted successfully!', jobId: savedJob._id });
  } catch (error) {
    console.error('Error inserting data:', error);
    res.status(500).json({ status: -1, message: 'Internal server error' });
  }
});

router.post('/consignmentDetailById', async (req, res) => {
  try {
    const { jobId } = req.body;
    if (!jobId) {
      return res.status(400).json({ status: -1, message: 'Missing jobId in the request body' });
    }

    const jobInfo = await Job.findById(jobId, {
      _id: 1,
      consignmentId: 1,
      clientId: 1,
      grnInfo: 1,
      subtask: 1,
      packageInfo: 1,
      description: 1,
      consignmentDetail: 1,
    }).populate('clientId', '_id name email address country state city');

    if (!jobInfo) {
      return res.status(404).json({ status: -2, message: 'Job not found for the given jobId' });
    }

    // Mapping the subtask type to subtask name
    const subtaskName = {
      "1": "Put away",
      "2": "Sort",
      "3": "Assemble",
      "4": "Relocate",
      "5": "Unload",
      "6": "QA"
    };
    const taskList = await Task.find({ 'jobInfo._id': new mongoose.Types.ObjectId(jobId) });
    // console.log("subtaskList", taskList)

    let subtaskList = taskList.map((data) => {
      // let newData = data;
      data["taskName"] = subtaskName[data.type];
      // newData["hi"] = "-"
      // newData.itemDetail = data.packageDetails.map((datas) => datas.msku).toString();
      return data;
    });

    // Fetching approvedPackage from the MongoDB 'Package' collection based on type 'Approved'
    // const approvedPackage = await Package.find({ "consignmentId": jobInfo.consignmentId, "approvedStatus": 1 });
    const approvedPackage = await Package.find({ "jobId": jobInfo._id, "approvedStatus": 1 });

    // Fetching defectedPackage from the MongoDB 'Package' collection based on type 'Defected'
    // const defectedPackage = await Package.find({ "consignmentId": jobInfo.consignmentId, "approvedStatus": 2 });
    const defectedPackage = await Package.find({ "jobId": jobInfo._id, "approvedStatus": 2 });
    var approvedPackageDetails = [];
    var defectedPackageDetails = [];
    approvedPackage.forEach(element => {
      reqObj = element;
      // reqObj.quantityText= element.approvedProductCount +'-'+ element.approvedQuantity;
      reqObj.quantityText = element.approvedProductCount + ' items / ' + element.approvedQuantity + ' packages';
      if (reqObj.approvedStatus == "2") {
        reqObj.quantityText = (element.defectedQuantity * element.productCount) + ' items / ' + element.defectedQuantity + ' packages';
      }
      approvedPackageDetails.push(reqObj);
    });

    defectedPackage.forEach(element => {
      reqObj = element;
      // reqObj.quantityText= element.approvedProductCount +'-'+ element.approvedQuantity;
      reqObj.quantityText = element.approvedProductCount + ' items / ' + element.approvedQuantity + ' packages';
      if (reqObj.approvedStatus == "2") {
        reqObj.quantityText = (element.defectedQuantity * element.productCount) + ' items / ' + element.defectedQuantity + ' packages';
      }
      defectedPackageDetails.push(reqObj);
    });

    // Create the packageInfo object with the provided data
    const packageInfo = {
      approvedPackage: approvedPackageDetails,
      defectedPackage: defectedPackageDetails,
    };

    // Fetch the required data from the Client collection using the clientId from the Job collection
    const clientInfo = await Client.findById(jobInfo.clientId, {
      _id: 1,
      name: 1,
      email: 1,
      address: 1,
      country: 1,
      state: 1,
      city: 1,
    });

    if (!clientInfo) {
      return res.status(404).json({ status: -3, message: 'Client not found for the given clientId' });
    }

    // const subtaskBins = jobInfo.subtask.map((task) => task.packageDetails.map((pkg) => pkg.allocateBin.map(bin => bin.name)));
    // const selectedBin = subtaskBins.flat().map((bin) => bin.name);

    // Prepare the response body with the fetched data
    const responseBody = {
      status: 1,
      message: 'success',
      packageInfo,
      clientInfo,
      grnInfo: jobInfo.grnInfo,
      // selectedBin,
      subtask: subtaskList,
      consignmentId: jobInfo.consignmentId,
      description: jobInfo.description,
      consignmentDetail: jobInfo.consignmentDetail
    };

    return res.status(200).json(responseBody);
  } catch (error) {
    console.error(error);

    return res.status(500).json({ status: -1, message: 'Internal server error' });
  }
});

// async function getNextConsignmentId(clientId) {
//   try {
//     const client = await Client.findOne({ _id: clientId });

//     if (!client) {
//       throw new Error('Client not found');
//     }

//     const clientAbbreviation = client.name.substring(0, 2).toUpperCase();

//     const latestJob = await Job.findOne({}, { consignmentId: 1 }).sort({ _id: -1 });

//     let lastNumber = 0;

//     if (latestJob && latestJob.consignmentId) {
//       const lastConsignmentId = latestJob.consignmentId;
//       const lastNumberString = lastConsignmentId.substring(4);
//       lastNumber = parseInt(lastNumberString);
//     }

//     let newNumber = lastNumber + 1;

//     const paddedNumber = newNumber.toString().padStart(4, '0');
//     const consignmentId = 'WM' + clientAbbreviation + paddedNumber;

//     // Create the consignmentId directory
//     const consignmentIdPath = path.join('public', 'inbound', consignmentId);
//     await fs.promises.mkdir(consignmentIdPath, { recursive: true });

//     return { consignmentId };
//   } catch (error) {
//     // console.log(error);
//     throw new Error('Failed to generate consignmentId');
//   }
// }

// router.post('/outboundCreate', async (req, res) => {
//   const reqQuery = req.query;
//   const reqBody = req.body;
//   try {
//     if (!reqBody.clientId) {
//       return res.status(400).json({ status: -1, message: commonFunction.translate('##validation error##', reqQuery.language) });
//     }

//     const clientDetail = await Client.findOne({ _id: reqBody.clientId }, { _id: 1, name: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1, contactNumber: 1 });

//     if (!clientDetail) {
//       return res.status(400).json({ status: -1, message: commonFunction.translate('##client not found##', reqQuery.language) });
//     }

//     if (req.body.createdBy == undefined) {
//       var userDetail = await userModel.findOne({}, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 }
//       );
//     } else {
//       var userDetail = await userModel.findOne({ _id: createdBy }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 }
//       );
//     }
//     // const userDetail = await userModel.findOne({ /* role: 3 */ }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 });

//     if (!userDetail) {
//       return res.status(400).json({ status: -1, message: commonFunction.translate('##user not found##', reqQuery.language) });
//     }


//     const { consignmentId } = await getNextConsignmentId(reqBody.clientId);

//     const newJob = new Job({
//       bayInfo: {},
//       clientId: reqBody.clientId,
//       consignmentId: consignmentId,
//       clientDetail: clientDetail,
//       vehicleDetail: {
//         vehicleNo: '',
//         vehicleType: '',
//         trailer: '',
//         containerNo: '',
//         estimatedTimeOfArrival: '',
//         vehicleRc: false,
//         vehicleInsurance: false,
//         driverLicense: false,
//         vehicleRcImage: '',
//         vehicleInsuranceImage: '',
//         driverLicenseImage: '',
//         uploadPictureImage: ''
//       },
//       invoiceNo: '',
//       purchaseOrderNo: '',
//       shipmentDetail: {
//         from: '',
//         to: '',
//         titleNumber: '',
//         description: '',
//         inboundShipmentType: '',
//         unloadShipmentType: ''
//       },
//       skuDetails: [],
//       status: 1, // Inbound Created
//       statusInfo: {
//         status: 1, // Inbound Created
//         createdBy: userDetail.fullName,
//         createdAt: new Date(),
//       },
//       appointmentStatus: 1,
//       specialRequest: '',
//       specifyDetails: '',
//       incoterms: '',
//       vehicleDocVerified: false,
//       otlLockingSystem: 0,
//       otlImage: '',
//       subtask: [],
//       pallet: [],
//       binAllocate: [],
//       bookingDate: '',
//       bookingTime: '',
//       shipmentType: null,
//       logs: [{
//         description: 'Log',
//         status: 1, // Inbound Created
//         createdBy: userDetail.fullName,
//         createdAt: new Date(),
//       }],
//       comments: '',
//       description: req.body.description ? req.body.description : '',
//       type: 1,
//     });

//     // Save the new job
//     const savedJob = await newJob.save();

//     let stringdata = JSON.stringify({ consignmentId: consignmentId, jobId: savedJob._id });
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
//       let fileName = consignmentId + "_QR.jpeg";
//       try {
//         fs.writeFileSync("./public/inbound/" + consignmentId + "/" + fileName, imageBuffer, 'utf8');
//         const updateUser = await Job.updateOne({ _id: savedJob._id }, { $set: { qrCode: "inbound/" + consignmentId + "/" + fileName } });
//         // console.log("updatesd", updateUser);
//       } catch (e) {
//         next(e);
//       }
//     });

//     return res.status(200).json({ status: 1, message: 'inbound job created successfully', jobId: savedJob._id, consignmentId: consignmentId });
//   } catch (error) {
//     // console.log('Error creating inbound job:', error);
//     return res.status(500).json({ status: -1, message: 'internal server error' });
//   }
// });

router.post('/dashBoard', async (req, res) => {
  try {
    const { type } = req.body;

    if (type === 1 || type === 2) {
      const jobs = await Job.find({ type }); // Query jobs with the specified type
      return res.status(200).json({ status: 1, message: 'Job list fetched successfully', responseData: jobs });
    } else {
      return res.status(400).json({ status: -1, message: 'Invalid type value' });
    }
  } catch (error) {
    // console.log('Error fetching job list:', error);
    return res.status(500).json({ status: -1, message: 'Internal server error' });
  }
});


// router.post('/bayReassign', async (req, res) => {
//   try {
//     const { jobId, bayId } = req.body;

//     if (!jobId || !bayId) {
//       return res.status(400).json({ status: -1, message: 'Invalid input data. Both jobId and bayId are required.' });
//     }

//     // Get the bay information using the provided bayId
//     const bay = await Bays.findById(bayId);

//     if (!bay) {
//       return res.status(404).json({ status: -3, message: 'Bay not found.' });
//     }

//     // Check if the bay's status is 2 (indicating it should not be reassigned)
//     if (bay.status === 2) {
//       return res.status(400).json({ status: -5, message: 'Bay cannot be reassigned. Status is 2.' });
//     }

//     // Find the job using the provided jobId
//     const job = await Job.findById(jobId);

//     if (!job) {
//       return res.status(404).json({ status: -2, message: 'Job not found.' });
//     }

//     // Check if the bay is being reassigned to a different bay than the current one
//     if (job.bayInfo._id.toString() !== bayId) {
//       // Update the status of the previous bay (if it exists) to 1
//       const previousBay = await Bays.findById(job.bayInfo._id);
//       if (previousBay) {
//         await Bays.updateOne({ _id: previousBay._id }, { $set: { status: 1 } });
//       }

//       // Update the status of the new bay to 2
//       await Bays.updateOne({ _id: bay._id }, { $set: { status: 2 } });

//       await Job.updateOne({ _id: jobId }, {
//         $set: {
//           'bayInfo._id': bay._id,
//           'bayInfo.name': bay.name,
//           'bayInfo.groupId': bay.groupId,
//         },
//       });
//     } else {
//       await Job.updateOne({ _id: jobId }, {
//         $set: {
//           'bayInfo._id': bay._id,
//           'bayInfo.name': bay.name,
//           'bayInfo.groupId': bay.groupId,
//         },
//       });
//     }

//     return res.status(200).json({ status: 1, message: 'Bay assignment successful.' });
//   } catch (error) {
//     console.error('Error assigning bay:', error);
//     return res.status(500).json({ status: -4, message: 'Internal server error.' });
//   }
// });


router.post('/bayReassign', async (req, res) => {
  try {
    const { jobId, bayId } = req.body;

    if (!jobId || !bayId) {
      return res.status(400).json({ status: -1, message: 'Invalid input data. Both jobId and bayId are required.' });
    }

    // Get the bay information using the provided bayId
    const bay = await Bays.findById(bayId);

    if (!bay) {
      return res.status(404).json({ status: -3, message: 'Bay not found.' });
    }

    // Check if the bay's status is 2 (indicating it should not be reassigned)
    if (bay.status === 2) {
      return res.status(400).json({ status: -5, message: 'Bay cannot be reassigned. Status is 2.' });
    }

    // Find the job using the provided jobId
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ status: -2, message: 'Job not found.' });
    }

    // Update the status of the previous bay (if it exists) to 1
    const previousBay = await Bays.findById(job.bayInfo._id);
    if (previousBay) {
      await Bays.updateOne({ _id: previousBay._id }, { $set: { status: 1 } });
    }

    // Update the status of the new bay to 2
    await Bays.updateOne({ _id: bay._id }, { $set: { status: 2 } });

    // Extract the consignmentId from the job (adjust the field name accordingly)
    const consignmentId = job.consignmentId;

    // Generate the QR code content for bayInfo
    const bayInfoQrCodeContent = JSON.stringify({ consignmentId, jobId, bayId });

    // Generate the QR code for bayInfo
    const bayInfoQrCode = await qr.toDataURL(bayInfoQrCodeContent);

    // Define the folder path to save the bayInfo QR code (inside the consignmentId folder)
    const consignmentFolder = path.join(__dirname, '..', 'public', 'inbound', consignmentId);

    // Create the consignment folder if it doesn't exist
    if (!fs.existsSync(consignmentFolder)) {
      fs.mkdirSync(consignmentFolder, { recursive: true });
    }

    // Define the file path to save the bayInfo QR code inside the consignment folder
    const bayInfoQrCodeFileName = `${bayId}_bayInfo.png`; // Use bayId and "bayInfo" as the file name
    const bayInfoQrCodeFilePath = path.join(consignmentFolder, bayInfoQrCodeFileName);
    // Set the path for job_QrCode
    const job_QrCodePath = `inbound/${consignmentId}/${bayInfoQrCodeFileName}`;


    // Save the bayInfo QR code image to the file
    await fs.promises.writeFile(bayInfoQrCodeFilePath, bayInfoQrCode.replace(/^data:image\/png;base64,/, ''), 'base64');

    // Update the job's bayInfo and remove the old bayInfo
    await Job.updateOne(
      { _id: jobId },
      {
        $set: {
          // 'bayInfo._id': bay.bayId,
          'bayInfo.bayId': new mongoose.Types.ObjectId(bayId),
          'bayInfo.name': bay.name,
          'bayInfo.groupId': bay.groupId,
          'bayInfo.jobBayQrCode': job_QrCodePath,
          // 'bayInfo.status': 2,
        },
        $unset: {
          'bayInfo.status': 1,
        },
      }
    );
    return res.status(200).json({ status: 1, message: 'Bay assignment successful.' });


  } catch (error) {
    console.error('Error assigning bay:', error);
    return res.status(500).json({ status: -4, message: 'Internal server error.' });
  }
});




router.post('/uploadVehicleImagesCopy', async (req, res) => {
  try {
    const { jobId, vehicleDetail } = req.body;

    if (!jobId || !vehicleDetail) {
      return res.status(400).json({ status: -1, message: 'Missing jobId or vehicleDetail in the request body' });
    }

    let updatedJob;

    // Check if jobId already exists
    const existingJob = await Job.findOne({ _id: jobId });

    if (existingJob) {
      // Update existing job with new vehicleDetail
      updatedJob = await Job.findOneAndUpdate(
        { _id: jobId },
        { $set: { vehicleDetail: vehicleDetail } },
        { new: true }
      );
    } else {
      // Create a new job with the provided jobId and vehicleDetail
      updatedJob = new Job({ _id: jobId, vehicleDetail: vehicleDetail });
      await updatedJob.save();
    }

    const consignmentId = updatedJob.consignmentId;

    const updatedFields = {};
    // Move vehicleRcImage
    if (vehicleDetail.vehicleRcImage) {
      const vehicleRcImage = await commonFunction.moveToSingleImage(vehicleDetail.vehicleRcImage, consignmentId);
      updatedFields.vehicleRcImage = vehicleRcImage || vehicleDetail.vehicleRcImage;
    } else {
      updatedFields.vehicleRcImage = '';
    }

    // Move vehicleInsuranceImage
    if (vehicleDetail.vehicleInsuranceImage) {
      const vehicleInsuranceImage = await commonFunction.moveToSingleImage(vehicleDetail.vehicleInsuranceImage, consignmentId);
      updatedFields.vehicleInsuranceImage = vehicleInsuranceImage || vehicleDetail.vehicleInsuranceImage;
    } else {
      updatedFields.vehicleInsuranceImage = '';
    }

    // Move driverLicenseImage
    if (vehicleDetail.driverLicenseImage) {
      const driverLicenseImage = await commonFunction.moveToSingleImage(vehicleDetail.driverLicenseImage, consignmentId);
      updatedFields.driverLicenseImage = driverLicenseImage || vehicleDetail.driverLicenseImage;
    } else {
      updatedFields.driverLicenseImage = '';
    }

    // Move uploadPictureImage
    if (vehicleDetail.uploadPictureImage) {
      const uploadPictureImage = await commonFunction.moveToSingleImage(vehicleDetail.uploadPictureImage, consignmentId);
      updatedFields.uploadPictureImage = uploadPictureImage || vehicleDetail.uploadPictureImage;
    } else {
      updatedFields.uploadPictureImage = '';
    }

    // Now you can update the Job model with the updatedFields
    // For example, if you have a Job model:
    // const updatedJob = await Job.findOneAndUpdate({ _id: mongoose.Types.ObjectId(jobId) }, updatedFields, { new: true });

    // Return a success response
    return res.status(200).json({ status: 1, message: 'Vehicle images uploaded and documents updated successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: -1, message: 'Internal server error' });
  }
});



router.post('/updateJobVehicleDetailCopy', async (req, res) => {
  try {
    const jobId = req.body.jobId;
    const vehicleDetail = req.body.vehicleDetail;
    const consignmentId = jobId.consignmentId;

    const updatedFields = {};

    // Move vehicleRcImage
    if (vehicleDetail.vehicleRcImage) {
      const vehicleRcImage = await commonFunction.moveToSingleImage(vehicleDetail.vehicleRcImage, consignmentId);
      updatedFields["vehicleDetail.vehicleRcImage"] = vehicleRcImage || vehicleDetail.vehicleRcImage;
    } else {
      updatedFields["vehicleDetail.vehicleRcImage"] = '';
    }

    // Move vehicleInsuranceImage
    if (vehicleDetail.vehicleInsuranceImage) {
      const vehicleInsuranceImage = await commonFunction.moveToSingleImage(vehicleDetail.vehicleInsuranceImage, consignmentId);
      updatedFields["vehicleDetail.vehicleInsuranceImage"] = vehicleInsuranceImage || vehicleDetail.vehicleInsuranceImage;
    } else {
      updatedFields["vehicleDetail.vehicleInsuranceImage"] = '';
    }

    // Move driverLicenseImage
    if (vehicleDetail.driverLicenseImage) {
      const driverLicenseImage = await commonFunction.moveToSingleImage(vehicleDetail.driverLicenseImage, consignmentId);
      updatedFields["vehicleDetail.driverLicenseImage"] = driverLicenseImage || vehicleDetail.driverLicenseImage;
    } else {
      updatedFields["vehicleDetail.driverLicenseImage"] = '';
    }

    // Move uploadPictureImage
    if (vehicleDetail.uploadPictureImage) {
      const uploadPictureImage = await commonFunction.moveToSingleImage(vehicleDetail.uploadPictureImage, consignmentId);
      updatedFields["vehicleDetail.uploadPictureImage"] = uploadPictureImage || vehicleDetail.uploadPictureImage;
    } else {
      updatedFields["vehicleDetail.uploadPictureImage"] = '';
    }

    const updatedJob = await Job.findOneAndUpdate({ _id: jobId }, { $set: updatedFields }, { new: true });

    if (!updatedJob) {
      return res.status(404).json({ status: -1, message: 'Job not found' });
    }

    return res.status(200).json({ status: 1, message: 'Job updated successfully', updatedJob });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: -1, message: 'Internal server error' });
  }
});

router.post('/updateJobVehicleDetail', async (req, res) => {
  try {
    const jobId = req.body.jobId;
    const vehicleDetail = req.body.vehicleDetail;
    var jobInfo = await Job.findOne({_id:jobId},{consignmentId:1})
    const consignmentId = jobInfo.consignmentId;

    const updatedFields = {};

    // Move vehicleRcImage
    // console.log("vehicleDetail.vehicleRcImage1",vehicleDetail.vehicleRcImage);
    if (vehicleDetail.vehicleRcImage) {
      try {
        console.log("vehicleDetail.vehicleRcImage",vehicleDetail.vehicleRcImage);
        console.log("consignmentId",consignmentId);
        const vehicleRcImage = await commonFunction.moveToSingleImage(vehicleDetail.vehicleRcImage, consignmentId);
        console.log('VehicleRcImage moved successfully:', vehicleRcImage);
        updatedFields["vehicleDetail.vehicleRcImage"] = vehicleRcImage
        ? `/inbound/${consignmentId}/vehicleRcImage/${vehicleRcImage}`
        : `/inbound/${consignmentId}/vehicleRcImage/${vehicleDetail.vehicleRcImage}`;        // updatedFields["vehicleDetail.vehicleRcImage"] = vehicleRcImage || vehicleDetail.vehicleRcImage;
      } catch (moveError) {
        console.error('Error moving VehicleRcImage:', moveError);
        updatedFields["vehicleDetail.vehicleRcImage"] = '';
      }
    } else {
      updatedFields["vehicleDetail.vehicleRcImage"] = '';
    }

    // Move vehicleInsuranceImage
    if (vehicleDetail.vehicleInsuranceImage) {
      try {
        const vehicleInsuranceImage = await commonFunction.moveToSingleImage(vehicleDetail.vehicleInsuranceImage, consignmentId);
        console.log('VehicleInsuranceImage moved successfully:', vehicleInsuranceImage);
        // updatedFields["vehicleDetail.vehicleInsuranceImage"] = vehicleInsuranceImage || vehicleDetail.vehicleInsuranceImage;
        updatedFields["vehicleDetail.vehicleInsuranceImage"] = vehicleInsuranceImage
        ? `/inbound/${consignmentId}/vehicleInsuranceImage/${vehicleInsuranceImage}`
        : `/inbound/${consignmentId}/vehicleInsuranceImage/${vehicleDetail.vehicleInsuranceImage}`;     
      } catch (moveError) {
        console.error('Error moving VehicleInsuranceImage:', moveError);
        updatedFields["vehicleDetail.vehicleInsuranceImage"] = '';
      }
    } else {
      updatedFields["vehicleDetail.vehicleInsuranceImage"] = '';
    }

    // Move driverLicenseImage
    if (vehicleDetail.driverLicenseImage) {
      try {
        const driverLicenseImage = await commonFunction.moveToSingleImage(vehicleDetail.driverLicenseImage, consignmentId);
        console.log('DriverLicenseImage moved successfully:', driverLicenseImage);
        // updatedFields["vehicleDetail.driverLicenseImage"] = driverLicenseImage || vehicleDetail.driverLicenseImage;
        updatedFields["vehicleDetail.driverLicenseImage"] = driverLicenseImage
        ? `/inbound/${consignmentId}/driverLicenseImage/${driverLicenseImage}`
        : `/inbound/${consignmentId}/driverLicenseImage/${vehicleDetail.driverLicenseImage}`;     
      } catch (moveError) {
        console.error('Error moving DriverLicenseImage:', moveError);
        updatedFields["vehicleDetail.driverLicenseImage"] = '';
      }
    } else {
      updatedFields["vehicleDetail.driverLicenseImage"] = '';
    }

    // Move uploadPictureImage
    if (vehicleDetail.uploadPictureImage) {
      try {
        const uploadPictureImage = await commonFunction.moveToSingleImage(vehicleDetail.uploadPictureImage, consignmentId);
        console.log('UploadPictureImage moved successfully:', uploadPictureImage);
        // updatedFields["vehicleDetail.uploadPictureImage"] = uploadPictureImage || vehicleDetail.uploadPictureImage;
        updatedFields["vehicleDetail.uploadPictureImage"] = uploadPictureImage
        ? `/inbound/${consignmentId}/uploadPictureImage/${uploadPictureImage}`
        : `/inbound/${consignmentId}/uploadPictureImage/${vehicleDetail.uploadPictureImage}`;     
      } catch (moveError) {
        console.error('Error moving UploadPictureImage:', moveError);
        updatedFields["vehicleDetail.uploadPictureImage"] = '';
      }
    } else {
      updatedFields["vehicleDetail.uploadPictureImage"] = '';
    }
    // console.log("updatedFields",updatedFields);
    const updatedJob = await Job.findOneAndUpdate({ _id: jobId }, { $set: updatedFields }, { new: true });

    if (!updatedJob) {
      return res.status(404).json({ status: -1, message: 'Job not found' });
    }

    return res.status(200).json({ status: 1, message: 'Job updated successfully', updatedJob });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: -1, message: 'Internal server error' });
  }
});






module.exports = router;