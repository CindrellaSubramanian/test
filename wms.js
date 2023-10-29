const express = require('express');
const app = express();
const mongoose = require('mongoose');
const swaggerUI = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerDocument = require('./swagger.json');
const path = require('path');
require('dotenv').config();
const cors = require("cors");

app.get('/', (req, res) => {
	return res.send('Express Js');
});


const options = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'Library API',
			version: '1.0.0',
			description: 'A simple Express Library API',
		},
		servers: [
			{
				url: process.env.BASEURL
			},
		],
	},
	apis: ['./routes/*.js'],
};


const specs = swaggerJsDoc(options);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(specs));
app.use('/api-doc', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cors());


// // Defining CORS
// app.use(function(req, res, next) {
//     res.setHeader(
//       "Access-Control-Allow-Headers",
//       "X-Requested-With,content-type"
//     );
//     res.setHeader("Access-Control-Allow-Origin", "*");
//     res.setHeader(
//       "Access-Control-Allow-Methods",
//       "GET, POST, OPTIONS, PUT, PATCH, DELETE"
//     );
//     res.setHeader("Access-Control-Allow-Credentials", true);
//     next();
// });

// Route Path
const userRouter = require('./routes/userController');
const commonRouter = require('./routes/commonController');
const jobController = require('./routes/jobController');
const outboundJobController = require('./routes/outboundJobController');
const clientController = require('./routes/clientController');
const equipmentController = require('./routes/equipmentController');
const equipmentTypeController = require('./routes/equipmentTypeController');
const bayController = require('./routes/bayController');
const packageController = require('./routes/packageController');
const taskController = require('./routes/taskController');
const binController = require('./routes/binController');
const gateController = require('./routes/gateController');
const departmentTypeController = require('./routes/departmentTypeController');
const productController = require('./routes/productController');
const inventoryController = require('./routes/inventoryController');
const locationController = require('./routes/locationController');
const rackGroupController = require('./routes/rackGroupController');
const uomController = require('./routes/uomController');
const cartController = require('./routes/cartController');
const warehouseController = require('./routes/warehouseController');
const companyController = require('./routes/companyController');


//layout
const aisleController = require('./routes/layout/asileController');
const rackController = require('./routes/rackController');
const zoneController = require('./routes/layout/zoneController');
const levelController = require('./routes/layout/levelController');



app.use('/user', userRouter);
app.use('/common', commonRouter);
app.use('/job', jobController);
app.use('/outbound', outboundJobController);
app.use('/client', clientController);
app.use('/equipment', equipmentController);
app.use('/equipmentType', equipmentTypeController);
app.use('/bay', bayController);
app.use('/package', packageController);
app.use('/task', taskController);
app.use('/bin', binController.router);
app.use('/gate', gateController);
app.use('/departmentType', departmentTypeController);
app.use('/product', productController.router)
app.use('/inventory', inventoryController);
app.use('/zone', zoneController);
app.use('/level', levelController);
app.use('/aisle', aisleController);
app.use('/rack', rackController);
app.use('/location', locationController);
app.use('/rackGroup', rackGroupController);
app.use('/uom', uomController);
app.use('/cart', cartController);
app.use('/ware', warehouseController);
app.use('/company', companyController);

// Port
app.listen(process.env.PORT, () => console.log(`The server is running on port ${process.env.PORT}`));

// // DataBase Connection
// mongoose.connect(process.env.DBURL, {
// 	useNewUrlParser: true,
// 	useUnifiedTopology: true,
// }).then(() => {
// 	console.log('Connection succesfully');
// }).catch((error) => {
// 	console.log('Something went wrong', error);
// });


mongoose.connect(process.env.DBURL, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
	console.log("Mongodb is connected");
}).catch((error) => {
	console.log("Mongodb not connected");
	console.log(error);
});