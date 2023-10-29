const fs = require('fs');
const path = require('path');
const multer = require('multer');
const request = require('request');
require('dotenv').config();
var nodemailer = require('nodemailer');
var axios = require('axios');
const env = process.env;

function updateCollection(reqData) {
  try {
    var obj = reqData;
    for (var propName in obj) {
      if (
        obj[propName] === null ||
        obj[propName] === undefined ||
        obj[propName] === '' ||
        obj[propName].length == 0
      ) {
        delete obj[propName];
      }
    }
    return obj;
  } catch (err) {
    console.log(err);
    res.json({ err: err });
  }
}

const uploadPath = path.join(__dirname, '../', 'public', 'temp');
const inboundPath = path.join(__dirname, '../', 'public', 'inbound');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

const maxSize = 1 * 1024 * 1024; // 1mb
const upload = multer({
  limits: { fileSize: maxSize },
  storage: storage,
});

function uploadTempImage(req, res) {
  if (req.query.type == '1' || req.query.type == '2') {
    var uploaddatas = upload.array('image', 10);
  } else {
    var uploaddatas = upload.single('image');
  }
  let uploaddata = uploaddatas;
  uploaddata(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.send(err);
    } else if (err) {
      return res.send(err);
    }

    if (req.query.type == '1' || req.query.type == '2') {
      multiFileName = [];
      req.files.forEach(function (element, index) {
        multiFileName.push(element.filename);
      });
    } else {
      multiFileName = req.file.filename;
    }

    // Store image paths in MongoDB
    const imagePaths = moveToImage(multiFileName, req.query.consignmentId);

    return res.json({
      status: 'Image upload successfully',
      imagePaths: imagePaths,
      type: req.query.type,
      index: req.query.index,
    });
  });
}

function moveToImage(image, consignmentId) {
  const imagePaths = [];

  image.forEach(function (element) {
    const imagePath = path.join(uploadPath, element);
    if (fs.existsSync(imagePath)) {
      const moveImagePath = path.join(inboundPath, consignmentId, element);
      fs.renameSync(imagePath, moveImagePath);
      const imageUrl = `inbound/${consignmentId}/${element}`;
      imagePaths.push(imageUrl);
    }
  });

  return imagePaths;
}

function moveToSingleImage(imageName, consignmentId) {
  const uploadPath = path.join('public');
  const tempImagePath = path.join(uploadPath, 'temp', imageName);
  const inboundPath = path.join(uploadPath, 'inbound', consignmentId);

  if (fs.existsSync(tempImagePath)) {
    if (!fs.existsSync(inboundPath)) {
      fs.mkdirSync(inboundPath, { recursive: true });
    }

    const inboundImagePath = path.join(inboundPath, imageName);
    fs.rename(tempImagePath, inboundImagePath, (err) => {
      if (err) {
        console.error('Error moving image:', err);
      } else {
        console.log('Image moved successfully');
      }
    });
  } else {
    console.error('Image not found:', tempImagePath);
  }
}


function moveToSingleDoc(imageName, folderName) {
  const uploadPath = path.join('public');
  const tempImagePath = path.join(uploadPath, 'temp', imageName);
  const destPath = path.join(uploadPath, folderName);

  if (fs.existsSync(tempImagePath)) {
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }

    const destImagePath = path.join(destPath, imageName);

    return new Promise((resolve, reject) => {
      fs.rename(tempImagePath, destImagePath, (err) => {
        if (err) {
          console.error('Error moving image:', err);
          reject(err);
        } else {
          console.log('Image moved successfully');
          resolve(destImagePath); // Return the moved image path
        }
      });
    });
  } else {
    console.error('Image not found:', tempImagePath);
    throw new Error('Image not found');
  }
}

function removeImage(req, res) {
  try {
    const reqBody = req.body;
    const imageUrl = reqBody.imageUrl;

    const splitUrl = imageUrl.split('/');
    fs.unlinkSync(path.join(__dirname, '../', 'public', splitUrl[0], splitUrl[1], splitUrl[2]));
    // fs.unlinkSync(path.join(__dirname, 'public', splitUrl[0], splitUrl[1], splitUrl[2]));

    return res.json({ status: 1, message: 'Image deleted successfully' });
  } catch (err) {
    console.log(err);
  }
}

