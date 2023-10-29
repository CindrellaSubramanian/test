const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Lane = require('../schema/lane');

// Create Lane
/**
 * @swagger
 * components:
 *   schemas:
 *     Lane:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         status:
 *           type: number
 *           description: The status of the vehicle
 *           
 * /lane/create:
 *   post:
 *     summary: Create Lane
 *     description: "Status -1 => validation missing || Status 1 => Lane created Successfully"
 *     tags: [Lane]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Lane'
 *           example:
 *             name: A
 *             description: "left side"
 *             status: 1
 *     responses:
 *       201:
 *         description: Lane created successfully
 *       500:
 *         description: Failed to create lane
 */

router.post('/create', async (req, res) => {
  try {
    const lane = new Lane(req.body);
    const newLane = await lane.save();
    return res.status(400).json({ 'status': 1, 'message': commonFunction.translate('##lane created successfully##', reqQuery.language), 'responseData': newLane });
  } catch (error) {
    return res.status(400).json({ 'status': 1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

// Lane List
/**
* @swagger
* /lane/list:
*   post:
*     summary: Retrieve Lane
*     tags: [Lane]
*     description: "Status -1 => validation error || Status -2 => Lane not found || Status 1 => Lane Listed Successfully"
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             properties:
*               _id:
*                 type: string
*             example:
*               _id: 646dbc9e4cd7fe1b30d4e7e7
*     responses:
*       200:
*         description: Lane listed successfully
*       404:
*         description: Lane not found
*       500:
*         description: Failed to retrieve lane
*/


router.post('/list', async (req, res) => {
  try {
    const lane = await Lane.findById(req.body.id);
    if (!lane) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##lane not found##', reqQuery.language) });
    }
    return res.status(400).json({ 'status': 1, 'message': commonFunction.translate('##lane listed successfully##', reqQuery.language), 'responseData': lane });
  } catch (error) {
    return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language), 'responseData': lane });
  }
});

// Lane Find by ID
/**
 * @swagger
 * /lane/getById:
 *   post:
 *     summary: Find Lane by ID
 *     tags: [Lane]
 *     description: "Status -1 => validation error || Status -2 => Lane not found || Status 1 => lane found successfully"
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
 *         description: Lane found successfully
 *       404:
 *         description: Lane not found
 *       500:
 *         description: Failed to find lane
 */
router.post('/getById', async (req, res) => {
  const reqQuery = req.query;
  try {
    const lane = await Lane.findOne({ _id: req.body._id });
    if (!lane) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##lane not found##', reqQuery.language) });
    }
    return res.status(400).json({ 'status': 1, 'message': commonFunction.translate('##lane found successfully##', reqQuery.language), responseData: lane });
  } catch (error) {
    return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

// Lane Update
/**
 * @swagger
 * /lane/update:
 *   post:
 *     summary: Update lane by ID
 *     description: "Status -1 => validation error || Status -2 => Lane not found || Status 1 => Lane Updated Successfully"
 *     tags:
 *       - Lane
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
 *             example:
 *               _id: "646dbc9e4cd7fe1b30d4e7e7"
 *               description: "121"
 *     responses:
 *       '200':
 *         description: Lane Updated Successfully
 *       '404':
 *         description: Lane not found
 *       '500':
 *         description: Internal server error
 */

router.post('/update', async (req, res) => {
  try {
    const lane = await Lane.findByIdAndUpdate(req.body.id, req.body, { new: true, runValidators: true });
    if (!lane) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##lane not found##', reqQuery.language) });
    }
    return res.status(400).json({ 'status': 1, 'message': commonFunction.translate('##lane updated successfully##', reqQuery.language), responseData: lane });
  } catch (error) {
    return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

/**
 * @swagger
 * /lane/delete:
 *   delete:
 *     summary: Delete an lane
 *     description: "Status -1 => validation error || Status -2 => Lane not found || Status 1 => Lane deleted Successfully"
 *     tags: [Lane]
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
 *         description: Lane deleted successfully
 *       '404':
 *         description: Lane not found
 *       '500':
 *         description: Failed to delete lane
 */

router.delete('/delete', async (req, res) => {
  try {
    const lane = await Lane.findByIdAndDelete(req.body.id);
    if (!lane) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##lane not found##', reqQuery.language) });
    }
    return res.status(400).json({ 'status': 1, 'message': commonFunction.translate('##lane deleted successfully##', reqQuery.language) });
  } catch (error) {
    return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

module.exports = router;