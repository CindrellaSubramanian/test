const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const commonFunction = require('../public/js/commonFunction');
const RackGroup = require('../schema/rackGroup');
const ZoneModel = require('../schema/zone');
const Rack = require('../schema/rack');
const Shelf = require('../schema/shelf');
const BinModel = require('../schema/bin');
const QRCode = require("qrcode");
const fs = require("fs");
const RackType = require('../schema/rackType');
/**
 * @swagger
 * components:
 *   schemas:
 *     RackController:
 *       type: object
 *       properties:
 *         rackId:
 *           type: string
 *         rackName:
 *           type: string
 *         rackType:
 *           type: string
 *         rackCapacity:
 *           type: number
 *         aisleId:
 *           type: string
 */

/**
 * @swagger
 * /rack/createRack:
 *   post:
 *     summary: Create a new rack
 *     tags:
 *       - Racks
 *     requestBody:
 *       description: RackController object to be created
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RackController'
 *     responses:
 *       '200':
 *         description: RackController created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RackController'
 *       '400':
 *         description: Invalid request body
 *       '500':
 *         description: Failed to create rack
 */

// router.post('/create', async (req, res) => {
//   const reqQuery = req.query;
//   try {
//     const reqBody = req.body;
//     if (!reqBody.rackGroupId || !reqBody.quantity || !reqBody.zoneId || !reqBody.zoneName || !reqBody.uom) {
//       return res.status(400).json({ status: -1, message: commonFunction.translate('##validation error##', reqQuery.language) });
//     }
//     const rackGroupDetail = await RackGroup.findOne({ _id: reqBody.rackGroupId });
//     if (rackGroupDetail == null) {
//       return res.status(400).json({ status: -2, message: commonFunction.translate('##rack group not found##', reqQuery.language) });
//     }
//     const zoneDetail = await ZoneModel.findOne({ _id: reqBody.zoneId });
//     if (zoneDetail == null) {
//       return res.status(400).json({ status: -3, message: commonFunction.translate('##zone group not found##', reqQuery.language) });
//     }
//     const rackCount = await Rack.find({ zoneId: reqBody.zoneId }).count();
//     for (let i = 0; i < reqBody.quantity; i++) {
//       var reqVal = {};
//       reqVal.status = 1;
//       reqVal.name = reqBody.zoneName + '-' + 'R' + (rackCount + i + 1);
//       reqVal.rackGroupId = reqBody.rackGroupId;
//       reqVal.rackGroupName = reqBody.rackGroupName;
//       reqVal.zoneId = reqBody.zoneId;
//       reqVal.zoneName = reqBody.zoneName;
//       reqVal.companyId = reqBody.companyId;
//       reqVal.wareHouseId = reqBody.wareHouseId;
//       reqVal.status = 1;
//       reqVal.type = reqBody.type;
//       reqVal.uom = reqBody.uom;
//       const rackData = new Rack(reqVal);
//       var newRack = await rackData.save();
//       for (let j = 0; j < rackGroupDetail.shelfCount; j++) {
//         shelfVal = {};
//         shelfVal.rackGroupId = reqBody.rackGroupId;
//         shelfVal.rackGroupName = reqBody.rackGroupName;
//         shelfVal.name = newRack.name + '-' + 'S' + (j + 1);
//         shelfVal.zoneId = reqBody.zoneId;
//         shelfVal.zoneName = reqBody.zoneName;
//         shelfVal.rackId = newRack._id;
//         shelfVal.status = 1;
//         shelfVal.type = reqBody.type;
//         shelfVal.rackName = newRack.name;
//         shelfVal.companyId = reqBody.companyId;
//         shelfVal.wareHouseId = reqBody.wareHouseId;
//         const shelfData = new Shelf(shelfVal);
//         var newShelf = await shelfData.save();
//         for (let k = 0; k < rackGroupDetail.binInEachShelf; k++) {
//           binVal = {};
//           binVal.rackGroupId = reqBody.rackGroupId;
//           binVal.rackGroupName = reqBody.rackGroupName;
//           binVal.name = newShelf.name + '-' + 'B' + (k + 1);
//           binVal.zoneId = reqBody.zoneId;
//           binVal.zoneName = reqBody.zoneName;
//           binVal.rackId = newRack._id;
//           binVal.rackName = newRack.name;
//           binVal.shelfId = newShelf._id;
//           binVal.shelfName = newShelf.name;
//           binVal.status = 1;
//           binVal.type = reqBody.type;
//           binVal.companyId = reqBody.companyId;
//           binVal.wareHouseId = reqBody.wareHouseId;
//           binVal.qr = newShelf.name + '-' + 'B' + (k + 1);;
//           binVal.fileName = newShelf.name + '.png';
//           const binData = new BinModel(binVal);
//           const newBin = await binData.save();

