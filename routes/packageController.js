const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const commonFunction = require('../public/js/commonFunction');
const Package = require('../schema/package');
const jobModel = require('../schema/job');
const userModel = require('../schema/userModel');
const Cart = require('../schema/cart');
const QRCode = require('qrcode');
const fs = require('fs');
const Location = require('../schema/location');
const Task = require('../schema/task')
const Job = require('../schema/job');
const wareHouse = require('../schema/warehouse');
/**
 * @swagger
 * /package/create:
 *   post:
 *     summary: Create Job Package
 *     tags: [Package]
 *     description: Creates a new job package
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jobId:
 *                 type: string
 *                 description: The ID of the job
 *               packageDetails:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/PackageDetail'
 *           examples:
 *             Example1:
 *               value:
 *                 jobId: "646dbc9e4cd7fe1b30d4e7e7"
 *                 packageDetail:
 *                   - jobId: "646dbc9e4cd7fe1b30d4e7e7"
 *                     packageMaterialType: "Package Type 2"
 *                     msku: "SKU2"
 *                     quantity: 5
 *                     weight: 2.3
 *                     unitKg: "kg"
 *                     packageLength: 75
 *                     packageBreadth: 40
 *                     unitMm: "mm"
 *                     materialType: "Material Type 2"
 *                     status: 1
 *                     type: 1
 *           required:
 *             - jobId
 *             - packageDetail
 *     responses:
 *       '200':
 *         description: Successful operation
 *       '400':
 *         description: Bad request
 *       '500':
 *         description: Internal server error
 *
 * components:
 *   schemas:
 *     PackageDetail:
 *       type: object
 *       properties:
 *         jobId:
 *           type: string
 *           description: The ID of the job
 *         packageMaterialType:
 *           type: string
 *           description: The package material type
 *         msku:
 *           type: string
 *           description: The SKU identifier
 *         quantity:
 *           type: number
 *           description: The quantity of packages
 *         weight:
 *           type: number
 *           description: The weight of each package
 *         unitKg:
 *           type: string
 *           description: The unit of weight (kg)
 *         packageLength:
 *           type: number
 *           description: The length of each package
 *         packageBreadth:
 *           type: number
 *           description: The breadth of each package
 *         unitMm:
 *           type: string
 *           description: The unit of dimensions (mm)
 *         materialType:
 *           type: string
 *           description: The type of material
 *         status:
 *           type: number
 *           description: The status of the package
 *         type:
 *           type: string
 *           description: The type of package
 */

router.post('/create', async (req, res) => {
  const reqQuery = req.query;
  try {
    const reqBody = req.body;
    if (!reqBody.jobId) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##job id missing##', reqQuery.language) });
    }

    const packageDetails = reqBody.packageDetails.map((package) => ({
      jobId: package.jobId,
      packageMaterialType: package.packageMaterialType,
      materialCode: package.materialCode,
      quantity: package.quantity,
      weight: package.weight,
      unitKg: package.unitKg,
      packageLength: package.packageLength,
      packageBreadth: package.packageBreadth,
      unitMm: package.unitMm,
      materialType: package.materialType,
      expectedQuantity: package.expectedQuantity,
      receivedQuantity: package.receivedQuantity,
      status: package.status || 1,
      type: package.type,

    }));
    // const userDetail = await userModel.findOne({ /* role: 3 */ }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1 });
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

    if (!userDetail) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##user not found##', reqQuery.language) });
    }
    var dataDesc = userDetail.fullName + ' initiated the package verification process. The checking of  packages containing the  products for any signs of damage or tampering.'
    const newLog = {
      description: dataDesc,
      status: 14, // packageCreated
      createdBy: userDetail.fullName,
      createdAt: new Date(),
    };

    const updatedJob = await jobModel.findByIdAndUpdate(
      reqBody.jobId,
      { $push: { packageDetails: { $each: packageDetails }, logs: newLog } },
      { new: true }
    );

    if (!updatedJob) {
      return res.status(404).json({ status: -1, message: 'Job not found' });
    }

    // Create packages in the package collection
    const createdPackages = await Package.create(packageDetails);

    return res.status(200).json({ status: 1, message: commonFunction.translate('##package created successfully##', reqQuery.language), responseData: createdPackages });
  } catch (error) {
    // console.log('error', error);
    return res.status(500).json({ status: -1, message: commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});






//packageList
/**
 * @swagger
 * /package/list:
 *   post:
 *     summary: Get a list of tasks
 *     tags:
 *       - Package
 *     description: "Status -2 => package not found || Status 1 => success"
 *     responses:
 *       '200':
 *         description: Success response
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
 *           description: The status code (-2 for package not found, -1 for other errors)
 *         message:
 *           type: string
 *           description: The error message
 *       example:
 *         status: -2
 *         message: Package not found
 */

router.post('/list', async (req, res) => {
  const reqBody = req.body;
  const reqQuery = req.query;

  try {
    let filter = {};

    const search = reqBody.search;

    if (search) {
      const searchFilter = { $regex: search, $options: 'i' };
      filter.$or = [
        { consignmentId: searchFilter },
        { materialCode: searchFilter }
      ];
    }

    if (reqBody.locationInfo !== undefined && reqBody.locationInfo !== "") {
      filter['locationInfo.name'] = reqBody.locationInfo;
    }

    if (reqBody.approvedStatus !== 0) {
      filter.approvedStatus = reqBody.approvedStatus;
    }

    if (reqBody.taskStatus) {
      filter.taskStatus = reqBody.taskStatus;
    }

    if (reqBody.wareHouseId != undefined && reqBody.wareHouseId != "") {
      filter.wareHouseId = new mongoose.Types.ObjectId(reqBody.wareHouseId);
    }

    if (reqBody.companyId != undefined && reqBody.companyId != "") {
      filter.companyId = new mongoose.Types.ObjectId(reqBody.companyId);
    }

    const packages = await Package.find(filter).sort({ _id: -1 });

    var responsePackageDetails = [];
    var totalItems = 0;
    var totalPackages = 0;


    for (const element of packages) {
      reqObj = element;
      reqObj.quantityText = element.approvedProductCount + ' items / ' + element.approvedQuantity + ' packages';

      if (reqObj.approvedStatus == "2") {
        // reqObj.quantityText = (element.defectedQuantity * element.productCount) + ' items / ' + element.defectedQuantity + ' packages';
        reqObj.quantityText =element.approvedProductCount  + ' items / ' + element.defectedQuantity + ' packages';
      } else {
        totalItems += parseInt(element.approvedProductCount);
        totalPackages += parseInt(element.approvedQuantity);
      }

      // Fetch the warehouse name based on wareHouseId
      if (reqObj.wareHouseId) {
        try {
          const warehouse = await wareHouse.findById(reqObj.wareHouseId);
          if (warehouse) {
            reqObj.wareHouseName = warehouse.name;
          } else {
            reqObj.wareHouseName = "";
          }
        } catch (error) {
          console.error("Error fetching warehouse:", error);
          reqObj.wareHouseName = "";
        }
      }

      responsePackageDetails.push(reqObj);
    }

    return res.status(200).json({
      status: 1,
      message: commonFunction.translate('##success##', reqQuery.language),
      totalItems: totalItems,
      totalPackages: totalPackages,
      responseData: responsePackageDetails.map(package => {
        // wareHouseName in each package object
        return {
          ...package.toObject(),
          wareHouseName: package.wareHouseName
        };
      })
    }
    )
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      'status': -1,
      'message': commonFunction.translate('##internal server error##', reqQuery.language),
      'responseData': []
    });
  }
});


