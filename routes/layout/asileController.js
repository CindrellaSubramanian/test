const Aisle = require('../../schema/asile');
const express = require('express');
const router = express.Router();
const mongoose=require('mongoose');
 const commonFunction = require('../../public/js/commonFunction');

/**
 * @swagger
 * components:
 *   schemas:
 *     AisleController:
 *       type: object
 *       properties:
 *         aisleId:
 *           type: string
 *         aisleName:
 *           type: string
 *         aisleLocation:
 *           type: string
 *         aisleDimensions:
 *           type: object
 *           properties:
 *             length:
 *               type: number
 *             width:
 *               type: number
 *             height:
 *               type: number
 *         aisleCapacity:
 *           type: number
 *         aisleType:
 *           type: string
 *         aisleStatus:
 *           type: string
 *           enum: [open, closed, under maintenance]
 *         aisleAccessibility:
 *           type: string
 *         aisleEquipment:
 *           type: string
 *         aisleSafetyInformation:
 *           type: string
 */

/**
 * @swagger
 * /aisle/createAisle:
 *   post:
 *     summary: Create a new aisle
 *     tags:
 *       - Aisles
 *     requestBody:
 *       description: AisleController object to be created
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AisleController'
 *     responses:
 *       '200':
 *         description: AisleController created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AisleController'
 *       '400':
 *         description: Invalid request body
 *       '500':
 *         description: Failed to create aisle
 */

// router.post('/createAisle', createAisle);
// async function createAisle(req, res) {
//     try {
//         const aisle = new Aisle(req.body);
//         const newAisle = await aisle.save();
//         res.json(newAisle);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Failed to create aisle' });
//     }
// }

router.post('/createAisle', async (req, res) => {
    const reqQuery = req.query;
    try {
     
      const aisle = new Aisle(req.body);
      const newAisle = await aisle.save();
      return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##aisle created successfully##', reqQuery.language), 'responseData': newAisle });
    } catch (error) {
        console.log(error);
      return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
    }
  });

/**
 * @swagger
 * /aisle/getAllAisles:
 *   post:
 *     summary: Get all aisles
 *     tags:
 *       - Aisles
 *     responses:
 *       '200':
 *         description: A list of aisles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AisleController'
 *       '500':
 *         description: Failed to get aisles
 */
// router.post('/getAllAisles', getAllAisles);
// async function getAllAisles(req, res) {
//     try {
//         const aisles = await Aisle.find();
//         res.json(aisles);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Failed to get aisles' });
//     }
// }


router.post('/getAllAisles', async (req, res) => {
    const reqQuery = req.query;
    try {
      const aisle = await Aisle.find({});
      if (!aisle) {
        return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##aisle not found##', reqQuery.language) });
      }
      return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##aisle listed successfully##', reqQuery.language), 'responseData': aisle });
    } catch (error) {
      return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
    }
  });
/**
 * @swagger
 * /aisle/getAisleById:
 *   post:
 *     summary: Get a single aisle by ID
 *     tags:
 *       - Aisles
 *     parameters:
 *       - name: aisleId
 *         in: path
 *         description: ID of the aisle to retrieve
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: AisleController found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AisleController'
 *       '404':
 *         description: AisleController not found
 *       '500':
 *         description: Failed to get aisle
 */
// router.post('/getAisleById', getAisleById);

// async function getAisleById(req, res) {
//     try {
//       const aisle = await Aisle.findById(new mongoose.Types.ObjectId({aisleId:req.body.aisleId}));
//       if (!aisle) {
//         return res.status(404).json({ message: 'Aisle not found' });
//       }
//       res.json(aisle);
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Failed to get aisle' });
//     }
//   }

  router.post('/getAisleById', async (req, res) => {
    const reqQuery = req.query;
    try {
      const aisle = await Aisle.findOne({aisleId:req.body.aisleId});
      if (!aisle) {
        return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##aisle not found##', reqQuery.language) });
      }
      return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), responseData: aisle });
    } catch (error) {
      return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
    }
  });


/**
 * @swagger
 * /aisle/:updateAisle
 *   post:
 *     summary: Update an aisle by ID
 *     tags:
 *       - Aisles
 *     parameters:
 *       - name: aisleId
 *         in: path
 *         description: ID of the aisle to update
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Updated aisle object
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AisleController'
 *     responses:
 *       '200':
 *         description: AisleController updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AisleController'
 *       '400':
 *         description: Invalid request body
 *       '404':
 *         description: AisleController not found
 *       '500':
 *         description: Failed to update aisle
 */
// router.post('/updateAisle', updateAisle);
// async function updateAisle(req, res) {
//     try {
//         const aisle = await Aisle.findByIdAndUpdate(req.params.aisleId, req.body, { new: true });
//         if (!aisle) {
//             return res.status(404).json({ message: 'AisleController not found' });
//         }
//         res.json(aisle);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Failed to update aisle' });
//     }
// }

router.post('/updateAisle', async (req, res) => {
    const reqQuery = req.query;
    try {
      const aisle = await Aisle.findByIdAndUpdate( new mongoose.Types.ObjectId(req.body._id), req.body,{ new: true, runValidators: true });
      if (!aisle) {
        return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##aisle not found##', reqQuery.language) });
      }
      return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##aisle updated successfully##', reqQuery.language), responseData: aisle });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
    }
  });
  

/**
 * @swagger
 * /aisle/deleteAisle:
 *   delete:
 *     summary: Delete an aisle by ID
 *     tags:
 *       - Aisles
 *     parameters:
 *       - name: aisleId
 *         in: path
 *         description: ID of the aisle to delete
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: AisleController deleted successfully
 *       '404':
 *         description: AisleController not found
 *       '500':
 *         description: Failed to delete aisle
 */
// router.post('/deleteAisle', deleteAisle);
// async function deleteAisle(req, res) {
//     try {
//         const aisle = await Aisle.findByIdAndDelete(req.params.aisleId);
//         if (!aisle) {
//             return res.status(404).json({ message: 'AisleController not found' });
//         }
//         res.json({ message: 'AisleController deleted successfully' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Failed to delete aisle' });
//     }
// }


router.delete('/deleteAisle', async (req, res) => {
    const reqQuery = req.query;
    try {
      const aisle = await Aisle.findByIdAndDelete(req.body._id);
      if (!aisle) {
        return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##aisle not found##', reqQuery.language) });
      }
      return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##aisle deleted successfully##', reqQuery.language) });
    } catch (error) {
      return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
    }
  });
  
module.exports = router;