async function deleteImage(url) {
  try {
    const imageUrl = url;
    const splitUrl = imageUrl.split('/');
    const imagePath = path.join(__dirname, '../', 'public', splitUrl[0], splitUrl[1], splitUrl[2]);
    // const imagePath = path.join(__dirname,  'public', splitUrl[0], splitUrl[1], splitUrl[2]);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    return true;
  } catch (err) {
    console.log(err);
  }
}

function translate(data, language) {
  try {
    let englishLang = fs.readFileSync('public/js/englishLang.json');
    const enTranslateData = JSON.parse(englishLang);
    let arabicLang = fs.readFileSync('public/js/arabicLang.json');
    const arTranslateData = JSON.parse(arabicLang);

    const enMessage = enTranslateData;
    const arMessage = arTranslateData;

    let localeObject = {};
    localeObject = language == 'ar'
      ? { ...localeObject, ...arMessage }
      : { ...localeObject, ...enMessage };

    let startPos = data.indexOf('##');
    while (startPos != -1) {
      const endPos = data.indexOf('##', startPos + 1);
      const replacableWord = data.substring(startPos, endPos + 2);
      const replacableWordKey = data.substring(startPos + 2, endPos);
      data = data.replace(replacableWord, localeObject.hasOwnProperty(replacableWordKey) ? localeObject[replacableWordKey] : replacableWordKey);
      startPos = data.indexOf('##', endPos + 1);
    }
    return data;
  } catch (err) {
    console.log(err);
  }
};


function getLogStatusLabel(status) {
  switch (status) {
    case 1:
      return ' Inbound Created';
    case 2:
      return 'Skudetail Created ';
    case 3:
      return 'Skudetail Updated';
    case 4:
      return 'Skudetail Deleted';
    case 5:
      return 'Inbound Updated';
    case 6:
      return 'Information Update';
    case 7:
      return 'Document Verified';
    case 8:
      return 'Gate Assign';
    case 9:
      return 'Bay Allocated';
    case 10:
      return 'Unload TaskAssign';
    case 11:
      return 'GRN Generated';
    case 12:
      return 'Unload Task Inprogress';
    case 13:
      return 'Inbound Document Verified';
    case 14:
      return 'PackageDetail Created';
    case 15:
      return 'PutAway TaskAssign';
    case 16:
      return 'PutAway TaskInprogress';
    case 17:
      return 'PutAway TaskCompleted';
    case 18:
      return 'Sort TaskAssign';
    case 19:
      return 'Sort TaskInprogress';
    case 20:
      return 'Sort TaskCompleted';
    case 21:
      return 'Assemble TaskAssign';
    case 22:
      return 'Assemble TaskInprogress';
    case 23:
      return 'Assemble TaskCompleted';
    case 24:
      return 'Relocate TaskAssign';
    case 25:
      return 'Relocate TaskInprogress';
    case 26:
      return 'Relocate TaskCompleted';
    case 27:
      return 'QA TaskAssign';
    case 28:
      return 'QA TaskInprogress';
    case 29:
      return 'QA TaskCompleted';
    case 30:
      return 'Unload Task Completed';
    case 31:
      return 'Repackage TaskAssign';
    case 32:
      return 'Repackage TaskInprogress';
    case 33:
      return 'Repackage TaskCompleted';
    case 34:
      return 'Picker TaskAssign';
    case 35:
      return 'Picker TaskInprogress';
    case 36:
      return 'Picker TaskCompleted';
    case 37:
      return 'Load TaskAssign';
    case 38:
      return 'Load TaskInprogress';
    case 39:
      return 'Load TaskCompleted';
    case 40:
      return 'Cross-Docking TaskAssign';
    case 41:
      return 'Cross-Docking TaskInprogress';
    case 42:
      return 'Cross-Docking TaskCompleted';
    case 43:
      return 'Outbound Created';
      case 44:
      return 'Outbound Updated';
    case -1:
      return 'Reject From securityVerification';
    case -2:
      return 'Reject From OtlVerification';
    default:
      return '';
  }
}

