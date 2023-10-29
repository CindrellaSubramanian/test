const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const commonFunction = require('../public/js/commonFunction');
// const jobRoute = require('../routes/jobController');
const Job = require('../schema/job');
const ProductDetail = require('../schema/productDetail');
const userModel = require('../schema/userModel');
const Package = require('../schema/package');
const Inventory = require('../schema/inventory');
const multer = require('multer');
const xlsx = require('xlsx');

/**
 * @swagger
 * /product/create:
 *   post:
 *     summary: Create products
 *     tags:
 *       - Products
 *     description: Create multiple product details
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               skuDetails:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     msku:
 *                       type: string
 *                       description: The product's msku
 *                     title:
 *                       type: string
 *                       description: The product's title
 *                     information:
 *                       type: string
 *                       description: Additional product information
 *                     units:
 *                       type: string
 *                       description: The number of units
 *                     uom:
 *                       type: string
 *                       description: The unit of measure
 *             example:
 *               skuDetails:
 *                 - msku: pen
 *                   title: Architecto aliquid m
 *                   information: Itaque culpa eu volu
 *                   units: 10
 *                   uom: In labore consectetu
 *     responses:
 *       200:
 *         description: Products created successfully
 *       404:
 *         description: Some products already exist
 *       500:
 *         description: Internal server error
 */

const upload = multer();

router.post('/create', upload.single('excelLAS'), async (req, res) => {
  const reqQuery = req.query;
  try {
    let { skuDetails, wareHouseId, companyUserId, companyId } = req.body;
    let skuDetailsArray = [];
    if (req.file) {
      const fileExtension = req.file.originalname.split('.').pop().toLowerCase();

      if (fileExtension !== 'xlsx') {
        return res.status(400).json({ status: -3, message: commonFunction.translate('##Invalid file type. Only Excel files (xlsx) are allowed##', reqQuery.language) });
      }

      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = xlsx.utils.sheet_to_json(worksheet);

      const isValidSkuDetails = jsonData.every((data) => (
        data.materialCode && data.title && data.information && data.units && data.uom
      ));

      if (!isValidSkuDetails) {
        return res.status(400).json({ status: -4, message: commonFunction.translate('##Invalid skuDetail data in the Excel file##', reqQuery.language) });
      }

      skuDetailsArray = jsonData.map((data) => ({
        materialCode: data.materialCode,
        title: data.title,
        information: data.information,
        dimension: data.dimension ? data.dimension : '',
        height: data.height,
        weight: data.weight,
        breadth: data.breadth,
        unitH: data.unitH,
        unitW: data.unitW,
        unitB: data.unitB,
        uom: data.uom,
        plantCode: data.plantCode?data.plantCode:'',
        productCode: data.productCode?data.productCode:'',
        type:data.type?data.type:'',
        rackType:data.type?data.rackType:''
      }));
    } else if (skuDetails && skuDetails.length > 0) {
      skuDetailsArray = Array.isArray(skuDetails) ? skuDetails : [skuDetails];
    } else {
      return res.status(400).json({ status: -5, message: commonFunction.translate('##Missing skuDetails##', reqQuery.language) });
    }

    const existingSkus = []; 
    if (existingSkus.length > 0) {
      const existingSkusMessage = 'Some products already exist,Please remove the existed materialCode field : ' + existingSkus.join(', ');
      return res.status(200).json({ 'status': -1, 'message': existingSkusMessage });
    }
    for (const productData of skuDetailsArray) {
      const existingProduct = await ProductDetail.findOne({ materialCode: productData.materialCode });

      if (existingProduct) {
        existingSkus.push(existingProduct.materialCode);
      } else {
        productData.companyUserInfo = await userModel.findOne({ _id: companyUserId }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1, companyInfo:1 });
        productData.wareHouseId = wareHouseId;
        productData.companyId = companyId;
        const product = new ProductDetail(productData);
        await product.save();
      }
    }

    let message = 'Products created successfully';

   
    return res.status(200).json({ status: 1, message });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: -1, message: 'Internal server error' });
  }
});

