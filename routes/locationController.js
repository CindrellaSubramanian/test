const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const commonFunction = require('../public/js/commonFunction');
const Location = require('../schema/location');
const fs = require('fs');
const QRCode = require('qrcode');

// Create Location
/**
 * @swagger
 * components:
 *   schemas:
 *     Location:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         type:
 *           type: integer
 *         size:
 *           type: string
 *         width:
 *           type: string
 *         height:
 *           type: string
 *         available_size:
 *           type: string
 *         total_size:
 *           type: string
 * /location/create:
 *   post:
 *     summary: Create Location
 *     description: "Status -1 => validation missing || Status 1 => Location created Successfully"
 *     tags: [Location]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Location'
 *           example:
 *             name: location1
 *             type: 1
 *             size: "23"
 *             width: "45"
 *             height: "15"
 *             available_size: "14"
 *             total_size: "30"
 *     responses:
 *       200:
 *         description: Location created successfully
 *       500:
 *         description: Failed to create location
 */

router.post('/create', async (req, res) => {
  const reqQuery = req.query;
  try {
    req.body.status = 1;
    const location = new Location(req.body);
    const newLocation = await location.save();

    let stringdata = JSON.stringify({ locationId: newLocation._id });
    var locationId = newLocation._id;
    // Converting the data into base64
    QRCode.toDataURL(stringdata, async function (err, code) {
      if (err) return console.log("error occurred")

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
      let fileName = locationId + "_Location_QR.jpeg";
      try {
        fs.writeFileSync("./public/location_qr/" + fileName, imageBuffer, 'utf8');
        const updateLocation = await Location.updateOne({ _id: locationId }, { $set: { qrCode: "location_qr/" + fileName } });
        console.log("updateLocation", updateLocation);
      } catch (e) {
        console.log(e);
      }
    });
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##location created successfully##', reqQuery.language), 'responseData': newLocation });
  } catch (error) {
    console.log("create", error);
    return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

// Location List
/**
* @swagger
* /location/list:
*   post:
*     summary: Retrieve Location
*     tags: [Location]
*     description: "Status -1 => validation error || Status -2 => Location not found || Status 1 => Location Listed Successfully"
*     responses:
*       200:
*         description: Location listed successfully
*       404:
*         description: Location not found
*       500:
*         description: Failed to retrieve location
*/


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
    const location = await Location.find(filter).sort({ _id: -1 });
    if (!location) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##location not found##', reqQuery.language) });
    }
    var locationList = [];
    location.forEach(element => {
      var locationObj = {};
      locationObj = element;
      if (element.groupId == 1) {
        locationObj.groupName = "Inbound";
      } else if (element.groupId == 2) {
        locationObj.groupName = "OutBound";
      } else if (element.groupId == 3) {
        locationObj.groupName = "Temporary";
      } else if (element.groupId == 4) {
        locationObj.groupName = "Picking";
      } else if (element.groupId == 5) {
        locationObj.groupName = "Packing";
      } else if (element.groupId == 6) {
        locationObj.groupName = "Sorting";
      }
      locationList.push(locationObj);
    });
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##location listed successfully##', reqQuery.language), 'responseData': locationList });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

// Location Find by ID
/**
 * @swagger
 * /location/getById:
 *   post:
 *     summary: Find Location by ID
 *     tags: [Location]
 *     description: "Status -1 => validation error || Status -2 => Location not found || Status 1 => success"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 example: "646dbc9e4cd7fe1b30d4e7e7"
 *     responses:
 *       200:
 *         description: Location found successfully
 *       404:
 *         description: Location not found
 *       500:
 *         description: Failed to find location
 */
router.post('/getById', async (req, res) => {
  const reqQuery = req.query;
  try {
    const location = await Location.findOne({ _id: req.body._id });
    if (!location) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##location not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), responseData: location });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

// Location Update
/**
 * @swagger
 * /location/update:
 *   post:
 *     summary: Update location by ID
 *     description: "Status -1 => validation error || Status -2 => Location not found || Status 1 => Location Updated Successfully"
 *     tags:
 *       - Location
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *               name:
 *                 type: string
 *               type:
 *                 type: integer
 *               size:
 *                 type: string
 *               width:
 *                 type: string
 *               height:
 *                 type: string
 *               available_size:
 *                 type: string
 *               total_size:
 *                 type: string
 *             example:
 *               _id: "649304578c524f46dd90f061"
 *               name: "location2"
 *               type: 1
 *               size: "23"
 *               width: "45"
 *               height: "15"
 *               available_size: "14"
 *               total_size: "30"
 *     responses:
 *       '200':
 *         description: Location Updated Successfully
 *       '404':
 *         description: Location not found
 *       '500':
 *         description: Internal server error
 */


router.post('/update', async (req, res) => {
  const reqQuery = req.query;
  try {
    const location = await Location.findByIdAndUpdate(req.body._id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!location) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##location not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##location updated successfully##', reqQuery.language), responseData: location });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

/**
 * @swagger
 * /location/delete:
 *   delete:
 *     summary: Delete an location
 *     description: "Status -1 => validation error || Status -2 => Location not found || Status 1 => Location deleted Successfully"
 *     tags: [Location]
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
 *         description: Location deleted successfully
 *       '404':
 *         description: Location not found
 *       '500':
 *         description: Failed to delete location
 */

router.post('/delete', async (req, res) => {
  const reqQuery = req.query;
  try {
    const location = await Location.findByIdAndDelete(req.body._id);
    if (!location) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##location not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##location deleted successfully##', reqQuery.language) });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

module.exports = router;