function getStatusLabel(status) {
  switch (status) {
    case 1:
      return ' Inbound Created';
    case 2:
      return 'Document Verified';
    case 3:
      return 'Bay Allocated';
    case 4:
      return 'Dock Verified';
    case 5:
      return 'Unload Completed';
    case 6:
      return 'GRN Generated';
    case 7:
      return 'Inbound InProgress';
    case 8:
      return 'Task completed';
    case 9:
      return 'OutBound Created';
    case 10:
      return 'OutBound InProgress';
    case -1:
      return 'Reject From SecurityVerification';
    case -2:
      return 'Dock Rejected';
    default:
      return '';
  }
}
function currentDate() {
  const currentDate = new Date();

  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');

  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
}

function currentTime() {
  const currentTime = new Date();

  let hours = String(currentTime.getHours()).padStart(2, '0');
  let minutes = String(currentTime.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;

  const formattedTime = `${hours}:${minutes} ${ampm}`;
  return formattedTime;
}

// async function sendEmail(from, toMail, mailsubject, mailhtml, text, attachments) {
//   try {
//     // Configure the SMTP transporter
//     const transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         user: 'laswms2023@gmail.com',
//         pass: 'gtmntmmmycyagnbj',
//       },
//     });

//     // Compose the email options
//     const mailOptions = {
//       from: { name: from, address: 'laswms2023@gmail.com' },
//       to: toMail,
//       subject: mailsubject,
//       html: mailhtml,
//       text: text,
//       attachments: attachments,
//     };

//     // Send the email
//     const info = await transporter.sendMail(mailOptions);
//     console.log('Email sent:', info.response);
//   } catch (error) {
//     console.error('Error sending email:', error);
//   }
// }

function sendEmail(mailto, mailsubject, mailhtml, text) {
  try {
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: env.EMAILID,
        pass: env.PASSWORD
      }
    });
    var mailOptions = {
      from: env.EMAILID,
      to: mailto,
      subject: mailsubject,
      html: mailhtml,
      text: text,
      replyTo: env.EMAILID,
      /* attachments: attachments, */
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  } catch (err) {
    console.log(err);
  }
};

// var fcmServerKey = 'AAAAaHtj290:APA91bHU0CQdmKtY-EkMmatHlD-CBVB5heuftyYizDVZZnSTx3v8O921l8MvVN3gGRKyEV8RL5mwqJegzOxRLGXXfWqSzPZJqq5EH2QJmPPiiTyioCQqkqkfvoWedGQ-XzOy-8uI_Hts';

var fcmServerKey = 'AAAAQfj8dAw:APA91bHEN0v0EfhyLfamDvs6RPmqIA3WcUkGX-I2g2gQe4lrZixoYnedR9O2mcyHKVkSGRJ--QTTrZGeWqXo2-sY4MkCaXLzxy_EcyQPUBC8JIy1mEJuWE5tQdL8raL2tYh3ROH8S04p';

function sendPushNotification(data) {
  var config = {
    method: 'post',
    url: 'https://fcm.googleapis.com/fcm/send',
    headers: {
      'Authorization': 'key=' + fcmServerKey,
      'Content-Type': 'application/json'
    },
    data: data
  };
  axios(config)
    .then(function (response) {
      console.log('Axios GCM response', JSON.stringify(response.data));
    })
    .catch(function (error) {
      console.log(error.message);
    });
}
module.exports = {
  uploadTempImage,
  // movetoOriginalImage,
  updateCollection,
  moveToSingleImage,
  moveToSingleDoc,
  moveToImage,
  removeImage,
  deleteImage,
  currentTime,
  currentDate,
  getStatusLabel,
  getLogStatusLabel,
  translate,
  sendEmail,
  sendPushNotification
};

