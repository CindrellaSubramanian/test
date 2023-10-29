const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const commonFunction = require('../public/js/commonFunction');
const RackGroup = require('../schema/rackGroup');

// Create RackGroup
/**
 * @swagger
 * components:
 *   schemas:
 *     RackGroup:
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
 * /rackGroup/create:
 *   post:
 *     summary: Create RackGroup
 *     description: "Status -1 => validation missing || Status 1 => RackGroup created Successfully"
 *     tags: [RackGroup]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RackGroup'
 *           example:
 *             name: rackGroup1
 *             type: 1
 *             size: "23"
 *             width: "45"
 *             height: "15"
 *             available_size: "14"
 *             total_size: "30"
 *     responses:
 *       200:
 *         description: RackGroup created successfully
 *       500:
 *         description: Failed to create rackGroup
 */

router.post('/create', async (req, res) => {
  const reqQuery = req.query;
  try {
    req.body.status = 1;
    const rackGroup = new RackGroup(req.body);
    const newRackGroup = await rackGroup.save();
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##rackGroup created successfully##', reqQuery.language), 'responseData': newRackGroup });
  } catch (error) {
    return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

// RackGroup List
/**
* @swagger
* /rackGroup/list:
*   post:
*     summary: Retrieve RackGroup
*     tags: [RackGroup]
*     description: "Status -1 => validation error || Status -2 => RackGroup not found || Status 1 => RackGroup Listed Successfully"
*     responses:
*       200:
*         description: RackGroup listed successfully
*       404:
*         description: RackGroup not found
*       500:
*         description: Failed to retrieve rackGroup
*/


router.post('/list', async (req, res) => {
  const reqQuery = req.query;
  try {
    const rackGroup = await RackGroup.find({});
    if (!rackGroup) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##rackGroup not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##rackGroup listed successfully##', reqQuery.language), 'responseData': rackGroup });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

// RackGroup Find by ID
/**
 * @swagger
 * /rackGroup/getById:
 *   post:
 *     summary: Find RackGroup by ID
 *     tags: [RackGroup]
 *     description: "Status -1 => validation error || Status -2 => RackGroup not found || Status 1 => success"
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
 *         description: RackGroup found successfully
 *       404:
 *         description: RackGroup not found
 *       500:
 *         description: Failed to find rackGroup
 */
router.post('/getById', async (req, res) => {
  const reqQuery = req.query;
  try {
    const rackGroup = await RackGroup.findOne({ _id: req.body._id });
    if (!rackGroup) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##rackGroup not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), responseData: rackGroup });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

// RackGroup Update
/**
 * @swagger
 * /rackGroup/update:
 *   post:
 *     summary: Update rackGroup by ID
 *     description: "Status -1 => validation error || Status -2 => RackGroup not found || Status 1 => RackGroup Updated Successfully"
 *     tags:
 *       - RackGroup
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
 *               name: "rackGroup2"
 *               type: 1
 *               size: "23"
 *               width: "45"
 *               height: "15"
 *               available_size: "14"
 *               total_size: "30"
 *     responses:
 *       '200':
 *         description: RackGroup Updated Successfully
 *       '404':
 *         description: RackGroup not found
 *       '500':
 *         description: Internal server error
 */


router.post('/update', async (req, res) => {
  const reqQuery = req.query;
  try {
    const rackGroup = await RackGroup.findByIdAndUpdate(req.body._id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!rackGroup) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##rackGroup not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##rackGroup updated successfully##', reqQuery.language), responseData: rackGroup });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

/**
 * @swagger
 * /rackGroup/delete:
 *   delete:
 *     summary: Delete an rackGroup
 *     description: "Status -1 => validation error || Status -2 => RackGroup not found || Status 1 => RackGroup deleted Successfully"
 *     tags: [RackGroup]
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
 *         description: RackGroup deleted successfully
 *       '404':
 *         description: RackGroup not found
 *       '500':
 *         description: Failed to delete rackGroup
 */

router.post('/delete', async (req, res) => {
  const reqQuery = req.query;
  try {
    const rackGroup = await RackGroup.findByIdAndDelete(req.body._id);
    if (!rackGroup) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##rackGroup not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##rackGroup deleted successfully##', reqQuery.language) });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

module.exports = router;