//packagegetById
/**
 * @swagger
 * /package/getById:
 *   post:
 *     summary: Get a task by ID
 *     tags:
 *       - Package
 *     description: "Status -1 => validation error || Status -2 => package not found || Status 1 => success"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskGetByIdRequest'
 *     responses:
 *       '200':
 *         description: Success response
 *       '400':
 *         description: Validation error
 *       '500':
 *         description: Internal server error
 *
 * @swagger
 * components:
 *   schemas:
 *     TaskGetByIdRequest:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The ID of the task
 *       example:
 *         _id: "6491595a45c273046631b9f2"
 *
 *     TaskGetByIdResponse:
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
 *           id: "6491595a45c273046631b9f2"
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
 *         id: "6491595a45c273046631b9f2"
 *         name: "Task 1"
 *         description: "Description of Task 1"
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: number
 *           description: The status code (-1 for validation error, -2 for package not found, -1 for other errors)
 *         message:
 *           type: string
 *           description: The error message
 *       example:
 *         status: -1
 *         message: Validation error
 */



router.post('/getById', async (req, res) => {
  const reqQuery = req.query;
  try {
    if (!req.body._id) return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##validation error##', reqQuery.language) });
    const package = await Package.findOne({ _id: req.body._id });

    if (!package) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##package not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), responseData: package });

  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});



router.post('/getDetailById', async (req, res) => {
  const reqQuery = req.query;
  try {
    if (!req.body.packageId) return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##validation error##', reqQuery.language) });
    const package = await Package.findOne({ _id: req.body.packageId });

    if (!package) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##package not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), responseData: package });

  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

//packageupdate
// /**
//  * @swagger
//  * /package/update:
//  *   post:
//  *     summary: Update a package
//  *     tags:
//  *       - Package
//  *     description: "Status -1 => validation error || Status -2 => package not found || Status 1 => package updated successfully"
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             $ref: '#/components/schemas/PackageUpdateRequest'
//  *           example:
//  *               "_id": "6491a9e4e8441b9a6b6126a6",
//  *               "type": 1,
//  *               "packageMaterialType": "Package Type 2",
//  *               "msku": "SKU2",
//  *               "quantity": 5,
//  *               "weight": 2.3,
//  *               "unitKg": "kg",
//  *               "packageLength": 75,
//  *               "packageBreadth": 40,
//  *               "unitMm": "mm",
//  *               "materialType": "Material Type 2",
//  *               "status": 1
//  *     responses:
//  *       '200':
//  *         description: Success response
//  *       '400':
//  *         description: Validation error
//  *       '500':
//  *         description: Internal server error
//  */


router.post('/update', async (req, res) => {
  const reqQuery = req.query;
  try {
    if (!req.body._id) return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##validation error##', reqQuery.language) });

    const package = await Package.findByIdAndUpdate(req.body._id, req.body, { new: true, runValidators: true });
    if (!package) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##package not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##package updated successfully##', reqQuery.language), responseData: package });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});




//packagedelete
/**
* @swagger
* /package/delete:
*   delete:
*     summary: Delete a package
*     tags:
*       - Package
*     description: "Status -1 => validation missing || Status -2 => package not found || Status 1 => package deleted successfully"
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/PackageDeleteRequest'
*     responses:
*       '200':
*         description: Success response
*       '400':
*         description: Validation error
*       '500':
*         description: Internal server error
*
* @swagger
* components:
*   schemas:
*     PackageDeleteRequest:
*       type: object
*       properties:
*         _id:
*           type: string
*           description: The ID of the package
*       example:
*         _id: "6491a9e4e8441b9a6b6126a6"
*
*     PackageDeleteResponse:
*       type: object
*       properties:
*         status:
*           type: number
*           description: The status code (1 for success)
*         message:
*           type: string
*           description: The message corresponding to the status
*       example:
*         status: 1
*         message: Package deleted successfully
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


router.delete('/delete', async (req, res) => {
  const reqQuery = req.query;
  try {
    if (!req.body._id) return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##validation error##', reqQuery.language) });

    const package = await Package.findByIdAndDelete(req.body._id);
    if (!package) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##package not found##', reqQuery.language) });
    }
    return res.status(400).json({ 'status': 1, 'message': commonFunction.translate('##package deleted successfully##', reqQuery.language) });
  } catch (error) {
    return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

/**
 * @swagger
 * /package/listByJobId:
 *   post:
 *     summary: List Packages by Job ID
 *     tags: [Package]
 *     description: Retrieves a list of packages based on the job ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jobId:
 *                 type: string
 *                 description: The ID of the job
 *             example:
 *               jobId: "646dbc9e4cd7fe1b30d4e7e7"
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   description: The status code (1 for success)
 *                 message:
 *                   type: string
 *                   description: The response message
 *                 responseData:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: The ID of the package
 *                       jobId:
 *                         type: string
 *                         description: The ID of the job
 *                       packageMaterialType:
 *                         type: string
 *                         description: The package material type
 *                       msku:
 *                         type: string
 *                         description: The SKU identifier
 *                       quantity:
 *                         type: number
 *                         description: The quantity of packages
 *                       status:
 *                         type: string
 *                         description: The status of the package
 *                       information:
 *                         type: string
 *                         description: Additional information about the package
 *                       materialType:
 *                         type: string
 *                         description: The type of material
 *             example:
 *               status: 1
 *               message: Success
 *               responseData:
 *                 - _id: "646dbd11b92af816b9de3e68"
 *                   jobId: "646dbc9e4cd7fe1b30d4e7e7"
 *                   packageMaterialType: "Package Type 1"
 *                   msku: "SKU1"
 *                   quantity: 10
 *                   status: "Initial"
 *                   information: "100 * 50 mm  5.5 kg"
 *                   materialType: "Material Type 1"
 *                 - _id: "646dbd11b92af816b9de3e69"
 *                   jobId: "646dbc9e4cd7fe1b30d4e7e7"
 *                   packageMaterialType: "Package Type 2"
 *                   msku: "SKU2"
 *                   quantity: 5
 *                   status: "Sort"
 *                   information: "75 * 40 mm  2.3 kg"
 *                   materialType: "Material Type 2"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   description: The status code (-1 for error)
 *                 message:
 *                   type: string
 *                   description: The error message
 *                 responseData:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: The package object
 */


router.post('/listByJobId', async (req, res) => {
  const reqQuery = req.query;
  try {
    const reqBody = req.body;
    const package = await Package.find({ jobId: reqBody.jobId });
    if (!package) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##package not found##', reqQuery.language) });
    }
    var packageArr = [];
    package.forEach((element) => {
      var obj = {};
      obj._id = element._id;
      obj.jobId = element.jobId;
      obj.packageMaterialType = element.packageMaterialType;
      obj.materialCode = element.materialCode;
      obj.quantity = element.quantity;
      if (element.status == 1) {
        obj.status = "Initial";
      } else if (element.status == 2) {
        obj.status = "Sort";
      } else if (element.status == 3) {
        obj.status = "Assemble";
      } else if (element.status == 4) {
        obj.status = "Put away";
      } else if (element.status == 5) {
        obj.status = "Relocated";
      }

      obj.information = element.packageLength + ' * ' + element.packageBreadth + ' ' + element.unitMm + '  ' + element.weight + ' ' + element.unitKg;
      obj.materialType = element.materialType;
      packageArr.push(obj);
    });
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), 'responseData': packageArr });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language), 'responseData': package });
  }
});




