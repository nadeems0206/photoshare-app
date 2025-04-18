const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const app = express();
const upload = multer();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();
const BUCKET = process.env.S3_BUCKET_NAME;

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', async (req, res) => {
  try {
    const data = await s3.listObjectsV2({ Bucket: BUCKET }).promise();
    const images = data.Contents.map(obj => obj.Key);
    res.render('index', { images, bucket: BUCKET });
  } catch (err) {
    res.send("Error loading images.");
  }
});

app.post('/upload', upload.single('image'), async (req, res) => {
  const file = req.file;
  if (!file) return res.send('No file uploaded.');

  const params = {
    Bucket: BUCKET,
    Key: file.originalname,
    Body: file.buffer,
    ACL: 'public-read'
  };

  try {
    await s3.upload(params).promise();
    res.redirect('/');
  } catch (err) {
    res.send("Upload failed.");
  }
});

app.listen(3000, () => console.log("Server started on http://localhost:3000"));
