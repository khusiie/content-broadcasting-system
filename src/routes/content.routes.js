const express = require('express');
const router = express.Router();
const multer = require('multer');
const contentController = require('../controllers/content.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Multer config for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and GIF are allowed.'));
    }
  }
});

router.post('/upload', authenticate, authorize(['teacher']), upload.single('file'), contentController.uploadContent);
router.get('/my-content', authenticate, authorize(['teacher']), contentController.getTeacherContent);

module.exports = router;
