const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Client = require('../schema/client');
const commonFunction = require('../public/js/commonFunction');

// Create Client
router.post('/createCopy', async (req, res) => {
  const reqQuery = req.query;
  try {
    const reqBody = req.body;
    console.log("reqBody",reqBody)
    reqBody.status = 1;
    const client = new Client(reqBody);
    if (Array.isArray(reqBody.document) && reqBody.document.length > 0) {
      const folderName = 'clientDoc';
      const movedImageUrls = await Promise.all(reqBody.document.map(imageName => commonFunction.moveToSingleDoc(imageName, folderName)));
      reqBody.document = movedImageUrls;
    } else {
      reqBody.document = [];
    }
    const savedClient = await client.save();
    return res.status(200).json({ status: 1, message: commonFunction.translate('##client created successfully##', reqQuery.language), 'responseData': savedClient });

  } catch (error) {
    console.log('error', error);
    return res.status(404).json({ status: -1, message: commonFunction.translate('##internal server error##') });
  }
});

// Create Client
router.post('/create', async (req, res) => {
  const reqQuery = req.query;
  try {
    const reqBody = req.body;
    console.log("reqBody", reqBody);
    reqBody.status = 1;
    const client = new Client(reqBody);
    if (Array.isArray(reqBody.document) && reqBody.document.length > 0) {
      const folderName = 'clientDoc';
      const movedImageUrls = await Promise.all(reqBody.document.map(imageName => {
        console.log(`Moving image: ${imageName}`);
        return commonFunction.moveToSingleDoc(imageName, folderName);
      }));
      reqBody.document = movedImageUrls;
    } else {
      reqBody.document = [];
    }
    const savedClient = await client.save();
    return res.status(200).json({ status: 1, message: commonFunction.translate('##client created successfully##', reqQuery.language), 'responseData': savedClient });

  } catch (error) {
    console.log('error', error);
    return res.status(404).json({ status: -1, message: commonFunction.translate('##internal server error##') });
  }
});



// Client list
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
    const clients = await Client.find(filter).select('name contactPerson contactNumber address billingAddress shippingAddress companyWebsite industry paymentTerms notes email countryCode country state city zipCode about photoUrl contactPersonEmail contactPersonCountryCode contactPersonPhone gender position notes gstNumber panNumber status productMaster');
    return res.status(200).json({ status: 1, message: commonFunction.translate('##success##', reqQuery.language), 'responseData': clients });
  } catch (error) {
    return res.status(404).json({ status: -1, message: commonFunction.translate('##internal server error##') });
  }
});

router.post('/infoByGST', async (req, res) => {
  const reqQuery = req.query;
  let responseData = `{
        "_id": "64c89cf73a8fa4fd23fd7df3",
        "name": "Nihitha",
        "contactPerson": "Cindrella",
        "contactNumber": "9876598765",
        "address": "Coimbatore",
        "gstNo" : "29GGGGG1314R9Z6",
        "billingAddress": {
            "fullName": "Royal Unfield",
            "addressLine1": "NO2",
            "addressLine2": "Vijaya Kumar Cotton Industry",
            "city": "Coimbatore",
            "state": "TamilNadu",
            "zipcode": "18981",
            "country": "India",
            "phone": "+1 (113) 191-9776"
        },
        "shippingAddress": {
            "accountName": "",
            "addressLine1": "",
            "addressLine2": "",
            "city": "",
            "state": "",
            "zipcode": "",
            "country": "",
            "phone": ""
        },
        "companyWebsite": "www.royalUnfield.com",
        "industry": "Corporate",
        "paymentTerms": "Card",
        "notes": "",
        "email": "royal@gmail.com",
        "country": "India",
        "state": "Tamil Nadu",
        "city": "Coimbatore",
        "zipCode": 681101,
        "about": "About",
        "status": 1,
        "productMaster": [
            {
                "_id": "64c89aad3a8fa4fd23fd7d75",
                "msku": "Laptop",
                "title": "Hp",
                "information": "Win 11, Intel i5 11th Gen",
                "dimension": "",
                "uom": "kg",
                "height": "400",
                "breadth": "500",
                "weight": "1",
                "unitLBH": "",
                "unitW": "",
                "length": "400",
                "status": 1,
                "packageDetails": [
                ],
                "__v": 0
            }
        ]
    }`
  try {
    return res.status(200).json({ status: 1, message: commonFunction.translate('##success##', reqQuery.language), 'responseData': JSON.parse(responseData) });
  } catch (error) {

    console.log(error)
    return res.status(404).json({ status: -1, message: commonFunction.translate('##internal server error##') });
  }
});

// Client Update
router.post('/update', async (req, res) => {
  const reqQuery = req.query;
  try {
    const reqBody = req.body;
    if (!req.body._id)
      return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##validation error##', reqQuery.language) });

    const client = await Client.findOne({ _id: req.body._id });
    if (!client)
      return res.status(200).json({ 'status': -2, 'message': commonFunction.translate('##client not found##', reqQuery.language) });

    await Client.updateOne({ _id: req.body._id }, { $set: reqBody });
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##client updated successfully##', reqQuery.language) });
  } catch (error) {
    console.log(error);
    //res.status(500).json({ error: error.message });
    return res.status(200).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

// Client Delete
router.delete('/delete', async (req, res) => {
  const reqQuery = req.query;
  try {
    const client = await Client.findByIdAndDelete(req.body._id);
    if (!client)
      return res.status(200).json({ 'status': -1, 'message': commonFunction.translate('##data not found##', reqQuery.language) });

    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##client deleted successfully##', reqQuery.language) });
  } catch (error) {
    res.status(500).json({ error: error.message });
    return res.status(200).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

router.post('/getById', async (req, res) => {
  const reqQuery = req.query;
  try {
    if (!req.body._id) return res.status(400).json({ 'status': -1, 'message': commonFunction.translate('##validation error##', reqQuery.language) });
    const client = await Client.findOne({ _id: req.body._id }).select('name gstNo contactPerson contactNumber address billingAddress shippingAddress companyWebsite industry paymentTerms notes email countryCode country state city zipCode about photoUrl contactPersonEmail contactPersonCountryCode contactPersonPhone gender position notes gstNumber panNumber status productMaster');

    if (!client)
      return res.status(404).json({ 'status': -2, 'message': commonFunction.translate('##client not found##') });

    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), responseData: client });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##') });
  }
});

module.exports = router;