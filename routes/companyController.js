const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const commonFunction = require('../public/js/commonFunction');
const Company = require('../schema/company');
const userModel = require('../schema/userModel');


// router.post('/create', async (req, res) => {
//   const reqQuery = req.query;
//   try {
//     const company = new Company(req.body);
//     const newCompany = await company.save();
//     return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##company created successfully##', reqQuery.language), 'responseData': newCompany });
//   } catch (error) {
//     return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
//   }
// });
router.post('/create', async (req, res) => {
  const reqQuery = req.query;
  try {
    const reqBody = req.body;
 // Check if the email already exists in the user collection
 const existingUser = await userModel.findOne({ emailAddress: reqBody.email });

 if (existingUser) {
   return res.status(400).json({
     'status': -1,
     'message': commonFunction.translate('##email already exists##', reqQuery.language),
   });
 }

 // Check if the email already exists in the company collection
 const existingCompany = await Company.findOne({ email: reqBody.email });

 if (existingCompany) {
   return res.status(400).json({
     'status': -1,
     'message': commonFunction.translate('##email already exists##', reqQuery.language),
   });
 }

    // Create a new company
    const company = new Company(req.body);
    const newCompany = await company.save();

    // Find the user who is creating the company
    const userInfo = await userModel.findOne({ _id: reqBody.userId });

    // Create a new user entry associated with the company
    const user = new userModel({
      companyId: newCompany._id,
      username: req.body.username,
      firstName: reqBody.name, 
      lastName: reqBody.name,  
      fullName: reqBody.name,  
      type: 2, 
      emailAddress: reqBody.email,
      createdBy: userInfo, // 
      companyInfo: {
        _id: newCompany._id,
        name: newCompany.name,
        contactNumber: newCompany.contactNumber,
        email: newCompany.email,
      },
    });

    // Save the user entry
    const newUser = await user.save();

    return res.status(200).json({
      'status': 1,
      'message': commonFunction.translate('##company created successfully##', reqQuery.language),
      'responseData': {
        company: newCompany,
        user: newUser, 
      },
    });
  } catch (error) {
    console.log('err',error)
    return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});



router.post('/list', async (req, res) => {
  const reqQuery = req.query;
  try {
    const company = await Company.find({});
    if (!company) 
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##company not found##', reqQuery.language) });
    
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##company listed successfully##', reqQuery.language), 'responseData': company });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

router.post('/getById', async (req, res) => {
  const reqQuery = req.query;
  try {
    const company = await Company.findOne({ _id: req.body._id });
    if (!company) 
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##company not found##', reqQuery.language) });
    
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), responseData: company });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

router.post('/update', async (req, res) => {
  const reqQuery = req.query;
  try {
    const company = await Company.findByIdAndUpdate(req.body._id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!company) 
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##company not found##', reqQuery.language) });
    
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##warehouse updated successfully##', reqQuery.language), responseData: company });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

router.delete('/delete', async (req, res) => {
  const reqQuery = req.query;
  try {
    const company = await Company.findByIdAndDelete(req.body._id);
    if (!company) 
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##company not found##', reqQuery.language) });
    
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##company deleted successfully##', reqQuery.language) });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

module.exports = router;