//           QRCode.toDataURL(binVal.name, async function (err, code) {
//             if (err) return console.log("error occurred")

//             // Printing the code
//             var matches = code.match(/^data:([A-Za-z-+/]+);base64,(.+)$/),
//               response = {};

//             if (matches.length !== 3) {
//               return new Error('Invalid input string');
//             }
//             response.type = matches[1];
//             response.data = Buffer.from(matches[2], 'base64');
//             let decodedImg = response;
//             let imageBuffer = decodedImg.data;
//             let fileName = binVal.name + ".png";
//             try {
//               fs.writeFileSync("./public/bin_qr/" + fileName, imageBuffer, 'utf8');
//               // const updateLocation = await Location.updateOne({ _id: locationId }, { $set: { qrCode: "location_qr/" + fileName } });
//               // console.log("updateLocation", updateLocation);
//               // const binData = new BinModel(binVal);
//               // const newBin = await binData.save();
//             } catch (e) {
//               console.log(e);
//             }
//           });
//         }
//       }
//     }
//     return res.status(200).json({ status: 1, message: commonFunction.translate('##rack created successfully##', reqQuery.language) });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({ status: -1, message: commonFunction.translate('##internal server error##', reqQuery.language) });
//   }
// });



router.post('/createcopy', async (req, res) => {
  const reqQuery = req.query;
  try {
    const reqBody = req.body;
    if (!reqBody.rackGroupId || !reqBody.quantity || !reqBody.zoneId || !reqBody.zoneName) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##validation error##', reqQuery.language) });
    }
    const rackGroupDetail = await RackGroup.findOne({ _id: reqBody.rackGroupId });
    if (rackGroupDetail == null) {
      return res.status(400).json({ status: -2, message: commonFunction.translate('##rack group not found##', reqQuery.language) });
    }
    const zoneDetail = await ZoneModel.findOne({ _id: reqBody.zoneId });
    if (zoneDetail == null) {
      return res.status(400).json({ status: -3, message: commonFunction.translate('##zone group not found##', reqQuery.language) });
    }
    const rackCount = await Rack.find({ zoneId: reqBody.zoneId }).count();
    for (let i = 0; i < reqBody.quantity; i++) {
      var reqVal = {};
      reqVal.status = 1;
      reqVal.name = reqBody.zoneName + '-' + 'R' + (rackCount + i + 1);
      reqVal.rackGroupId = reqBody.rackGroupId;
      reqVal.rackGroupName = reqBody.rackGroupName;
      reqVal.zoneId = reqBody.zoneId;
      reqVal.zoneName = reqBody.zoneName;
      reqVal.companyId = reqBody.companyId;
      reqVal.wareHouseId = reqBody.wareHouseId;
      reqVal.status = 1;
      reqVal.type = reqBody.type;
      reqVal.uom = reqBody.uom;
      const rackData = new Rack(reqVal);
      var newRack = await rackData.save();
      for (let j = 0; j < rackGroupDetail.shelfCount; j++) {
        shelfVal = {};
        shelfVal.rackGroupId = reqBody.rackGroupId;
        shelfVal.rackGroupName = reqBody.rackGroupName;
        shelfVal.name = newRack.name + '-' + 'S' + (j + 1);
        shelfVal.zoneId = reqBody.zoneId;
        shelfVal.zoneName = reqBody.zoneName;
        shelfVal.rackId = newRack._id;
        shelfVal.status = 1;
        shelfVal.type = reqBody.type;
        shelfVal.rackName = newRack.name;
        shelfVal.companyId = reqBody.companyId;
        shelfVal.wareHouseId = reqBody.wareHouseId;
        const shelfData = new Shelf(shelfVal);
        var newShelf = await shelfData.save();
        for (let k = 0; k < rackGroupDetail.binInEachShelf; k++) {
          binVal = {};
          binVal.rackGroupId = reqBody.rackGroupId;
          binVal.rackGroupName = reqBody.rackGroupName;
          binVal.name = newShelf.name + '-' + 'B' + (k + 1);
          binVal.zoneId = reqBody.zoneId;
          binVal.zoneName = reqBody.zoneName;
          binVal.rackId = newRack._id;
          binVal.rackName = newRack.name;
          binVal.shelfId = newShelf._id;
          binVal.shelfName = newShelf.name;
          binVal.status = 1;
          binVal.type = reqBody.type;
          binVal.companyId = reqBody.companyId;
          binVal.wareHouseId = reqBody.wareHouseId;
          binVal.qr = newShelf.name + '-' + 'B' + (k + 1);;
          binVal.fileName = newShelf.name + '.png';
          // const binData = new BinModel(binVal);
          // const newBin = await binData.save();

          QRCode.toDataURL(binVal.name, async function (err, code) {
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
            let fileName = binVal.name + ".png";
            try {
              fs.writeFileSync("./public/bin_qr/" + fileName, imageBuffer, 'utf8');
              // const updateLocation = await Location.updateOne({ _id: locationId }, { $set: { qrCode: "location_qr/" + fileName } });
              // console.log("updateLocation", updateLocation);
              const binData = new BinModel(binVal);
              const newBin = await binData.save();
            } catch (e) {
              console.log(e);
            }
          });
        }
      }
    }
    return res.status(200).json({ status: 1, message: commonFunction.translate('##rack created successfully##', reqQuery.language) });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: -1, message: commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});