router.post('/createProduct', async (req, res) => {
  const reqQuery = req.query;
  try {
    const reqBody = req.body;
    console.log(reqBody);
    const existingProduct = await ProductDetail.findOne({ materialCode: reqBody.materialCode });
    if (existingProduct != null) {
      return res.status(200).json({ 'status': -1, 'message': 'Material Code Already Exist' });
    }

    const product = new ProductDetail(reqBody);
    await product.save();
    return res.status(200).json({ status: 1, message: 'Products created successfully' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: -1, message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /product/list:
 *   post:
 *     summary: List products
 *     tags:
 *       - Products
 *     description: Get a list of products based on filters
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               page:
 *                 type: integer
 *                 description: The page number
 *               limit:
 *                 type: integer
 *                 description: The maximum number of products per page
 *               msku:
 *                 type: string
 *                 description: Filter by msku
 *               title:
 *                 type: string
 *                 description: Filter by title
 *             example:
 *               page: 1
 *               limit: 10
 *               msku: ""
 *               title: ""
 *     responses:
 *       200:
 *         description: Products listed successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 * 
 * components:
 *   schemas:
 *     ProductDetail:
 *       type: object
 *       properties:
 *         msku:
 *           type: string
 *         title:
 *           type: string
 *         information:
 *           type: string
 *         units:
 *           type: string
 *         uom:
 *           type: string
 */

// router.post('/list', async (req, res) => {
//   const reqQuery = req.query;
//   try {
//     const reqBody = req.body;
//     let query = {};
//     if (reqBody.status != 2) {
//       query.status = reqBody.status;
//     }

//     const products = await ProductDetail.find(query);

//     if (products.length === 0) {
//       return res.status(200).json({ 'status': -2, 'message': commonFunction.translate('##product not found##', reqQuery.language), 'totalCount': 0, 'responseData': [] });
//     }

//     return res.status(200).json({
//       'status': 1,
//       'message': commonFunction.translate('##product listed successfully##', reqQuery.language),
//       'totalCount': products.length,
//       'responseData': products
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
//   }
// });

router.post('/list', async (req, res) => {
  const reqQuery = req.query;
  const reqBody = req.body;
  try {
    let query = {};

    if (reqBody.status !== undefined && reqBody.status !== 2) {
      query.status = reqBody.status;
    }
    if (reqBody.materialCode) {
      query.materialCode = reqBody.materialCode;
    }
    if (reqBody.title) {
      query.title = reqBody.title;
    }
    if (reqBody.wareHouseId != undefined && reqBody.wareHouseId != "") {
      query.wareHouseId = new mongoose.Types.ObjectId(reqBody.wareHouseId);
    }
    if (reqBody.companyId != undefined && reqBody.companyId != "") {
      query.companyId = new mongoose.Types.ObjectId(reqBody.companyId);
    }
    const products = await ProductDetail.find(query);

    if (products.length === 0) {
      return res.status(200).json({
        'status': -2,
        'message': commonFunction.translate('##product not found##', reqQuery.language),
        'totalCount': 0,
        'responseData': []
      });
    }

    return res.status(200).json({
      'status': 1,
      'message': commonFunction.translate('##product listed successfully##', reqQuery.language),
      'totalCount': products.length,
      'responseData': products
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      'status': -1,
      'message': commonFunction.translate('##internal server error##', reqQuery.language)
    });
  }
});



router.post('/allList', async (req, res) => {
  const reqQuery = req.query;
  try {
    const product = await ProductDetail.find({});
    if (!product) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##product not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##product listed successfully##', reqQuery.language), 'responseData': product });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

/**
 * @swagger
 * /product/getById:
 *   post:
 *     summary: Get product by ID
 *     tags:
 *       - Products
 *     description: Retrieve a product by its ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 description: The ID of the product
 *             example:
 *               _id: "64ae3805b17eba995cdf348f"
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       400:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 * 
 * components:
 *   schemas:
 *     ProductDetail:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         msku:
 *           type: string
 *         title:
 *           type: string
 *         information:
 *           type: string
 *         units:
 *           type: string
 *         uom:
 *           type: string
 */



router.post('/getById', async (req, res) => {
  const reqQuery = req.query;
  try {
    const product = await ProductDetail.findOne({ _id: req.body._id });
    if (!product) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##product not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), responseData: product });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

/**
 * @swagger
 * /product/update:
 *   post:
 *     summary: Update product
 *     tags:
 *       - Products
 *     description: Update an existing product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 description: The ID of the product to update
 *               msku:
 *                 type: string
 *                 description: The new msku value (optional)
 *               title:
 *                 type: string
 *                 description: The new title value (optional)
 *               information:
 *                 type: string
 *                 description: The new information value (optional)
 *               units:
 *                 type: integer
 *                 description: The new units value (optional)
 *               uom:
 *                 type: string
 *                 description: The new uom value (optional)
 *             example:
 *               _id: "64ae3805b17eba995cdf348f"
 *               msku: "Laptop"
 *               title: "Samsung"
 *               information: "samsung1"
 *               units: 10
 *               uom: "kg"
 *               expectedQuantity: 10
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Invalid _id or product not found
 *       500:
 *         description: Internal server error
 * 
 * components:
 *   schemas:
 *     ProductDetail:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         msku:
 *           type: string
 *         title:
 *           type: string
 *         information:
 *           type: string
 *         units:
 *           type: integer
 *         uom:
 *           type: string
 *         expectedQuantity:
 *           type: integer
 */


router.post('/update', async (req, res) => {
  const reqQuery = req.query;
  try {
    const { materialCode, _id, ...updateData } = req.body;
    const reqBody = req.body;
    // Check if the provided _id is a valid ObjectId
    if (!_id || !mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({ status: -1, message: 'Invalid _id' });
    }

    // Find the product with the given _id
    const existingProduct = await ProductDetail.findById(_id);

    if (!existingProduct) {
      return res.status(400).json({ status: -1, message: 'Invalid _id for the product' });
    }
    if (reqBody.materialCode === existingProduct.materialCode) {
      // Update the product
      const updatedProduct = await ProductDetail.updateOne({ _id: reqBody._id }, { $set: updateData });
      if (!updatedProduct) {
        return res.status(400).json({ status: -1, message: 'Invalid _id for the product' });
      }
      return res.status(200).json({ status: 1, message: 'Product updated successfully', responseData: updatedProduct });
    } else {
      // The provided msku does not match the existing msku, so we need to update the msku field as well
      const updatedProduct = await ProductDetail.findByIdAndUpdate(_id, { ...updateData, materialCode });
      if (!updatedProduct) {
        return res.status(400).json({ status: -1, message: 'Invalid _id for the product' });
      }
      return res.status(200).json({ status: 1, message: 'Product updated successfully', responseData: updatedProduct });
    }
  } catch (error) {
    if (error.code === 11000) {
      console.log('duplicate comments');
      return res.status(400).json({ status: -3, message: 'duplicated materialCode existed' });
    }
    console.log(error);
    return res.status(500).json({ status: -1, message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /delete:
 *   delete:
 *     summary: Delete product
 *     tags:
 *       - Products
 *     description: Delete a product by its ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 description: The ID of the product to delete
 *             example:
 *               _id: "64ae3805b17eba995cdf348f"
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       400:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */




router.delete('/delete', async (req, res) => {
  const reqQuery = req.query;
  try {
    const product = await ProductDetail.findByIdAndDelete(req.body._id);
    if (!product) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##product not found##', reqQuery.language) });
    }
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##product deleted successfully##', reqQuery.language) });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

/**
 * @swagger
 * /product/statusUpdate:
 *   post:
 *     summary: Update status
 *     tags:
 *       - Products
 *     description: Update the status of products by their IDs
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: array
 *                 description: Array of product IDs to update
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 description: The new status value
 *             example:
 *               id:
 *                 - "64ae3805b17eba995cdf348f"
 *                 - "64ae3805b17eba995cdf3490"
 *               status: "updated"
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       500:
 *         description: Internal server error
  */

router.post('/statusUpdate', async (req, res) => {
  try {
    const { id, status } = req.body;

    // Update the status for the given IDs
    await ProductDetail.updateMany(
      { _id: { $in: id } },
      { $set: { status } }
    );
    return res.status(200).json({ 'status': 1, 'message': 'status is updated' });
    // res.json({ message: 'Status updated successfully.' });
  } catch (err) {
    return res.status(500).json({ 'status': 1, 'message': 'internet server error' });
    // res.status(500).json({ message: 'Failed to update status.' });
  }
});

router.post('/packageUpdate', async (req, res) => {
  const reqQuery = req.query;
  try {
    const reqBody = req.body;

    const productDetail = await ProductDetail.findOne({ _id: reqBody._id });
    if (!productDetail) {
      return res.status(404).json({ status: -1, message: commonFunction.translate('##product not found##', reqQuery.language) });
    }

    const isValidObjectId = mongoose.Types.ObjectId.isValid(reqBody._id);
    const isValidPackageDetailsObjectId = mongoose.Types.ObjectId.isValid(reqBody.packageDetails._id);
    if (!isValidObjectId || !isValidPackageDetailsObjectId) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##validation error:invalid id or skuDetails id format##', reqQuery.language) });
    }
    const result = await ProductDetail.updateOne({ _id: reqBody._id, 'packageDetails._id': reqBody.packageDetails._id }, { $set: { 'packageDetails.$': reqBody.packageDetails } });
    return res.status(200).json({ status: 1, message: commonFunction.translate('##package updated successfully##', reqQuery.language) });
  } catch (error) {
    if (error.code === 11000) {
      console.log('duplicate comments');
      return res.status(400).json({ status: -3, message: 'duplicated materialCode existed' });
    }
    console.log(error);
    return res.status(500).json({ status: -1, message: 'Internal server error' });
  }
});


router.post('/packageDelete', async (req, res) => {
  const reqQuery = req.query;
  try {
    const { _id, packageDetailId } = req.body;

    // Check if jobId is provided
    if (!_id) {
      return res.status(400).json({ status: -1, message: commonFunction.translate('##product id is not found##', reqQuery.language) });
    }

    // Check if jobId is a valid ObjectId
    const isValidObjectId = mongoose.Types.ObjectId.isValid(_id);
    if (!isValidObjectId) {
      return res.status(400).json({ status: -3, message: commonFunction.translate('##invalid productId format##', reqQuery.language) });
    }

    // Check if the job exists in the database
    const productDetail = await ProductDetail.findById(_id);
    if (!productDetail) {
      return res.status(404).json({ status: -4, message: commonFunction.translate('##product not found##', reqQuery.language) });
    }

    // Check if packageDetailId is provided
    if (!packageDetailId) {
      return res.status(400).json({ status: -5, message: commonFunction.translate('##No packageDetailId provided##', reqQuery.language) });
    }

    // Check if packageDetailId is a valid ObjectId
    const isValidPackageDetailObjectId = mongoose.Types.ObjectId.isValid(packageDetailId);
    if (!isValidPackageDetailObjectId) {
      return res.status(400).json({ status: -6, message: commonFunction.translate('##invalid packageDetailId format##', reqQuery.language) });
    }

    const result = await ProductDetail.updateOne({ _id }, { $pull: { packageDetails: { _id: packageDetailId } } });

    if (result.nModified === 0) {
      return res.status(404).json({ status: -7, message: commonFunction.translate('##job sku detail not deleted##', reqQuery.language) });
    }
    return res.status(200).json({ status: 1, message: commonFunction.translate('##package deleted successfully##', reqQuery.language) });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ status: -1, message: commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});


// async function createSkuProduct(_id, skuDetailsArray) {
//   try {
//     const updatedProductDetails = [];

//     // Check if the provided _id is a valid ObjectId
//     if (!mongoose.isValidObjectId(_id)) {
//       throw new Error('Invalid Job _id');
//     }

//     // Iterate through the skuDetailsArray
//     for (const skuDetail of skuDetailsArray) {
//       const existingProductDetail = await ProductDetail.findOne({ msku: skuDetail.msku });

//       if (existingProductDetail) {
//         // If ProductDetail with the same msku exists, push its reference into the array
//         updatedProductDetails.push(existingProductDetail);
//       } else {
//         // If ProductDetail with the msku does not exist, create a new one
//         const newProductDetail = await ProductDetail.create(skuDetail);
//         updatedProductDetails.push(newProductDetail);
//       }
//     }

//     // Step 3: Add the newly created data or references to the job collection's skuDetails array
//     const job = await Job.findByIdAndUpdate(
//       _id,
//       { $push: { skuDetails: { $each: updatedProductDetails } } },
//       { new: true } // Return the updated document
//     );

//     if (!job) {
//       throw new Error('Job not found');
//     }

//     return updatedProductDetails; // Return the array of newly created ProductDetail documents
//   } catch (err) {
//     console.log('Error in createSkuProduct:', err);
//     throw err;
//   }
// }

async function createSkuProduct(_id, skuDetailsArray) {
  try {
    // Step 1: Create the skuDetailsArray in the ProductDetail collection
    const createdProductDetails = await ProductDetail.create(skuDetailsArray);

    // Step 2: Add the references of the created documents to the job collection's skuDetails array
    const job = await Job.findByIdAndUpdate(
      _id,
      { $push: { skuDetails: { $each: createdProductDetails } } },
      { new: true } // Return the updated document
    );

    if (!job) {
      throw new Error('Job not found');
    }

    return createdProductDetails; // Return the array of newly created ProductDetail documents
  } catch (err) {
    console.log('Error in createSkuProduct:', err);
    throw err;
  }
}

router.post('/searchProductsCopy', async (req, res) => {
  try {
    const querys = req.body.q; // Get the search query from the request body
    if (querys.length < 3) {
      return res.status(200).json({ status: -1, data: [], message: commonFunction.translate('##product not found##', req.language) });

    }
    // Use a regular expression to make the search case-insensitive and partial match
    const regex = new RegExp(querys, 'i');

    // // Specify the fields you want to retrieve
    // const selectedFields = 'materialCode title information _id';

    // const products = await ProductDetail.find({$or: [{ materialCode: regex }, { name: regex }]},selectedFields).exec();
    // if (products) {
    //   return res.status(200).json({ status: 1, message: commonFunction.translate('##product found##', req.language), data: products});
    // }

    // const query = req.body.msku; // Get the search query from the request body

    const selectedFields = 'information materialCode title consignmentId approvedQuantity type selectedBin.name _id approvedProductCount createdAt';
    if (req.body.type == "LIFO") {
      var sortValue = -1;
    } else if (req.body.type == "FIFO") {
      var sortValue = 1;
    }
    
    const products = await Package.find({ approvedStatus: 1, $or: [{ materialCode: regex }, { name: regex }] }, selectedFields).sort({createdAt: sortValue});
    // const products = await Package.find({ msku: query, approvedStatus: 1, $or: [{ materialCode: regex }, { name: regex }] }, selectedFields).sort({createdAt: sortValue});
    // console.log("products", products);

    const productCount = products.reduce((accumulator, object) => {
      return accumulator + object.approvedProductCount;
    }, 0);
    var countVal = parseInt(req.body.count);
    if (productCount<=countVal) {
      return res.status(200).json({ status: -1,message: commonFunction.translate('##product count value is low##', req.language)});
    }
    let resultDataArray = [];
    countForProduct = 0;
    remainingCount = 0;
    let result = products.map((data) => {
      // console.log("data",data);
      let resultData = data;
      resultData.selectedBin = data.selectedBin.map((bin) => {
        return bin.name
      })
      // console.log("resultData.selectedBin.length",resultData.selectedBin.length);
      if (resultData.selectedBin.length > 0) {
        // console.log(countForProduct+"IFresultData.selectedBin.length"+req.body.count);
        if (countForProduct < countVal) {
          // console.log("IfcountForProduct < req.body.count");
          if (resultData.approvedProductCount <= countVal) {
            // console.log("resultData.approvedProductCount");
            remainingCount = countVal - resultData.approvedProductCount;
            resultData.leftInShelf = 0;
            resultData.qtyOutbound = resultData.approvedProductCount;
            countForProduct = resultData.approvedProductCount;
          } else {
            // console.log("elseresultData.approvedProductCount");
            if (countVal!=countForProduct) {
              remainingCount = resultData.approvedProductCount - countForProduct;
              resultData.leftInShelf = resultData.approvedProductCount - (countVal - countForProduct);
              resultData.qtyOutbound = countVal - countForProduct;
              countForProduct = countVal;
            } else {
              remainingCount = resultData.approvedProductCount - countVal;
              resultData.leftInShelf = remainingCount;
              resultData.qtyOutbound = countVal;
              countForProduct = countVal;
            }
          }
        } else {
          resultData.leftInShelf = resultData.approvedProductCount;
          resultData.qtyOutbound = 0;
        }
        console.log("resultData",resultData);
        resultDataArray.push(resultData);
      }
      return ""
    })
   
    if (products) {
      return res.status(200).json({ status: 1,message: commonFunction.translate('##success##', req.language), data: resultDataArray });
    }

  } catch (err) {
    console.log(err)
    res.status(500).json({ error: 'Failed to search products' });
  }
});

router.post('/searchProducts', async (req, res) => {
  try {
    const querys = req.body.q; // Get the search query from the request body
    if (querys.length < 3) {
      return res.status(200).json({ status: -1, data: [], message: commonFunction.translate('##product not found##', req.language) });

    }
    // Use a regular expression to make the search case-insensitive and partial match
    const regex = new RegExp(querys, 'i');

    // // Specify the fields you want to retrieve
    // const selectedFields = 'materialCode title information _id';

    // const products = await ProductDetail.find({$or: [{ materialCode: regex }, { name: regex }]},selectedFields).exec();
    // if (products) {
    //   return res.status(200).json({ status: 1, message: commonFunction.translate('##product found##', req.language), data: products});
    // }

    // const query = req.body.msku; // Get the search query from the request body

    const { materialCode, count, type } = req.body;

    const selectedFields = 'information materialCode consignmentId approvedQuantity type selectedBin.name _id approvedProductCount createdAt';
    const sortValue = type == "LIFO" ? -1 : 1;
    
    // const products = await Package.find({ materialCode, approvedStatus: 1 }, selectedFields).sort({createdAt: sortValue});
    const products = await Package.find({ approvedStatus: 1, $or: [{ materialCode: regex }, { name: regex }] }, selectedFields).sort({createdAt: sortValue});

    let totalCount = 0;
    const resultDataArray = [];

    for (let product of products) {
      if (product.selectedBin.length!=0) {
        if (totalCount >= count) {
          console.log("if",product.selectedBin);
          product.leftInShelf = product.approvedProductCount;
          product.qtyOutbound = 0;
          product.selectedBin = product.selectedBin.map((bin) => {
            return bin.name
          })
        } else {
          product.selectedBin = product.selectedBin.map((bin) => {
            return bin.name
          })
          let remaining = count - totalCount;
          let outbound = Math.min(remaining, product.approvedProductCount);
          totalCount += outbound;
  
          product.leftInShelf = product.approvedProductCount - outbound;
          product.qtyOutbound = outbound;
        }
        resultDataArray.push(product);  
      } 
    }

    if (totalCount < count) {
      return res.status(200).json({ status: -1, message: commonFunction.translate('##product count value is low##', req.language) });
    }
    return res.status(200).json({ status: 1, message: commonFunction.translate('##success##', req.language), data: resultDataArray });

  } catch (err) {
    console.log(err)
    res.status(500).json({ error: 'Failed to search products' });
  }
});


router.post('/productLocationCopy', async (req, res) => {
  try {
    const query = req.body.materialCode; // Get the search query from the request body

    // Specify the fields you want to retrieve

    const selectedFields = 'materialCode consignmentId approvedQuantity type selectedBin.name _id approvedProductCount';

    const products = await Package.find(
      {
        materialCode: query,
        approvedStatus: 1
      },
      selectedFields
    ).exec();
    let resultDataArray = []
    let result = products.map((data) => {
      let resultData = data

      resultData.selectedBin = data.selectedBin.map((bin) => {
        return bin.name
      })
      if (resultData.selectedBin.length > 0) {
        resultDataArray.push(resultData)
      }
      return ""
    })
    if (products) {
      return res.status(200).json({ status: 1, data: resultDataArray, message: commonFunction.translate('##success##', req.language) });
    }

    // res.json(resultDataArray);
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: 'Failed to search products' });
  }
});

// router.post('/productLocationTest', async (req, res) => {
//   try {
//     const query = req.body.materialCode; // Get the search query from the request body

//     const selectedFields = 'materialCode consignmentId approvedQuantity type selectedBin.name _id approvedProductCount createdAt';
//     if (req.body.type == "LIFO") {
//       var sortValue = -1;
//     } else if (req.body.type == "FIFO") {
//       var sortValue = 1;
//     }
    
//     const products = await Package.find({ materialCode: req.body.materialCode, approvedStatus: 1 }, selectedFields).sort({createdAt: sortValue});
//     // console.log("products", products);

//     const productCount = products.reduce((accumulator, object) => {
//       return accumulator + object.approvedProductCount;
//     }, 0);
//     if (productCount<=req.body.count) {
//       return res.status(200).json({ status: -1,message: commonFunction.translate('##product count value is low##', req.language)});
//     }
//     let resultDataArray = [];
//     countForProduct = 0;
//     remainingCount = 0;
//     let result = products.map((data) => {
//       let resultData = data;
//       resultData.selectedBin = data.selectedBin.map((bin) => {
//         return bin.name
//       })
//       if (resultData.selectedBin.length > 0) {
//         if (countForProduct < req.body.count) {
//           console.log(countForProduct, "countForProduct");
//           console.log(resultData.approvedProductCount+"<=approvedProductCount"+ req.body.count);
//           if (resultData.approvedProductCount <= req.body.count) {
//             remainingCount = req.body.count - resultData.approvedProductCount;
//             console.log("if1",remainingCount);
//             resultData.leftInShelf = 0;
//             resultData.qtyOutbound = resultData.approvedProductCount;
//             countForProduct += resultData.approvedProductCount;
//             console.log("if2",countForProduct);
//           } else {
//             console.log(req.body.count+"else"+countForProduct);
//             if (req.body.count!=countForProduct) {
//               remainingCount = resultData.approvedProductCount - countForProduct;
//               resultData.leftInShelf = resultData.approvedProductCount - (req.body.count - countForProduct);
//               resultData.qtyOutbound = req.body.count - countForProduct;
//               countForProduct += req.body.count;
//               console.log("elseIf",countForProduct);
//             } else {
//               remainingCount = resultData.approvedProductCount - req.body.count;
//               resultData.leftInShelf = remainingCount;
//               resultData.qtyOutbound = req.body.count;
//               countForProduct += req.body.count;
//               console.log("else",countForProduct);
//             }
//           }
//         } else {
//           console.log("elseCount");
//           resultData.leftInShelf = resultData.approvedProductCount;
//           resultData.qtyOutbound = 0;
//         }
//         resultDataArray.push(resultData);
//       }
//       return ""
//     })
   
//     if (products) {
//       return res.status(200).json({ status: 1,message: commonFunction.translate('##success##', req.language), data: resultDataArray });
//     }

//     // res.json(resultDataArray);
//   } catch (err) {
//     console.log(err)
//     res.status(500).json({ error: 'Failed to search products' });
//   }
// });

// router.post('/copyProductLocation', async (req, res) => {
//   try {
//     const query = req.body.materialCode; // Get the search query from the request body

//     const selectedFields = 'materialCode consignmentId approvedQuantity type selectedBin.name _id approvedProductCount createdAt';
//     if (req.body.type == "LIFO") {
//       var sortValue = -1;
//     } else if (req.body.type == "FIFO") {
//       var sortValue = 1;
//     }
    
//     const products = await Package.find({ materialCode: req.body.materialCode, approvedStatus: 1 }, selectedFields).sort({createdAt: sortValue});
//     // console.log("products", products);

//     const productCount = products.reduce((accumulator, object) => {
//       return accumulator + object.approvedProductCount;
//     }, 0);
//     if (productCount<=req.body.count) {
//       return res.status(200).json({ status: -1,message: commonFunction.translate('##product count value is low##', req.language)});
//     }
//     let resultDataArray = [];
//     countForProduct = 0;
//     remainingCount = 0;
//     let result = products.map((data) => {
//       let resultData = data;
//       resultData.selectedBin = data.selectedBin.map((bin) => {
//         return bin.name
//       })
//       if (resultData.selectedBin.length > 0) {
//         if (countForProduct < req.body.count) {
//           console.log(countForProduct, "countForProduct");
//           console.log(resultData.approvedProductCount+"<=approvedProductCount"+ req.body.count);
//           if (resultData.approvedProductCount <= req.body.count) {
//             console.log(countForProduct+"ifcountForProduct"+req.body.count);
//             if (countForProduct <= req.body.count) {
//               remainingCount = req.body.count - resultData.approvedProductCount;
//               resultData.leftInShelf = 0;
//               resultData.qtyOutbound = resultData.approvedProductCount;
//               countForProduct += resultData.approvedProductCount;
//             } else {
//               console.log("if2",countForProduct);
//             }
            
//           } else {
//             console.log(req.body.count+"else"+countForProduct);
//             if (req.body.count!=countForProduct) {
//               remainingCount = resultData.approvedProductCount - countForProduct;
//               resultData.leftInShelf = resultData.approvedProductCount - (req.body.count - countForProduct);
//               resultData.qtyOutbound = req.body.count - countForProduct;
//               countForProduct += req.body.count;
//               console.log("elseIf",countForProduct);
//             } else {
//               remainingCount = resultData.approvedProductCount - req.body.count;
//               resultData.leftInShelf = remainingCount;
//               resultData.qtyOutbound = req.body.count;
//               countForProduct += req.body.count;
//               console.log("else",countForProduct);
//             }
//           }
//         } else {
//           console.log("elseCount");
//           resultData.leftInShelf = resultData.approvedProductCount;
//           resultData.qtyOutbound = 0;
//         }
//         resultDataArray.push(resultData);
//       }
//       return ""
//     })
   
//     if (products) {
//       return res.status(200).json({ status: 1,message: commonFunction.translate('##success##', req.language), data: resultDataArray });
//     }

//     // res.json(resultDataArray);
//   } catch (err) {
//     console.log(err)
//     res.status(500).json({ error: 'Failed to search products' });
//   }
// });

router.post('/copyProductLocation', async (req, res) => {
  try {
    const { materialCode, count, type } = req.body;

    const selectedFields = 'materialCode consignmentId approvedQuantity type selectedBin.name _id approvedProductCount createdAt';
    const sortValue = type == "LIFO" ? -1 : 1;
    
    const products = await Package.find({ materialCode, approvedStatus: 1 }, selectedFields).sort({createdAt: sortValue});

    let totalCount = 0;
    const resultDataArray = [];

    for (let product of products) {
      if (product.selectedBin.length!=0) {
        if (totalCount >= count) {
          console.log("if",product.selectedBin);
          product.leftInShelf = product.approvedProductCount;
          product.qtyOutbound = 0;
          product.selectedBin = product.selectedBin.map((bin) => {
            return bin.name
          })
        } else {
          product.selectedBin = product.selectedBin.map((bin) => {
            return bin.name
          })
          let remaining = count - totalCount;
          let outbound = Math.min(remaining, product.approvedProductCount);
          totalCount += outbound;
  
          product.leftInShelf = product.approvedProductCount - outbound;
          product.qtyOutbound = outbound;
        }
        resultDataArray.push(product);  
      } 
    }

    if (totalCount < count) {
      return res.status(200).json({ status: -1, message: commonFunction.translate('##product count value is low##', req.language) });
    }
    return res.status(200).json({ status: 1, message: commonFunction.translate('##success##', req.language), data: resultDataArray });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to search products' });
  }
});

router.post('/productLocation', async (req, res) => {
  try {
    const query = req.body.materialCode; // Get the search query from the request body

    const selectedFields = 'materialCode consignmentId approvedQuantity type selectedBin.name _id approvedProductCount createdAt';
    if (req.body.type == "LIFO") {
      var sortValue = -1;
    } else if (req.body.type == "FIFO") {
      var sortValue = 1;
    }
    
    const products = await Package.find({ materialCode: query, approvedStatus: 1 }, selectedFields).sort({createdAt: sortValue});
    // console.log("products", products);

    const productCount = products.reduce((accumulator, object) => {
      return accumulator + object.approvedProductCount;
    }, 0);
    if (productCount<=req.body.count) {
      return res.status(200).json({ status: -1,message: commonFunction.translate('##product count value is low##', req.language)});
    }
    let resultDataArray = [];
    countForProduct = 0;
    remainingCount = 0;
    let result = products.map((data) => {
      let resultData = data;
      resultData.selectedBin = data.selectedBin.map((bin) => {
        return bin.name
      })
      if (resultData.selectedBin.length > 0) {
        if (countForProduct < req.body.count) {
          if (resultData.approvedProductCount <= req.body.count) {
            remainingCount = req.body.count - resultData.approvedProductCount;
            resultData.leftInShelf = 0;
            resultData.qtyOutbound = resultData.approvedProductCount;
            countForProduct = resultData.approvedProductCount;
          } else {
            if (req.body.count!=countForProduct) {
              remainingCount = resultData.approvedProductCount - countForProduct;
              resultData.leftInShelf = resultData.approvedProductCount - (req.body.count - countForProduct);
              resultData.qtyOutbound = req.body.count - countForProduct;
              countForProduct = req.body.count;
            } else {
              remainingCount = resultData.approvedProductCount - req.body.count;
              resultData.leftInShelf = remainingCount;
              resultData.qtyOutbound = req.body.count;
              countForProduct = req.body.count;
            }
          }
        } else {
          resultData.leftInShelf = resultData.approvedProductCount;
          resultData.qtyOutbound = 0;
        }
        resultDataArray.push(resultData);
      }
      return ""
    })
   
    if (products) {
      return res.status(200).json({ status: 1,message: commonFunction.translate('##success##', req.language), data: resultDataArray });
    }

    // res.json(resultDataArray);
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: 'Failed to search products' });
  }
});

router.post('/list', async (req, res) => {
  const reqQuery = req.query;
  try {
    const reqBody = req.body;
    let query = {};
    if (reqBody.status != 2) {
      query.status = reqBody.status;
    }
    if (reqBody.companyId != undefined && reqBody.companyId != "") {
      query.companyId = new mongoose.Types.ObjectId(reqBody.companyId);
    }
    if (reqBody.wareHouseId != undefined && reqBody.wareHouseId != "") {
      query.wareHouseId = new mongoose.Types.ObjectId(reqBody.wareHouseId);
    }
    
    const products = await ProductDetail.find(query);

    if (products.length === 0) {
      return res.status(200).json({ 'status': -2, 'message': commonFunction.translate('##product not found##', reqQuery.language), 'totalCount': 0, 'responseData': [] });
    }

    return res.status(200).json({
      'status': 1,
      'message': commonFunction.translate('##product listed successfully##', reqQuery.language),
      'totalCount': products.length,
      'responseData': products
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});


// router.post('/createProduct', async (req, res) => {
//   const reqQuery = req.query;
//   try {
//     const reqBody = req.body;
//     const existingProduct = await ProductDetail.findOne({ materialCode: reqBody.materialCode });
//     if (existingProduct != null) {
//       return res.status(200).json({ 'status': -1, 'message': 'MSKU Already Exist' });
//     }
//     const userInfo = await userModel.findOne({ _id: reqBody.companyUserId }, { _id: 1, fullName: 1, email: 1, mobile: 1, countryCode: 1, country: 1, zipcode: 1, address: 1, state: 1, city: 1, companyInfo:1 });
//     reqBody.companyUserInfo = userInfo;
//     const product = new ProductDetail(reqBody);
//     await product.save();
//     return res.status(200).json({ status: 1, message: 'Products created successfully' });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({ status: -1, message: 'Internal server error' });
//   }
// });

module.exports = { createSkuProduct, router };