router.post('/quantityVerification', async (req, res) => {
  try {

    const { _id, consignmentId, quantityDetail } = req.body;
    const jobId = _id;
    const approvedPackages = [];
    const defectedPackages = [];
    const jobInfo = await jobModel.findOne({ _id: jobId }, { gateInfo: 1, bayInfo: 1, consignmentId: 1, clientId: 1, clientDetail: 1, vehicleDetail: 1, invoiceNo: 1, purchaseOrderNo: 1, shipmentDetail: 1, skuDetails: 1, type: 1 });
    if (!jobInfo) {
      return res.status(404).json({ status: -3, message: commonFunction.translate('##job not found##', reqQuery.language) });
    }
    for (const item of quantityDetail) {
      const { type, materialCode, quantity, approvedQuantity, defectedQuantity, expectedQuantity, unit, weight, length, breadth, dimension, productCount, locationId } = item;

      //// Initialize an empty object to hold location information

      const location = await Job.findById(jobId).select('unloadLocationInfo');
      const locationInfo = location.unloadLocationInfo;

      console.log("unloadLocationInfo-----", locationInfo)
      // Fetch location information based on locationId
      // if (locationId) {
      //   try {
      //     const location = await Location.findById(locationId);
      //     if (location) {
      //       locationInfo._id = location._id;
      //       locationInfo.name = location.name;
      //       locationInfo.qrCode = location.qrCode;
      //     }
      //   } catch (error) {
      //     // console.log(error);
      //   }
      // }
      if (approvedQuantity > 0) {
        // Save the approvedQuantity package
        const approvedPackage = new Package({
          jobId,
          jobInfo: jobInfo,
          consignmentId,
          materialCode: materialCode,
          type: type, // The type value from the request body
          approvedStatus: 1, // Set approvedStatus to 1
          expectedQuantity,
          quantity,
          approvedQuantity,
          unit,
          weight,
          length,
          breadth,
          dimension,
          productCount: productCount ? productCount : 0,
          approvedProductCount: (parseInt(productCount) * parseInt(approvedQuantity)),
          locationInfo: locationInfo,
          cartStatus: 0,
          wareHouseId: req.body.wareHouseId,
          companyId: req.body.companyId,
          "taskInfo" : {
            "type" : 5,
            "taskName" : "Unload",
            "status" : 3
        }
        });
        var savePackage = await approvedPackage.save();
        let stringdata = JSON.stringify({ packageId: savePackage._id });
        var packageId = savePackage._id;
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
        approvedPackages.push(approvedPackage.toObject());
      }

      if (defectedQuantity > 0) {
        // Save the defectedQuantity package
        const defectedPackage = new Package({
          jobId,
          jobInfo: jobInfo,
          consignmentId,
          materialCode: materialCode,
          type: type, // The type value from the request body
          approvedStatus: 2, // Set approvedStatus to 2
          quantity,
          defectedQuantity,
          expectedQuantity,
          unit,
          weight,
          length,
          breadth,
          dimension,
          approvedProductCount: (parseInt(productCount) * parseInt(defectedQuantity)),
          locationInfo: locationInfo,
          cartStatus: 0,
          wareHouseId: req.body.wareHouseId,
          companyId: req.body.companyId,
          "taskInfo" : {
            "type" : 5,
            "taskName" : "Unload",
            "status" : 3
        }
        });
        var saveDefectedPackage = await defectedPackage.save();

        let stringVal = JSON.stringify({ packageId: saveDefectedPackage._id });
        var defectedPackageId = saveDefectedPackage._id;
        // Converting the data into base64
        QRCode.toDataURL(stringVal, async function (err, code) {
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
          let fileName = defectedPackageId + "_Package_QR.jpeg";
          try {
            fs.writeFileSync("./public/inbound/" + consignmentId + "/" + fileName, imageBuffer, 'utf8');
            const updatePackage = await Package.updateOne({ _id: defectedPackageId }, { $set: { qrCode: "inbound/" + consignmentId + "/" + fileName } });
            // // console.log("updatePackage", updatePackage);
          } catch (e) {
            // console.log(e);
          }
        });

        defectedPackages.push(defectedPackage.toObject());
      }
    }

    // Check if no package was saved, and if so, return an error message
    const savedPackagesCount = quantityDetail.filter(item => item.approvedQuantity > 0 || item.defectedQuantity > 0).length;
    if (savedPackagesCount === 0) {
      return res.status(400).json({ status: -1, message: 'No packages to save. Both approvedQuantity and defectedQuantity are 0.' });
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

    if (userDetail == null) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##user not found##', reqQuery.language) });
    }
    var dataDesc = userDetail.fullName + 'started the quantity verification process for the  products,then checked the devices in each package to ensure that the correct quantity was received as per the order.'
    grnInfo = {
      "no": Math.floor(1000 + Math.random() * 9000),
      "date": new Date(),
      "GENo": "04D-" + Math.floor(1000 + Math.random() * 9000),
      "billNo": "B" + Math.floor(1000 + Math.random() * 9000),
      "challanNo": Math.floor(1000 + Math.random() * 9000),
      "LRNo": "2023",
      "transporter": "SMD",
      "vehicle": "TN37H" + Math.floor(1000 + Math.random() * 9000)
    }
    // logEntry = {
    //   createdBy: userDetail.fullName,
    //   description: 'test',
    //   status: 11, // Grn generator
    //   createdAt: new Date()
    // };
    statusInfo = {
      status: 6, // GRN Generator
      createdBy: userDetail.fullName,
      createdAt: new Date(),
      description: dataDesc
    };
    jobStatus = 6; // GRN Generator
    // console.log("req.body.jobId", req.body);
    // const jobResult = await jobModel.updateOne({ _id: req.body._id }, { $set: { 'grnInfo': grnInfo, status: jobStatus, statusInfo: statusInfo } });

    // const jobResult = await jobModel.updateOne({ _id: jobId }, {
    //   $set: {
    //     'grnInfo': grnInfo,
    //     status: jobStatus,
    //     logEntry:logEntry,
    //     statusInfo: statusInfo,
    //     packageInfo: { 
    //       approvedPackage: approvedPackages,
    //       defectedPackage: defectedPackages,
    //     }
    //   }
    // });
    var dataDesc = userDetail.fullName + ' started the grn generated for the  products,then checked the devices in each package to ensure that the correct quantity was received as per the order.'

    const logEntry = {
      createdBy: userDetail.fullName,
      description: dataDesc,
      status: 11, // Grn generator
      createdAt: new Date()
    };

    const jobResult = await jobModel.updateOne({ _id: jobId }, {
      $set: {
        grnInfo: grnInfo,
        status: jobStatus,
        statusInfo: statusInfo,
        packageDetails: quantityDetail
      },
      $push: { logs: logEntry } // Use $push to add the new log entry to the existing logs array
    });

    // console.log("jobResult********", jobResult, jobId);
    res.status(200).json({ status: 1, message: 'Packages saved successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: -1, message: 'Internal server error' });
  }
});




router.post('/addToCart', async (req, res) => {
  try {
    const { packageId, userId, type } = req.body;
    const existingPackage = await Package.findById(packageId);

    if (!existingPackage) {
      return res.status(404).json({ status: 0, message: 'Package not found' });
    }

    existingPackage.cartStatus = 1;
    await existingPackage.save();

    // Update the cartStatus in taskDetails array of objects
    await Task.updateOne(
      { "packageDetails._id": packageId },
      { $set: { "packageDetails.$.cartStatus": 1 } }
    );

    const packageInfo = { ...existingPackage.toObject(), taskType: type, cartStatus: existingPackage.cartStatus };

    let cartObj = await Cart.findOne({ "userId": userId }, "_id");
    if (!cartObj) {
      const newCartItem = {
        packageInfo: [packageInfo],
        userId: userId
      };
      cartObj = await Cart.create(newCartItem);
    } else {
      let isPackageExist = await Cart.exists({ "packageInfo._id": packageId });

      if (isPackageExist) {
        res.status(200).json({ status: 1, message: 'Package already added to cart' });
        return;
      } else {
        await Cart.updateOne({ _id: cartObj._id }, { $push: { packageInfo: packageInfo } });
      }
    }

    let newCartItem = await Cart.find({ "userId": userId });

    res.status(200).json({ status: 1, message: 'Package added to cart successfully!', cartItem: newCartItem });
  } catch (error) {
    console.error('Error adding data to cart:', error);
    res.status(500).json({ status: -1, message: 'Internal server error' });
  }
});


router.post('/selectBin', async (req, res) => {
  const reqQuery = req.query;
  try {
    const reqBody = req.body;
    // const bin = await Package.find({ shelfId: reqBody.packageID });
    const package = await Package.updateOne({ _id: reqBody.packageId }, { "selectedBin": reqBody.selectedBin, createdAt: Date.now(), updatedAt: Date.now() })
    console.log("package", package);
    if (!package) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##Bin selection failed ##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##Bin selected successfully##', reqQuery.language), 'responseData': package });
  } catch (error) {
    // console.log(error)
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});


// router.post('/repackage', async (req, res) => {
//   const reqQuery = req.query;
//   try {
//     const reqBody = req.body;
//     const user = await userModel.findById(reqBody.userId);
//     if (!user) {
//       return res.status(404).json({ status: -2, message: commonFunction.translate('##user not found##', reqQuery.language) });
//     }
//     // const assignedByUser = await userModel.findOne({}, { _id: 1, fullName: 1 }).sort({ _id: 1 });
//     if (req.body.createdBy == undefined) {
//       var assignedByUser = await userModel.findOne({}, { _id: 1, fullName: 1 }).sort({ _id: 1 });
//     } else {
//       var assignedByUser = await userModel.findOne({ _id: createdBy }, { _id: 1, fullName: 1 }).sort({ _id: 1 });
//     }
//     const jobInfo = await jobModel.findOne({ _id: reqBody.existingPackageDetail[0].jobId }, { _id: 1, consignmentId: 1, clientId: 1, clientDetail: 1, invoiceNo: 1, purchaseOrderNo: 1, bayInfo: 1, type: 1 });
//     const packageInfo = await Package.findOne({ _id: reqBody.existingPackageDetail[0]._id });
//     if (!packageInfo) {
//       return res.status(404).json({ status: -3, message: commonFunction.translate('##package not found##', reqQuery.language) });
//     }
//     const newTaskData = {
//       type: 7,
//       status: 1,
//       userId: reqBody.userId,
//       bayInfo: jobInfo.bayInfo,
//       wareHouseId: req.body.wareHouseId,
//       companyId: req.body.companyId,
//       assignedBy: { _id: assignedByUser._id, name: assignedByUser.fullName },
//       assignedTo: { _id: reqBody.userId, name: user.fullName },
//       date: commonFunction.currentDate(),
//       time: commonFunction.currentTime(),
//       jobInfo: {
//         _id: jobInfo._id,
//         consignmentId: jobInfo.consignmentId,
//         clientId: jobInfo.clientId,
//         clientDetail: jobInfo.clientDetail,
//         invoiceNo: jobInfo.invoiceNo,
//         purchaseOrderNo: jobInfo.purchaseOrderNo,
//         bayInfo: jobInfo.bayInfo,
//       },
//       newPackageDetail: [
//         {
//           type: req.body.newpackageDetail[0].type,
//           materialCode: req.body.newpackageDetail[0].materialCode,
//           newPackageCount: req.body.newpackageDetail[0].newPackageCount,
//           newProductCount: req.body.newpackageDetail[0].newProductCount
//         }
//       ]
//     };

//     const newTask = new Task(newTaskData);
//     const savedTask = await newTask.save();
//     // await Task.updateOne({ _id: savedTask._id }, { status: 3 });

//     // Package Create

//     const approvedPackage = new Package({
//       jobId: jobInfo._id,
//       jobInfo: jobInfo,
//       consignmentId: jobInfo.consignmentId,
//       materialCode: req.body.newpackageDetail[0].materialCode,
//       type: req.body.newpackageDetail[0].type, // The type value from the request body
//       approvedStatus: 1, // Set approvedStatus to 1
//       expectedQuantity: packageInfo.expectedQuantity,
//       approvedQuantity: req.body.newpackageDetail[0].newPackageCount,
//       weight: packageInfo.weight,
//       length: packageInfo.length,
//       breadth: packageInfo.breadth,
//       productCount: packageInfo.productCount,
//       approvedProductCount: req.body.newpackageDetail[0].newProductCount,
//       locationInfo: packageInfo.locationInfo,
//       cartStatus: 0,
//       wareHouseId: req.body.wareHouseId,
//       companyId: req.body.companyId,
//     });
//     var savePackage = await approvedPackage.save();

//     let stringdata = JSON.stringify({ packageId: savePackage._id });
//     var packageId = savePackage._id;
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
//         fs.writeFileSync("./public/inbound/" + jobInfo.consignmentId + "/" + fileName, imageBuffer, 'utf8');
//         const updatePackage = await Package.updateOne({ _id: packageId }, { $set: { qrCode: "inbound/" + jobInfo.consignmentId + "/" + fileName } });
//         // // console.log("updatePackage", updatePackage);
//       } catch (e) {
//         // console.log(e);
//       }
//     });

//     const updatePackage = await Package.updateOne({ _id: reqBody.existingPackageDetail[0]._id }, {
//       $set: {
//         approvedProductCount: (parseInt(req.body.existingPackageDetail[0].approvedProductCount) - parseInt(req.body.existingPackageDetail[0].consumedProductCount)),
//         approvedQuantity: parseInt(req.body.existingPackageDetail[0].alterPackageCount)
//       }
//     });
//     console.log("updatePackage", updatePackage);
//     if (user.deviceToken !== undefined && user.deviceToken !== "") {
//       const dataValue = JSON.stringify({
//         "to": user.deviceToken,
//         "notification": {
//           "title": "WMS",
//           "body": "Repackage task assigned to you",
//           "icon": "task assign to you",
//           "sound": "default",
//         },
//         "data": {
//           "message": {
//             "title": "Wms",
//             "message": "Repackage task assigned to you",
//             "priority": 0,
//             "status": 1,
//           },
//         },
//       });
//       commonFunction.sendPushNotification(dataValue);
//     }
//     // res.status(200).json({ message: 'Task created successfully', taskId: savedTask._id });


//     res.status(200).json({ status: 1, message: 'Task created successfully' });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ status: -1, message: 'An error occurred while creating the task' });
//   }
// });

// router.post('/repackageComplete', async (req, res) => {
//   try {
//     const taskId = req.body.taskId;
//     const existingPackageDetail = req.body.existingPackageDetail;
//     const newPackageDetail = req.body.newPackageDetail;

//     // Update the task's status to 3
//     await Task.updateOne({ _id: taskId }, { status: 3 });

//     for (const packageItem of existingPackageDetail) {
//       const packageId = packageItem._id;
//       const consumedProductCount = parseInt(packageItem.consumedProductCount);
//       const alterPackageCount = parseInt(packageItem.alterPackageCount);

//       if (!isNaN(consumedProductCount)) {
//         const updatedPackage = await Package.findByIdAndUpdate(
//           packageId,
//           {
//             $set: {
//               consumedProductCount: consumedProductCount,
//               approvedProductCount: packageItem.approvedProductCount - consumedProductCount,
//               alterPackageCount: alterPackageCount,
//               repackageStatus: 3
//             }
//           },
//           { new: true }
//         );

//         // console.log(`Updated package with ID ${packageId}:`, updatedPackage);

//         // Update consumedProductCount and approvedProductCount in existingPackageDetail
//         packageItem.consumedProductCount = consumedProductCount;
//         packageItem.approvedProductCount = updatedPackage.approvedProductCount;
//         packageItem.alterPackageCount = alterPackageCount;
//       }
//     }

//     for (const newPackageItem of newPackageDetail) {
//       const newPackage = new Package({
//         msku: newPackageItem.msku,
//         type: newPackageItem.type,
//         productCount: newPackageItem.newPackageCount,
//         approvedProductCount: newPackageItem.newPackageCount,
//         consumedProductCount: newPackageItem.newProductCount,
//         alterPackageCount: newPackageItem.newPackageCount, // Modify based on your requirement
//         status: 3,
//         repackageStatus: 3

//       });

//       await newPackage.save();
//     }


//     res.status(200).json({ status: 1, message: 'Repackaging completed successfully' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ status: -1, message: 'An error occurred during repackaging completion' });
//   }
// });


router.post('/repackage', async (req, res) => {
  const reqQuery = req.query;
  try {
    const reqBody = req.body;
    const user = await userModel.findById(reqBody.userId);
    if (!user) {
      return res.status(404).json({ status: -2, message: commonFunction.translate('##user not found##', reqQuery.language) });
    }

    if (req.body.createdBy == undefined) {
      var assignedByUser = await userModel.findOne({}, { _id: 1, fullName: 1 }).sort({ _id: 1 });
    } else {
      var assignedByUser = await userModel.findOne({ _id: reqBody.createdBy }, { _id: 1, fullName: 1 }).sort({ _id: 1 });
    }

    const jobInfo = await jobModel.findOne({ _id: reqBody.existingPackageDetail[0].jobId }, { _id: 1, consignmentId: 1, clientId: 1, clientDetail: 1, invoiceNo: 1, purchaseOrderNo: 1, bayInfo: 1, type: 1 });

    const newTaskData = {
      type: 7,
      status: 1,
      userId: reqBody.userId,
      bayInfo: jobInfo.bayInfo,
      wareHouseId: reqBody.wareHouseId,
      companyId: reqBody.companyId,
      assignedBy: { _id: assignedByUser._id, name: assignedByUser.fullName },
      assignedTo: { _id: reqBody.userId, name: user.fullName },
      date: commonFunction.currentDate(),
      time: commonFunction.currentTime(),
      jobInfo: {
        _id: jobInfo._id,
        consignmentId: jobInfo.consignmentId,
        clientId: jobInfo.clientId,
        clientDetail: jobInfo.clientDetail,
        invoiceNo: jobInfo.invoiceNo,
        purchaseOrderNo: jobInfo.purchaseOrderNo,
        bayInfo: jobInfo.bayInfo,
      },
      packageDetails: reqBody.existingPackageDetail,
      newPackageDetail: reqBody.newpackageDetail, // Insert the newpackageDetail directly
    };

    const newTask = new Task(newTaskData);
    const savedTask = await newTask.save();

    if (user.deviceToken !== undefined && user.deviceToken !== "") {
      const dataValue = JSON.stringify({
        "to": user.deviceToken,
        "notification": {
          "title": "WMS",
          "body": "Repackage task assigned to you",
          "icon": "task assign to you",
          "sound": "default",
        },
        "data": {
          "message": {
            "title": "Wms",
            "message": "Repackage task assigned to you",
            "priority": 0,
            "status": 1,
          },
        },
      });
      commonFunction.sendPushNotification(dataValue);
    }

    res.status(200).json({ status: 1, message: 'Task created successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: -1, message: 'An error occurred while creating the task' });
  }
});

// router.post('/repackageComplete', async (req, res) => {
//   try {
//     const reqBody = req.body;
//     const taskId = reqBody.taskId;

//     // Check if the required fields are present in the request body
//     if (!taskId) {
//       return res.status(400).json({ status: -2, message: 'Task ID is required' });
//     }

//     // Update the task's status to 3
//     const updatedTask = await Task.findByIdAndUpdate(
//       taskId,
//       { $set: { status: 3 } },
//       { new: true }
//     );

//     if (!updatedTask) {
//       return res.status(404).json({ status: -2, message: 'Task not found' });
//     }

//     for (const packageItem of updatedTask.packageDetails) {
//       const packageId = packageItem._id;
//       const consumedProductCount = parseInt(packageItem.consumedProductCount);
//       const alterPackageCount = parseInt(packageItem.alterPackageCount);

//       if (!isNaN(consumedProductCount)) {
//         const updatedPackage = await Package.findByIdAndUpdate(
//           packageId,
//           {
//             $set: {
//               consumedProductCount: consumedProductCount,
//               approvedProductCount: packageItem.approvedProductCount - consumedProductCount,
//               alterPackageCount: alterPackageCount,
//               repackageStatus: 3
//             }
//           },
//           { new: true }
//         );

//         // Update consumedProductCount and approvedProductCount in the task
//         packageItem.consumedProductCount = consumedProductCount;
//         packageItem.approvedProductCount = updatedPackage.approvedProductCount;
//         packageItem.alterPackageCount = alterPackageCount;
//       }
//     }

//     if (updatedTask.newPackageDetail) {
//       const newPackageItem = updatedTask.newPackageDetail[0];

//       // Populate companyId and wareHouseId based on the values from packageDetails
//       const companyId = updatedTask.companyId;
//       const wareHouseId = updatedTask.wareHouseId;

//       // Create a new Package
//       const approvedPackage = new Package({
//         jobId: updatedTask.jobInfo._id,
//         jobInfo: updatedTask.jobInfo,
//         consignmentId: updatedTask.jobInfo.consignmentId,
//         materialCode: newPackageItem.materialCode,
//         type: newPackageItem.type,
//         approvedStatus: 1, // Set approvedStatus to 1
//         expectedQuantity: newPackageItem.newProductCount,
//         approvedQuantity: newPackageItem.newPackageCount,
//         weight: 10,
//         length: 10,
//         breadth: 10,
//         productCount: newPackageItem.newProductCount,
//         approvedProductCount: newPackageItem.newProductCount,
//         locationInfo: updatedTask.packageDetails[0].locationInfo,
//         cartStatus: 0,
//         companyId: companyId,
//         wareHouseId: wareHouseId,
//       });

//       // Save the new Package
//       const savedPackage = await approvedPackage.save();

//       // Generate and save the QR code
//       const packageId = savedPackage._id.toString();
//       const qrCodeFileName = packageId + '_Package_QR.jpeg';
//       const qrCodeFilePath = './public/inbound/' + updatedTask.jobInfo.consignmentId + '/' + qrCodeFileName;

//       // Generate QR code
//       const qrCodeData = JSON.stringify({ packageId });
//       QRCode.toFile(qrCodeFilePath, qrCodeData, async (err) => {
//         if (err) {
//           console.error(err);
//         } else {
//           // Update the package with the QR code file path
//           const updatePackage = await Package.updateOne({ _id: savedPackage._id }, { $set: { qrCode: 'inbound/' + updatedTask.jobInfo.consignmentId + '/' + qrCodeFileName } });
//         }
//       });
//     }

    
//     res.status(200).json({ status: 1, message: 'Repackaging completed successfully' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ status: -1, message: 'An error occurred during repackaging completion' });
//   }
// });



router.post('/repackageCompleteCopy', async (req, res) => {
  try {
    const reqBody = req.body;
    const taskId = reqBody.taskId;
    const packageId = reqBody.packageId;
    const type = reqBody.type;

    // Check if the required fields are present in the request body
    if (!taskId || !packageId || !type) {
      return res.status(400).json({ status: -2, message: 'Task ID, Package ID, and Type are required' });
    }
    const task = await Task.findOne({ _id: taskId });

    if (!task) {
      return res.status(404).json({ status: -2, message: 'Task not found' });
    }

  

    // Update the task's status to 3
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $set: { status: 3 } },
      { new: true }
    );


    if (!updatedTask) {
      return res.status(404).json({ status: -2, message: 'Task not found' });
    }

    for (const packageItem of updatedTask.packageDetails) {
      const packageItemId = packageItem._id;
      const consumedProductCount = parseInt(packageItem.consumedProductCount);
      const alterPackageCount = parseInt(packageItem.alterPackageCount);

      if (!isNaN(consumedProductCount)) {
        const updatedPackage = await Package.findByIdAndUpdate(
          packageItemId,
          {
            $set: {
              consumedProductCount: consumedProductCount,
              approvedProductCount: packageItem.approvedProductCount - consumedProductCount,
              alterPackageCount: alterPackageCount,
              repackageStatus: 3
            }
          },
          { new: true }
        );

        // Update consumedProductCount and approvedProductCount in the task
        packageItem.consumedProductCount = consumedProductCount;
        packageItem.approvedProductCount = updatedPackage.approvedProductCount;
        packageItem.alterPackageCount = alterPackageCount;
      }
    }

    if (updatedTask.newPackageDetail) {
      const newPackageItem = updatedTask.newPackageDetail[0];

      // Populate companyId and wareHouseId based on the values from packageDetails
      const companyId = updatedTask.companyId;
      const wareHouseId = updatedTask.wareHouseId;

      // Create a new Package
      const approvedPackage = new Package({
        jobId: updatedTask.jobInfo._id,
        jobInfo: updatedTask.jobInfo,
        consignmentId: updatedTask.jobInfo.consignmentId,
        materialCode: newPackageItem.materialCode,
        type: newPackageItem.type,
        approvedStatus: 1, // Set approvedStatus to 1
        expectedQuantity: newPackageItem.newProductCount,
        approvedQuantity: newPackageItem.newPackageCount,
        weight: 10,
        length: 10,
        breadth: 10,
        productCount: newPackageItem.newProductCount,
        approvedProductCount: newPackageItem.newProductCount,
        locationInfo: updatedTask.packageDetails[0].locationInfo,
        cartStatus: 0,
        companyId: companyId,
        wareHouseId: wareHouseId,
        // taskId: taskId, // Save taskId as an ObjectId
      });

      // Save the new Package
      const savedPackage = await approvedPackage.save();

      const cartToRemove = await Cart.deleteMany({ userId: reqBody.userId });


      // Generate and save the QR code
      const packageId = savedPackage._id.toString();
      const qrCodeFileName = packageId + '_Package_QR.jpeg';
      const qrCodeFilePath = './public/inbound/' + updatedTask.jobInfo.consignmentId + '/' + qrCodeFileName;

      // Generate QR code
      const qrCodeData = JSON.stringify({ packageId });
      QRCode.toFile(qrCodeFilePath, qrCodeData, async (err) => {
        if (err) {
          console.error(err);
        } else {
          // Set the taskName and additional fields in the taskInfo object
          const subtaskName = { "1": "Put away", "2": "Sort", "3": "Assemble", "4": "Relocate", "5": "Unload", "6": "QA", "7": "Repackage", "8": "Picker", "9": "Load", "10": "Pack" };
          const taskName = subtaskName[type] || "";

          const taskInfo = {
            taskId: updatedTask._id,
            type: type,
            taskName: taskName,
            status: 3
          };

          // Update the package with the QR code file path and taskInfo
          const updatePackage = await Package.updateOne(
            { _id: savedPackage._id },
            {
              $set: {
                qrCode: 'inbound/' + updatedTask.jobInfo.consignmentId + '/' + qrCodeFileName,
                taskInfo: taskInfo
              }
            }
          );
        }
      });
    }

    res.status(200).json({ status: 1, message: 'Repackaging completed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: -1, message: 'An error occurred during repackaging completion' });
  }
});



router.post('/repackageComplete', async (req, res) => {
  try {
    const reqBody = req.body;
    const taskId = reqBody.taskId;
    const packageId = reqBody.packageId;
    const type = reqBody.type;

    // Check if the required fields are present in the request body
    if (!taskId || !packageId || !type) {
      return res.status(400).json({ status: -2, message: 'Task ID, Package ID, and Type are required' });
    }
    const task = await Task.findOne({ _id: taskId });

    if (!task) {
      return res.status(404).json({ status: -2, message: 'Task not found' });
    }

  

    // Update the task's status to 3
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $set: { status: 3 } },
      { new: true }
    );


    if (!updatedTask) {
      return res.status(404).json({ status: -2, message: 'Task not found' });
    }

    for (const packageItem of updatedTask.packageDetails) {
      const packageItemId = packageItem._id;
      const consumedProductCount = parseInt(packageItem.consumedProductCount);
      const alterPackageCount = parseInt(packageItem.alterPackageCount);

      if (!isNaN(consumedProductCount)) {
        const updatedPackage = await Package.findByIdAndUpdate(
          packageItemId,
          {
            $set: {
              consumedProductCount: consumedProductCount,
              approvedProductCount: packageItem.approvedProductCount - consumedProductCount,
              alterPackageCount: alterPackageCount,
              repackageStatus: 3
            }
          },
          { new: true }
        );

        // Update consumedProductCount and approvedProductCount in the task
        packageItem.consumedProductCount = consumedProductCount;
        packageItem.approvedProductCount = updatedPackage.approvedProductCount;
        packageItem.alterPackageCount = alterPackageCount;
      }
    }

    if (updatedTask.newPackageDetail) {
      const newPackageItem = updatedTask.newPackageDetail[0];

      // Populate companyId and wareHouseId based on the values from packageDetails
      const companyId = updatedTask.companyId;
      const wareHouseId = updatedTask.wareHouseId;

      // Create a new Package
      const approvedPackage = new Package({
        jobId: updatedTask.jobInfo._id,
        jobInfo: updatedTask.jobInfo,
        consignmentId: updatedTask.jobInfo.consignmentId,
        materialCode: newPackageItem.materialCode,
        type: newPackageItem.type,
        approvedStatus: 1, // Set approvedStatus to 1
        expectedQuantity: newPackageItem.newProductCount,
        approvedQuantity: newPackageItem.newPackageCount,
        weight: 10,
        length: 10,
        breadth: 10,
        productCount: newPackageItem.newProductCount,
        approvedProductCount: newPackageItem.newProductCount,
        locationInfo: updatedTask.packageDetails[0].locationInfo,
        cartStatus: 0,
        companyId: companyId,
        wareHouseId: wareHouseId,
        // taskId: taskId, // Save taskId as an ObjectId
      });

      // Save the new Package
      const savedPackage = await approvedPackage.save();

      const cartToRemove = await Cart.deleteMany({ userId: reqBody.userId });


      // Generate and save the QR code
      const packageId = savedPackage._id.toString();
      const qrCodeFileName = packageId + '_Package_QR.jpeg';
      const qrCodeFilePath = './public/inbound/' + updatedTask.jobInfo.consignmentId + '/' + qrCodeFileName;

      // Generate QR code
      const qrCodeData = JSON.stringify({ packageId });
      QRCode.toFile(qrCodeFilePath, qrCodeData, async (err) => {
        if (err) {
          console.error(err);
        } else {
          // Set the taskName and additional fields in the taskInfo object
          const subtaskName = { "1": "Put away", "2": "Sort", "3": "Assemble", "4": "Relocate", "5": "Unload", "6": "QA", "7": "Repackage", "8": "Picker", "9": "Load", "10": "Pack" };
          const taskName = subtaskName[type] || "";

          const taskInfo = {
            taskId: updatedTask._id,
            type: type,
            taskName: taskName,
            status: 3
          };

          // Update the package with the QR code file path and taskInfo
          const updatePackage = await Package.updateOne(
            { _id: savedPackage._id },
            {
              $set: {
                qrCode: 'inbound/' + updatedTask.jobInfo.consignmentId + '/' + qrCodeFileName,
                taskInfo: taskInfo
              }
            }
          );
        }
      });
    }
    
   // Update the user's status to 0
   const userId = task.userId; // Assuming you have a userId field in your task object

   // Check if userId is available
   if (!userId) {
     return res.status(400).json({ status: -2, message: 'User ID not found in the task' });
   }

   // Update the user's status to 0 in the user collection
   const updatedUser = await userModel.findByIdAndUpdate(
     userId,
     { $set: { status: 0 } },
     { new: true }
   );

   if (!updatedUser) {
     return res.status(404).json({ status: -2, message: 'User not found' });
   }


    res.status(200).json({ status: 1, message: 'Repackaging completed successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: -1, message: 'An error occurred during repackaging completion' });
  }
});




router.post('/packageResponse', (req, res) => {

  const requestBody = req.body;
  const responseData = requestBody;
  try {
    res.status(200).json({ status: 1, message: 'success', responseData });
  } catch (error) {
    res.status(500).json({ status: -1, message: 'An error occurred while package list' });
  }
});


// Endpoint to check if a cart with the given packageId exists

router.post('/checkPackage', async (req, res) => {
  try {
    const packageId = req.body.packageId;
    const userId = req.body.userId;

    // Check if a cart with the given packageId and userId exists in the packageInfo array
    const cart = await Cart.findOne({
      userId: userId,
      'packageInfo._id': packageId
    });

    if (cart) {
      res.status(200).json({ status: 1, message: 'Package exist in the cart' });
    } else {
      res.status(200).json({ status: -1, message: 'Package does not exist in the cart' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;
