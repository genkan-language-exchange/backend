const cloudinary = require('cloudinary').v2;

const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./factory');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
})

exports.setAvatar = async (req, res, next) => {
  console.log(req.file) // from multer

  res.status(200)
  // const eager_options = {
  //   width: 200, height: 150, crop: 'scale', format: 'jpg'
  // };

  // const folder = "users/avatars",
  // cloudName = process.env.CLOUDINARY_CLOUD_NAME,
  // apiKey = process.env.CLOUDINARY_KEY,
  // apiSecret = process.env.CLOUDINARY_SECRET;

  // CLOUDINARY_URL=`cloudinary:/${apiKey}:${apiSecret}@${cloudName}`

  // cloudinary.uploader.upload(
  //   `avatar_${req.body.username}.jpg`,
  //   {
  //     tags: "user_avatar",
  //     eager: eager_options
  //   },
  //   (error, result) => {
  //     console.log(result, error)
  //   }
  // )
  // .then(image => {
  //   // image.public_id
  //   // image.url
  // })
}