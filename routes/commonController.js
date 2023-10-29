const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const commonFunction = require('../public/js/commonFunction');
require('dotenv').config();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

router.post('/getAccessToken', async (req, res) => {
  const reqHeader = req.headers;
  try {
    if (!reqHeader.authorization) return res.status(401).json({ status: -1, message: commonFunction.translate('##jwt error##', reqQuery.language) });

    const authorizedUser = jwt.verify(reqHeader.authorization, process.env.REFRESHTOKEN);

    const accessToken = jwt.sign({ userId: authorizedUser.userId, role: authorizedUser.role }, process.env.ACCESSTOKEN, {
      expiresIn: '30m',
    });
    return res.status(200).json({ status: 1, accessToken: accessToken });
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ status: -1, message: commonFunction.translate('##jwt error##', reqQuery.language) });
    }
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const destinationFolder = './public/temp';
    createDirectory(destinationFolder); // Create the destination directory if it doesn't exist
    cb(null, destinationFolder);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now(); // Get the current timestamp
    const originalName = file.originalname;
    const extension = originalName.split('.').pop(); // Get the file extension
    const fileName = `${timestamp}.${extension}`; // Add timestamp to the filename
    cb(null, fileName);
  }
});

const upload = multer({ storage }).any('Image');

router.post('/uploadImages', function (req, res) {
  upload(req, res, function (err) {
    if (err) {
      res.status(500).send(err);
    } else {
      if (!req.files || req.files.length === 0) {
        res.status(400).json({ 'status': -1, 'message': 'no file selected' });
      } else {
        const imagePath = path.basename(req.files[0].path);
        res.json({ 'status': 1, 'message': 'file uploaded successfully', 'imagePath': imagePath });
      }
    }
  });
});

router.post('/uploadDocuments', function (req, res) {
  upload(req, res, function (err) {
    if (err) {
      res.status(500).send(err);
    } else {
      if (!req.files || req.files.length === 0) {
        res.status(400).json({ 'status': -1, 'message': 'no file selected' });
      } else {
        const imagePath = path.basename(req.files[0].path);
        res.json({ 'status': 1, 'message': 'file uploaded successfully', 'imagePath': imagePath });
      }
    }
  });
});

function createDirectory(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

router.get('/getCore', async (req, res) => {
  var responseData = {};
  responseData.sampleExcelUrl = `${process.env.BASEURL}excel/excelFile/excelLas.xlsx`;
  responseData.length = ["Meters(m)", "Centimeters(cm)", "Millimeters(mm)", "Feet(ft)", "Inches(in)", "Yards(yd)"];
  responseData.mass = ["Kilograms(kg)", "Grams(g)", "Milligrams(mg)", "Pounds(lb)", "Ounces(oz)", "Bag(bag)"];
  responseData.volume = ["Liters(L)", "Milliliters(mL)", "Gallons(gal)", "Quarts(qt)", "Pints(pt)"];
  responseData.time = ["Seconds(s)", "Minutes(min)", "Hours(hr)", "Days(d)", "Weeks(wk)"];
  responseData.temperature = ["Celsius(°C)", "Fahrenheit(°F)", "Kelvin(K)"];
  responseData.area = ["Square meters(m^2)", "Square centimeters(cm^2)", "Square feet(ft^2)", "Square yards(yd^2)", "Hectares (ha)"];
  responseData.rackType = ["Bulking Storage", "Staging Area", "Down Forwork Pick Area", "Replenishment Inventory", "Hazards", "Cold Storage"];
  responseData.divisionType=["Bulk Materials","Parcel Shipments","Palletized Goods","Hazardous Materials","Perishable Goods","High-Value Items","Oversized or Overweight Products","Fragile Items","Seasonal Merchandise","Non-Standard Shapes","High-Volume Products","Low-Volume Products"];
  return res.json({ 'status': 1, 'message': 'file uploaded successfully', responseData: responseData });
});

const multiStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const consignmentId = req.body._id; // Assuming the _id field represents the consignmentId
    const destinationFolder = `./public/inbound/${consignmentId}`;

    createDirectory(destinationFolder); // Create the destination directory if it doesn't exist
    cb(null, destinationFolder);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now(); // Get the current timestamp
    const originalName = file.originalname;
    const extension = originalName.split('.').pop(); // Get the file extension
    const fileName = `${timestamp}.${extension}`; // Add timestamp to the filename
    cb(null, fileName);
  }
});

const multiUpload = multer({ storage: multiStorage }).array('Images');

router.post('/uploadMultiImages', function (req, res) {
  multiUpload(req, res, function (err) {
    if (err) {
      res.status(500).send(err);
    } else {
      if (!req.files || req.files.length === 0) {
        res.status(400).json({ 'status': -1, 'message': 'no file selected' });
      } else {
        const consignmentId = req.body._id; // Assuming the _id field represents the consignmentId
        const destinationFolder = `./public/inbound/${consignmentId}`;

        // Move the uploaded files from '/public/temp' to the destination folder
        req.files.forEach(file => {
          const tempPath = file.path;
          const targetPath = path.join(destinationFolder, file.filename);
          fs.renameSync(tempPath, targetPath);
        });
        res.json({ 'status': 1, 'message': 'files uploaded successfully' });
      }
    }
  });
});

module.exports = router;