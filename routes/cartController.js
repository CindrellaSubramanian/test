const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const commonFunction = require('../public/js/commonFunction');
const Cart = require('../schema/cart');
const Task = require('../schema/task');
const Package = require("../schema/package");
const Equipment = require('../schema/equipment');

router.post('/create', async (req, res) => {
  const reqQuery = req.query;
  try {

    const cart = new Cart(req.body);
    const newCart = await cart.save();
    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##cart created successfully##', reqQuery.language), 'responseData': newCart });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

// router.post('/list', async (req, res) => {
//   const reqQuery = req.query;
//   try {
//     const cart = await Cart.find({ "userId": req.body.userId });
//     if (!cart) {
//       return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##cart not found##', reqQuery.language) });
//     }

//     // Fetch equipment name and add to equipmentLogData
//     for (const cartItem of cart) {
//       for (let i = 0; i < cartItem.packageInfo.length; i++) {
//         if (cartItem.packageInfo[i].selectedBin != undefined) {
//           if (cartItem.packageInfo[i].selectedBin.length > 0 && typeof cartItem.packageInfo[i].selectedBin[0] === "string") {
//             cartItem.packageInfo[i].selectedBinTxtArray = cartItem.packageInfo[i].selectedBin;
//             cartItem.packageInfo[i].selectedBin = [];
//           }
//         }
//       }

//       if (cartItem.equipmentLogData && cartItem.equipmentLogData.equipmentId) {
//         const equipmentDetail = await Equipment.findById(cartItem.equipmentLogData.equipmentId);
//         if (equipmentDetail) {
//           cartItem.equipmentLogData.equipmentName = equipmentDetail.name;
//         }
//       }
//     }

//     return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##cart listed successfully##', reqQuery.language), 'responseData': cart });
//   } catch (error) {
//     console.log(error)
//     return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
//   }
// });

router.post('/list', async (req, res) => {
  const reqQuery = req.query;
  try {
    const cart = await Cart.find({ "userId": req.body.userId }).lean();
    if (!cart) {
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##cart not found##', reqQuery.language) });
    }

    // Fetch equipment name and add to equipmentLogData
    for (const cartItem of cart) {
      for (let i = 0; i < cartItem.packageInfo.length; i++) {
        if (cartItem.packageInfo[i].selectedBin != undefined) {
          if (cartItem.packageInfo[i].selectedBin.length > 0 && typeof cartItem.packageInfo[i].selectedBin[0] === "string") {
            cartItem.packageInfo[i].selectedBinTxtArray = cartItem.packageInfo[i].selectedBin;
            cartItem.packageInfo[i].selectedBin = [];
          }
        }
      }

      if (cartItem.equipmentLogData && cartItem.equipmentLogData.equipmentId) {
        const equipmentDetail = await Equipment.findById(cartItem.equipmentLogData.equipmentId);
        if (equipmentDetail) {
          cartItem.equipmentLogData.equipmentName = equipmentDetail.name;
        }
      }
    }

    let responseData = {};

    // Check if there is at least one cart found
    if (cart.length > 0) {
      responseData = {
        ...cart[0], // Assuming you only want the first cart if there are multiple  (sprea)
        
      };
    }

    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##cart listed successfully##', reqQuery.language), 'responseData': responseData });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});




router.post('/getById', async (req, res) => {
  const reqQuery = req.query;
  try {
    const cart = await Cart.findOne({ _id: req.body._id });
    if (!cart)
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##cart not found##', reqQuery.language) });

    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##success##', reqQuery.language), responseData: cart });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

router.post('/update', async (req, res) => {
  const reqQuery = req.query;
  try {
    const cart = await Cart.findByIdAndUpdate(req.body._id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!cart)
      return res.status(400).json({ 'status': -2, 'message': commonFunction.translate('##cart not found##', reqQuery.language) });

    return res.status(200).json({ 'status': 1, 'message': commonFunction.translate('##cart updated successfully##', reqQuery.language), responseData: cart });
  } catch (error) {
    return res.status(500).json({ 'status': -1, 'message': commonFunction.translate('##internal server error##', reqQuery.language) });
  }
});

// router.post('/delete', async (req, res) => {
//   const { cartId, packageId, userId } = req.body;

//   try {
//     console.log('cartId:', cartId);
// console.log('packageId:', packageId);
//     const cart = await Cart.findOneAndUpdate(
//       { _id: cartId },
//       { $pull: { packageInfo: { _id: packageId } } }
//     );
//     if (!cart) {
//       return res.status(404).json({
//         status: -2,
//         message: 'Cart not found or Package not found in the cart.',
//       });
//     }

//     console.log('Updated cart:', cart);
// // Check if the package exists in the cart
// const packageExistsInCart = cart.packageInfo.some(item => item._id.toString() === packageId);
// if (!packageExistsInCart) {
//   return res.status(404).json({
//     status: -2,
//     message: 'Package not found in the cart.',
//   });
// }

//     await Package.updateOne({ _id: packageId }, { $set: { cartStatus: 0 } });

//     return res.status(200).json({ status: 1, message: 'Package removed from the cart successfully!' });
//   } catch (error) {
//     console.log('Error removing package from cart:', error);
//     return res.status(500).json({ status: -1, message: 'Internal server error' });
//   }
// });

router.post('/deleteCopy', async (req, res) => {
  const { cartId, packageId, userId } = req.body;

  try {
    const cart = await Cart.findOne({ _id: cartId });
    if (!cart) {
      return res.status(404).json({
        status: -2,
        message: 'Cart not found.',
      });
    }

    // Check if the package exists in the cart
    const packageIndex = cart.packageInfo.findIndex(item => item._id.toString() === packageId);
    if (packageIndex === -1) {
      return res.status(404).json({
        status: -2,
        message: 'Package not found in the cart.',
      });
    }

    // Remove the package from the cart's packageInfo array
    cart.packageInfo.splice(packageIndex, 1);
    
    // Save the updated cart
    await cart.save();

    // Set the cartStatus of the removed package to 0
    await Package.updateOne({ _id: packageId }, { $set: { cartStatus: 0 } });

    return res.status(200).json({ status: 1, message: 'Package removed from the cart successfully!' });
  } catch (error) {
    console.error('Error removing package from cart:', error);
    return res.status(500).json({ status: -1, message: 'Internal server error' });
  }
});

router.post('/delete', async (req, res) => {
  const { cartId, packageId, userId } = req.body;

  try {
    const cart = await Cart.findOne({ _id: cartId });
    if (!cart) {
      return res.status(404).json({
        status: -2,
        message: 'Cart not found.',
      });
    }

    // Check if the package exists in the cart
    const packageIndex = cart.packageInfo.findIndex(item => item._id.toString() === packageId);
    if (packageIndex === -1) {
      return res.status(404).json({
        status: -2,
        message: 'Package not found in the cart.',
      });
    }

    // Remove the package from the cart's packageInfo array
    cart.packageInfo.splice(packageIndex, 1);
    
    // Save the updated cart
    await cart.save();

    // Set the cartStatus of the removed package to 0
    await Package.updateOne({ _id: packageId }, { $set: { cartStatus: 0 } });
        // Set the cartStatus of the removed package to 0 in the task collection
        await Task.updateOne(
          { "jobInfo.skuDetails._id": packageId },
          { $set: { "jobInfo.skuDetails.$.cartStatus": 0 } }
        );
    

    return res.status(200).json({ status: 1, message: 'Package removed from the cart successfully!' });
  } catch (error) {
    console.error('Error removing package from cart:', error);
    return res.status(500).json({ status: -1, message: 'Internal server error' });
  }
});

router.post('/updateCartAndAddPackage', async (req, res) => {
  try {
    const userId = req.body.userId;
    const taskId = req.body.taskId;

    // Find the task with the given taskId
    const task = await Task.findOne({ _id: taskId });

    if (!task)
      return res.status(404).json({ status: -1, message: 'Task not found for the provided taskId' });

    // Retrieve packageDetails from task
    const packageDetailsFromTask = task.packageDetails;

    // Remove existing cart data for the provided userId
    await Cart.deleteMany({ userId: userId });

    // Create a new cart entry with the packageDetails
    const newCart = new Cart({ userId: userId, packageInfo: packageDetailsFromTask });

    await newCart.save();

    return res.status(200).json({ status: 1, message: 'Cart updated and package added successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: -1, message: 'An error occurred while updating cart and adding package' });
  }
});

module.exports = router;