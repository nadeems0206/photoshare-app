const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const app = express();

// Multer config to allow only image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();
const BUCKET = process.env.S3_BUCKET_NAME;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

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
    ACL: 'public-read',
    ContentType: file.mimetype
  };

  try {
    await s3.upload(params).promise();
    res.redirect('/');
  } catch (err) {
    res.send("Upload failed.");
  }
});

app.post('/delete', async (req, res) => {
  const { key } = req.body;
  if (!key) return res.send("No key provided");

  try {
    await s3.deleteObject({ Bucket: BUCKET, Key: key }).promise();
    res.redirect('/');
  } catch (err) {
    res.send("Deletion failed.");
  }
});

app.listen(3000, () => console.log("Server started on http://localhost:3000"));
