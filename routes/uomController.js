const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const commonFunction = require('../public/js/commonFunction');
const Uom = require('../schema/uom');


router.post('/create', async (req, res) => {
    const reqQuery = req.query;
    try {
    //   req.body.status = 1;
      const uom = new Uom(req.body);
      const newUom = await uom.save();
      return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##uom created successfully##', reqQuery.language), 'responseData': newUom });
    } catch (error) {
      return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
    }
  });
  


  router.post('/list', async (req, res) => {
    const reqQuery = req.query;
    try {
      const uom = await Uom.find({});
      if (!uom) {
        return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##uom not found##', reqQuery.language) });
      }
      return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##uom listed successfully##', reqQuery.language), 'responseData': uom });
    } catch (error) {
      return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
    }
  });
  
  router.post('/getById', async (req, res) => {
    const reqQuery = req.query;
    try {
      const uom = await Uom.findOne({ _id: req.body._id });
      if (!uom) {
        return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##uom not found##', reqQuery.language) });
      }
      return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), responseData: uom });
    } catch (error) {
      return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
    }
  });


  
router.post('/update', async (req, res) => {
    const reqQuery = req.query;
    try {
      const uom = await Uom.findByIdAndUpdate(req.body._id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!uom) {
        return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##uom not found##', reqQuery.language) });
      }
      return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##uom updated successfully##', reqQuery.language), responseData: uom });
    } catch (error) {
      return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
    }
  });


  
router.delete('/delete', async (req, res) => {
    const reqQuery = req.query;
    try {
      const uom = await Uom.findByIdAndDelete(req.body._id);
      if (!uom) {
        return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##uom not found##', reqQuery.language) });
      }
      return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##uom deleted successfully##', reqQuery.language) });
    } catch (error) {
      return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
    }
  });
  
  module.exports = router;