router.post('/create', async (req, res) => {
  const reqQuery = req.query;
  try {
    const reqBody = req.body;
    if (!reqBody.rackGroupId || !reqBody.quantity || !reqBody.zoneId || !reqBody.zoneName) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##validation error##', reqQuery.language) });
    }
    const rackGroupDetail = await RackGroup.findOne({ _id: reqBody.rackGroupId });
    if (rackGroupDetail == null) {
      return res.status(400).json({ status: -2, message: commonFunction.translate('##rack group not found##', reqQuery.language) });
    }
    const zoneDetail = await ZoneModel.findOne({ _id: reqBody.zoneId });
    if (zoneDetail == null) {
      return res.status(400).json({ status: -3, message: commonFunction.translate('##zone group not found##', reqQuery.language) });
    }
    const rackCount = await Rack.find({ zoneId: reqBody.zoneId }).count();
    
    for (let i = 0; i < reqBody.quantity; i++) {
      let reqVal = {};
      reqVal.status = 1;
      reqVal.name = reqBody.zoneName + '-' + 'R' + (rackCount + i + 1);
      reqVal.rackGroupId = reqBody.rackGroupId;
      reqVal.rackGroupName = reqBody.rackGroupName;
      reqVal.zoneId = reqBody.zoneId;
      reqVal.zoneName = reqBody.zoneName;
      reqVal.companyId = reqBody.companyId;
      reqVal.wareHouseId = reqBody.wareHouseId;
      reqVal.status = 1;
      reqVal.type = reqBody.type;
      reqVal.uom = reqBody.uom;
      const rackData = new Rack(reqVal);
      const newRack = await rackData.save();
      
      for (let j = 0; j < rackGroupDetail.shelfCount; j++) {
        let shelfVal = {};
        shelfVal.rackGroupId = reqBody.rackGroupId;
        shelfVal.rackGroupName = reqBody.rackGroupName;
        shelfVal.name = newRack.name + '-' + 'S' + (j + 1);
        shelfVal.zoneId = reqBody.zoneId;
        shelfVal.zoneName = reqBody.zoneName;
        shelfVal.rackId = newRack._id;
        shelfVal.status = 1;
        shelfVal.type = reqBody.type;
        shelfVal.rackName = newRack.name;
        shelfVal.companyId = reqBody.companyId;
        shelfVal.wareHouseId = reqBody.wareHouseId;
        const shelfData = new Shelf(shelfVal);
        const newShelf = await shelfData.save();
        
        for (let k = 0; k < rackGroupDetail.binInEachShelf; k++) {
          let binVal = {};
          binVal.rackGroupId = reqBody.rackGroupId;
          binVal.rackGroupName = reqBody.rackGroupName;
          binVal.name = reqBody.zoneName + '-' + 'R' + (rackCount + i + 1) + '-' + 'S' + (j + 1) + '-' + 'B' + (k + 1);
          binVal.zoneId = reqBody.zoneId;
          binVal.zoneName = reqBody.zoneName;
          binVal.rackId = newRack._id;
          binVal.rackName = newRack.name;
          binVal.shelfId = newShelf._id;
          binVal.shelfName = newShelf.name;
          binVal.status = 1;
          binVal.type = reqBody.type;
          binVal.companyId = reqBody.companyId;
          binVal.wareHouseId = reqBody.wareHouseId;
          binVal.qr = reqBody.zoneName + '-' + 'R' + (rackCount + i + 1) + '-' + 'S' + (j + 1) + '-' + 'B' + (k + 1);
          binVal.fileName = binVal.qr + '.png';

          try {
            // Generate QR code and save the bin
            const code = await generateQRCode(binVal.name);
            const newBin = await saveBin(binVal);
          } catch (e) {
            console.log(e);
          }
        }
      }
    }
    return res.status(200).json({ status: 1, message: commonFunction.translate('##rack created successfully##', reqQuery.language) });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: -1, message: commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

async function generateQRCode(name) {
  return new Promise((resolve, reject) => {
    QRCode.toDataURL(name, async function (err, code) {
      if (err) return reject(err);
      
      // Printing the code
      var matches = code.match(/^data:([A-Za-z-+/]+);base64,(.+)$/),
        response = {};

      if (matches.length !== 3) {
        return reject(new Error('Invalid input string'));
      }
      response.type = matches[1];
      response.data = Buffer.from(matches[2], 'base64');
      let decodedImg = response;
      let imageBuffer = decodedImg.data;
      resolve(imageBuffer);
    });
  });
}

async function saveBin(binVal) {
  const imageBuffer = await generateQRCode(binVal.name);
  let fileName = binVal.qr + ".png";
  fs.writeFileSync("./public/bin_qr/" + fileName, imageBuffer, 'utf8');
  const binData = new BinModel(binVal);
  return binData.save();
}





/**
 * @swagger
 * /rack/getAllRacks:
 *   post:
 *     summary: Get all racks
 *     tags:
 *       - Racks
 *     responses:
 *       '200':
 *         description: A list of racks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RackController'
 *       '500':
 *         description: Failed to get racks
 */
// async function getAllRacks(req, res) {
//     try {
//         const racks = await RackController.find();
//         res.json(racks);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Failed to get racks' });
//     }
// }

router.post('/getAllRacks', async (req, res) => {
  const reqQuery = req.query;
  try {
    const racks = await Rack.find({});
    if (!racks) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##racks not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##racks listed successfully##', reqQuery.language), 'responseData': racks });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});


/**
 * @swagger
 * /rack/getRackById:
 *   post:
 *     summary: Get a single rack by ID
 *     tags:
 *       - Racks
 *     parameters:
 *       - name: rackId
 *         in: path
 *         description: ID of the rack to retrieve
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: RackController found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RackController'
 *       '404':
 *         description: RackController not found
 *       '500':
 *         description: Failed to get rack
 */
// async function getRackById(req, res) {
//     try {
//         const rack = await RackController.findById(req.params.rackId);
//         if (!rack) {
//             return res.status(404).json({ message: 'RackController not found' });
//         }
//         res.json(rack);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Failed to get rack' });
//     }
// }


router.post('/getRackById', async (req, res) => {
  const reqQuery = req.query;
  try {
    const rack = await Rack.findOne({ rackId: req.body.rackId });
    if (!rack) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##rack not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), responseData: rack });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

/**
 * @swagger
 * /rack/updateRack:
 *   post:
 *     summary: Update a rack by ID
 *     tags:
 *       - Racks
 *     parameters:
 *       - name: rackId
 *         in: path
 *         description: ID of the rack to update
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Updated rack object
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RackController'
 *     responses:
 *       '200':
 *         description: RackController updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RackController'
 *       '400':
 *         description: Invalid request body
 *       '404':
 *         description: RackController not found
 *       '500':
 *         description: Failed to update rack
 */
// async function updateRack(req, res) {
//     try {
//         const rack = await RackController.findByIdAndUpdate(req.params.rackId, req.body, { new: true });
//         if (!rack) {
//             return res.status(404).json({ message: 'RackController not found' });
//         }
//         res.json(rack);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Failed to update rack' });
//     }
// }

router.post('/updateRack', async (req, res) => {
  const reqQuery = req.query;
  try {
    const rack = await Rack.findByIdAndUpdate(new mongoose.Types.ObjectId(req.body._id), req.body, { new: true, runValidators: true });
    if (!rack) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##rack not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##rack updated successfully##', reqQuery.language), responseData: rack });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});



/**
 * @swagger
 * /rack/deleteRack:
 *   delete:
 *     summary: Delete a rack by ID
 *     tags:
 *       - Racks
 *     parameters:
 *       - name: rackId
 *         in: path
 *         description: ID of the rack to delete
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: RackController deleted successfully
 *       '404':
 *         description: RackController not found
 *       '500':
 *         description: Failed to delete rack
 */
// async function deleteRack(req, res) {
//     try {
//         const rack = await RackController.findByIdAndDelete(req.params.rackId);
//         if (!rack) {
//             return res.status(404).json({ message: 'RackController not found' });
//         }
//         res.json({ message: 'RackController deleted successfully' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Failed to delete rack' });
//     }
// }

router.delete('/deleteRack', async (req, res) => {
  const reqQuery = req.query;
  try {
    const rack = await Rack.findByIdAndDelete(req.body._id);
    if (!rack) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##rack not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##rack deleted successfully##', reqQuery.language) });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

router.post('/listByZoneId', async (req, res) => {
  try {
    const reqBody = req.body;
    var rackInfo = await Rack.aggregate([
      { $match: { "zoneId": new mongoose.Types.ObjectId(reqBody.zoneId) } },
      {
        $lookup: {
          from: "shelf",
          localField: "_id",
          foreignField: "rackId",
          as: "shelfInfo"
        }
      }
    ]);
    // console.log("rackInfo",rackInfo);
    rackInfo.shelfInfo = rackInfo.map((data) => {
      return data.shelfInfo.map((shelf) => {
        shelf.applicable = true;
        shelf.color = "#064a6c";

        if (shelf.occupiedPercentage >= 60) {
          shelf.color = "#007bc0";
        }
        if (shelf.occupiedPercentage === 100) {
          shelf.color = "#5A5A5A";
        }

        return shelf;
      })
    })
    // console.log("rackInfo",rackInfo.shelfInfo);
    return res.json({ status: 1, message: "success", "responseData": rackInfo });
  } catch (err) {
    console.log(err);
  }
})

router.post('/listRackType', async (req, res) => {
  try {
    var rackInfo = await RackType.find({});
    return res.json({ status: 1, message: "success", "responseData": rackInfo });
  } catch (err) {
    console.log(err);
  }
})

module.exports = router;