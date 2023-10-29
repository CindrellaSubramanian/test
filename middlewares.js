const jwt = require('jsonwebtoken');
const userModel = require('./schema/userModel');
const Package = require('./schema/package');
const commonFunction = require('./public/js/commonFunction');
const fs = require('fs');
require('dotenv').config();

const roleAuthPage = (req, res, next) => {
    const reqQuery = req.query;
    var roleVals = fs.readFileSync('public/js/pathPermission.json');
    var permissionData = JSON.parse(roleVals.toString());
    var apiUrl = req.baseUrl + req.route.path;
    var conUrl = req.baseUrl;
    var apiPermission = permissionData[apiUrl];
    var controllerPermission = permissionData[conUrl];

    const userRole = req.user.role;
    if (controllerPermission.includes(userRole)) {
        if (apiPermission.includes(userRole)) {
            return next();
        } else {
            return res.status(401).json({ status: -1, message: commonFunction.translate('##you dont have api permission##', reqQuery.language) });
        }
    } else {
        return res.status(401).json({ status: -1, message: commonFunction.translate('##you dont have controller permission##', reqQuery.language) });
    }
};

const auth = async (req, res, next) => {
    const reqQuery = req.query;
    const reqHeader = req.headers;
    try {
        if (!reqHeader.authorization) {
            return res.status(401).json({ httpCode: 401, status: -1, message: commonFunction.translate('##jwt error##', reqQuery.language) });
        }
        const decodeValue = jwt.verify(reqHeader.authorization, process.env.ACCESSTOKEN);
        var userId = decodeValue.userId
            ? decodeValue.userId
            : '';
        const user = await userModel.findOne({ _id: userId });
        if (!user) {
            return res.status(404).json({ httpCode: 404, status: -1, message: commonFunction.translate('##user not found##', reqQuery.language) });
        }
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ httpCode: 401, status: -1, message: commonFunction.translate('##jwt error##', reqQuery.language) });
    }
};

module.exports = { roleAuthPage, auth };