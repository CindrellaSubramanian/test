const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Zone = require('../../schema/zone');
const Level = require('../../schema/level');
const Rack = require('../../schema/rack');
const Aisle = require('../../schema/asile');
const commonFunction = require('../../public/js/commonFunction');

// Create a new zone
// router.post('/create', async (req, res) => {
//     try {
//         const { zoneName, zoneType, zoneCapacity, warehouseId } = req.body;

//         const zone = new Zone({
//             zoneName,
//             zoneType,
//             zoneCapacity,
//             warehouseId
//         });

//         const newZone = await zone.save();

//         res.status(201).json(newZone);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Failed to create zone' });
//     }
// });

/**
 * @swagger
 * /zone/create:
 *   post:
 *     summary: Create a new zone
 *     tags:
 *       - Zones
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateZoneRequest'
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Internal server error
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateZoneRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Zone 1"
 *         warehouseId:
 *           type: string
 *           example: "1"
 *         manager:
 *           type: string
 *           example: "John Doe"
 *         capacity:
 *           type: integer
 *           example: 100
 *         status:
 *           type: string
 *           example: "active"
 *         description:
 *           type: string
 *           example: "Description of the zone"
 *     Zone:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Zone 1"
 *         warehouseId:
 *           type: string
 *           example: "1"
 *         manager:
 *           type: string
 *           example: "John Doe"
 *         capacity:
 *           type: integer
 *           example: 100
 *         status:
 *           type: string
 *           example: "active"
 *         description:
 *           type: string
 *           example: "Description of the zone"
 */


router.post('/create', async (req, res) => {
    const reqQuery = req.query;
    try {
     
      const zone = new Zone(req.body);
      const newZone = await zone.save();
      return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##zone created successfully##', reqQuery.language), 'responseData': newZone });
    } catch (error) {
        console.log(error);
      return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
    }
  });

  
  
  

// Update a zone by ID
// router.put('/:_id', async (req, res) => {
//     try {
//         const { zoneName, zoneType, zoneCapacity, warehouseId } = req.body;

//         const updatedZone = await Zone.findByIdAndUpdate(req.params._id, {
//             zoneName,
//             zoneType,
//             zoneCapacity,
//             warehouseId
//         }, { new: true });

//         if (!updatedZone) {
//             return res.status(404).json({ message: 'Zone not found' });
//         }

//         res.json(updatedZone);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Failed to update zone' });
//     }
// });

/**
 * @swagger
 * /zone/updateZone:
 *   post:
 *     summary: Update a zone
 *     tags:
 *       - Zones
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateZoneRequest'
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Zone not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateZoneRequest:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64a7ed6e0b3e507e4e744e4f"
 *         name:
 *           type: string
 *           example: "Zone 1"
 *         warehouseId:
 *           type: string
 *           example: "1"
 *         manager:
 *           type: string
 *           example: "John Doe"
 *         capacity:
 *           type: integer
 *           example: 100
 *         status:
 *           type: string
 *           example: "active"
 *         description:
 *           type: string
 *           example: "Description of the zone"
 *     Zone:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Zone 1"
 *         warehouseId:
 *           type: string
 *           example: "1"
 *         manager:
 *           type: string
 *           example: "John Doe"
 *         capacity:
 *           type: integer
 *           example: 100
 *         status:
 *           type: string
 *           example: "active"
 *         description:
 *           type: string
 *           example: "Description of the zone"
 */


router.post('/updateZone', async (req, res) => {
    const reqQuery = req.query;
    try {
      const updatedZone = await Zone.findByIdAndUpdate( new mongoose.Types.ObjectId(req.body._id), req.body,{ new: true, runValidators: true });
      if (!updatedZone) {
        return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##zone not found##', reqQuery.language) });
      }
      return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##zone updated successfully##', reqQuery.language), responseData: updatedZone });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
    }
  });
// Get all zones
// router.get('/', async (req, res) => {
//     try {
//         const zones = await Zone.find();
//         res.json(zones);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Failed to retrieve zones' });
//     }
// });


/**
 * @swagger
 * /zone/getAllZone:
 *   post:
 *     summary: Get all zones
 *     tags:
 *       - Zones
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Zones not found
 *       500:
 *         description: Internal server error
 */

