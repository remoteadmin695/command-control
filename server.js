const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// ✅ Serve static files like control.html, stream.html from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Upload directory setup
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// ✅ Multer for handling uploads (limit: 1GB)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage, limits: { fileSize: 1024 * 1024 * 1024 } });

// ✅ Upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
    console.log('✅ File uploaded:', req.file.filename);
    res.status(200).send('File uploaded successfully.');
});

// (Optional) Serve uploaded files for download
app.use('/uploads', express.static(uploadDir));

// ✅ Start the server
app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`🌐 Your live server is available at: https://command-control-server.onrender.com`);
});
