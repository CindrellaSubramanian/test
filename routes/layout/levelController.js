const Level = require('../../schema/level');
const express = require('express');
const router = express.Router();
const mongoose=require('mongoose');
const commonFunction = require('../../public/js/commonFunction');

// Create a new level
// async function createLevel(levelData) {
//     try {
//         const level = new LevelController(levelData);
//         const newLevel = await level.save();
//         return newLevel;
//     } catch (error) {
//         throw new Error('Failed to create level.');
//     }
// }

/**
 * @swagger
 * /level/createLevel:
 *   post:
 *     summary: Create a new level
 *     tags:
 *       - Levels
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               levelId:
 *                 type: string
 *                 example: "L002"
 *               rackId:
 *                 type: string
 *                 example: "64a7f9e315319ee41ed46eae"
 *               levelNumber:
 *                 type: number
 *                 example: 1
 *               levelCapacity:
 *                 type: number
 *                 example: 10
 *               levelStatus:
 *                 type: string
 *                 enum:
 *                   - available
 *                   - occupied
 *                 example: "available"
 *               levelItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     itemId:
 *                       type: string
 *                       example: "1"
 *                     quantity:
 *                       type: number
 *                       example: 5
 *                 example:
 *                   - itemId: "1"
 *                     quantity: 5
 *                   - itemId: "2"
 *                     quantity: 3
 *               zoneId:
 *                 type: string
 *                 example: "64a7f9398864f0c07ab36dd9"
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Internal server error
 */

router.post('/createLevel', async (req, res) => {
    const reqQuery = req.query;
    try {
     
      const level = new Level(req.body);
      const newLevel= await level.save();
      return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##level created successfully##', reqQuery.language), 'responseData': newLevel });
    } catch (error) {
        console.log(error);
      return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
    }
  });

// Get all levels
// async function getAllLevels() {
//     try {
//         const levels = await LevelController.find();
//         return levels;
//     } catch (error) {
//         throw new Error('Failed to get levels.');
//     }
// }

/**
 * @swagger
 * /level/getAllLevels:
 *   post:
 *     summary: Get all levels
 *     tags:
 *       - Levels
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Levels not found
 *       500:
 *         description: Internal server error
 */

router.post('/getAllLevels', async (req, res) => {
    const reqQuery = req.query;
    try {
      const levels = await Level.find({});
      if (!levels) {
        return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##levels not found##', reqQuery.language) });
      }
      return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##levels listed successfully##', reqQuery.language), 'responseData': levels });
    } catch (error) {
      return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
    }
  });

// Get a single level by ID
// async function getLevelById(levelId) {
//     try {
//         const level = await LevelController.findById(levelId);
//         return level;
//     } catch (error) {
//         throw new Error('Failed to get level.');
//     }
// }

/**
 * @swagger
 * /level/getLevelById:
 *   post:
 *     summary: Get a level by its ID
 *     tags:
 *       - Levels
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               levelId:
 *                 type: string
 *                 example: "L002"
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Level not found
 *       500:
 *         description: Internal server error
 */


router.post('/getLevelById', async (req, res) => {
    const reqQuery = req.query;
    try {
      const level = await Level.findOne({levelId:req.body.levelId});
      if (!level) {
        return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##level not found##', reqQuery.language) });
      }
      return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), responseData: level });
    } catch (error) {
      return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
    }
  });


// Update a level by ID
// async function updateLevel(levelId, updates) {
//     try {
//         const level = await LevelController.findByIdAndUpdate(levelId, updates, { new: true });
//         return level;
//     } catch (error) {
//         throw new Error('Failed to update level.');
//     }
// }

/**
 * @swagger
 * /level/updateLevel:
 *   post:
 *     summary: Update a level
 *     tags:
 *       - Levels
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateLevelRequest'
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Level not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateLevelRequest:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64a7feee43ee50619805a7c7"
 *         levelNumber:
 *           type: number
 *           example: 1
 *         levelCapacity:
 *           type: number
 *           example: 10
 *         levelStatus:
 *           type: string
 *           enum:
 *             - available
 *             - occupied
 *           example: "available"
 *         levelItems:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               itemId:
 *                 type: string
 *                 example: "1"
 *               quantity:
 *                 type: number
 *                 example: 5
 *           example:
 *             - itemId: "1"
 *               quantity: 5
 *             - itemId: "2"
 *               quantity: 3
 *         zoneId:
 *           type: string
 *           example: "64a7f9398864f0c07ab36dd9"
 */


router.post('/updateLevel', async (req, res) => {
    const reqQuery = req.query;
    try {
      const  level= await Level.findByIdAndUpdate( new mongoose.Types.ObjectId(req.body._id), req.body,{ new: true, runValidators: true });
      if (!level) {
        return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##level not found##', reqQuery.language) });
      }
      return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##level updated successfully##', reqQuery.language), responseData: level });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
    }
  });

// Delete a level by ID
// async function deleteLevel(levelId) {
//     try {
//         await LevelController.findByIdAndDelete(levelId);
//         return true;
//     } catch (error) {
//         throw new Error('Failed to delete level.');
//     }
// }

/**
 * @swagger
 * /level/deleteLevel:
 *   delete:
 *     summary: Delete a level
 *     tags:
 *       - Levels
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeleteLevelRequest'
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Level not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     DeleteLevelRequest:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64a7f9398864f0c07ab36dd9"
 */


router.delete('/deleteLevel', async (req, res) => {
    const reqQuery = req.query;
    try {
      const level = await Level.findByIdAndDelete(req.body._id);
      if (!level) {
        return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##level not found##', reqQuery.language) });
      }
      return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##level deleted successfully##', reqQuery.language) });
    } catch (error) {
      return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
    }
  });

module.exports = router;