router.post('/list', async (req, res) => {
    const reqQuery = req.query;
  try {
    const reqBody = req.body;
    var query = {};
    if (reqBody.wareHouseId != undefined && reqBody.wareHouseId != "") {
      query.wareHouseId = new mongoose.Types.ObjectId(reqBody.wareHouseId);
    }
    if (reqBody.companyId != undefined && reqBody.companyId != "") {
      query.companyId = new mongoose.Types.ObjectId(reqBody.companyId);
    }
    console.log("query",query);
      const zone = await Zone.find(query);
      if (!zone) {
        return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##zone not found##', reqQuery.language) });
    }
    console.log("zone",zone);
      return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##zone listed successfully##', reqQuery.language), 'responseData': zone });
  } catch (error) {
    console.log(error);
      return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
    }
  });


  /**
 * @swagger
 * /zone/getZoneById:
 *   post:
 *     summary: Get a zone by ID
 *     tags:
 *       - Zones
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GetZoneByIdRequest'
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Zone not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     GetZoneByIdRequest:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64a7ed6e0b3e507e4e744e4f"
 *     Zone:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Zone 1"
 *         warehouseId:
 *           type: string
 *           example: "1"
 *         manager:
 *           type: string
 *           example: "John Doe"
 *         capacity:
 *           type: integer
 *           example: 100
 *         status:
 *           type: string
 *           example: "active"
 *         description:
 *           type: string
 *           example: "Description of the zone"
 */

  
  router.post('/getZoneById', async (req, res) => {
    const reqQuery = req.query;
    try {
      const zone = await Zone.findOne({_id:req.body._id});
      if (!zone) {
        return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##zone not found##', reqQuery.language) });
      }
      return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), responseData: zone });
    } catch (error) {
      return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
    }
  });

// Delete a zone by ID
// router.delete('/:_id', async (req, res) => {
//     try {
//         const deletedZone = await Zone.findByIdAndDelete(req.params._id);

//         if (!deletedZone) {
//             return res.status(404).json({ message: 'Zone not found' });
//         }

//         res.json({ message: 'Zone deleted successfully' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Failed to delete zone' });
//     }
// });

/**
 * @swagger
 * /zone/deleteZone:
 *   delete:
 *     summary: Delete a zone
 *     tags:
 *       - Zones
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeleteZoneRequest'
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Zone not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     DeleteZoneRequest:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64a7ed6e0b3e507e4e744e4f"
 */


router.delete('/deleteZone', async (req, res) => {
    const reqQuery = req.query;
    try {
      const zone = await Zone.findByIdAndDelete(req.body._id);
      if (!zone) {
        return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##zone not found##', reqQuery.language) });
      }
      return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##zone deleted successfully##', reqQuery.language) });
    } catch (error) {
      return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
    }
  });

  
  // // Zone list API endpoint
  // router.post('/zoneDetails', async (req, res) => {
  //   try {
  //     const { zoneId } = req.body;
  
  //     // Fetch the zone details
  //     const zone = await Zone.findById(zoneId);
  
  //     if (!zone) {
  //       return res.status(404).json({ error: 'Zone not found' });
  //     }
  
  //     // Fetch the aisles for the zone
  //     const aisles = await Aisle.find({ zoneId });
  
  //     // Fetch the racks for the zone
  //     const aisleIds = aisles.map(aisle => aisle._id);
  //     const racks = await Rack.find({ zoneId, aisleId: { $in: aisleIds } });
  
  //     // Fetch the levels for the racks
  //     const rackIds = racks.map(rack => rack._id);
  //     const levels = await Level.find({ zoneId, rackId: { $in: rackIds } });
  
  //     // Construct the response object
  //     const zoneDetails = {
  //       zone,
  //       aisles,
  //       racks,
  //       levels
  //     };
  
  //     res.json(zoneDetails);
  //   } catch (error) {
  //     console.error('Error fetching zone details:', error);
  //     res.status(500).json({ error: 'Internal server error' });
  //   }
  // });
  

// Assuming you have already imported the necessary models and dependencies

// Zone list API endpoint
router.post('/zoneDetails', async (req, res) => {
  try {
    const { zoneId } = req.body;

    // Fetch the zone details
    const zone = await Zone.findById(zoneId);

    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    // Fetch the aisles for the zone
    const aisles = await Aisle.find({ zoneId });

    // Fetch the racks for the zone
    const aisleIds = aisles.map(aisle => aisle._id);
    const racks = await Rack.find({ zoneId, aisleId: { $in: aisleIds } })
      .populate('aisleId'); // Populate the associated aisle document

    // Fetch the levels for the racks
    const rackIds = racks.map(rack => rack._id);
    const levels = await Level.find({ zoneId, rackId: { $in: rackIds } })
      .populate('rackId'); // Populate the associated rack document

    // Fetch the levelItems for the levels
    const levelIds = levels.map(level => level._id);
    const levelItems = await Level.find({ levelId: { $in: levelIds } });

    // Add levelItems to their respective levels
    levels.forEach(level => {
      level.levelItems = levelItems.filter(item => item.levelId.toString() === level._id.toString());
    });

    // Construct the response object
    const zoneDetails = {
      zone,
      aisles,
      racks,
      levels
    };

    res.json(zoneDetails);
  } catch (error) {
    console.error('Error fetching zone details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



module.exports = router;
