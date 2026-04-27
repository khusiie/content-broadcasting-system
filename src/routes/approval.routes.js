const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approval.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.get('/pending', authenticate, authorize(['principal']), approvalController.getAllPendingContent);
router.post('/status/:contentId', authenticate, authorize(['principal']), approvalController.approveOrReject);
router.get('/all', authenticate, authorize(['principal']), approvalController.getAllContent);

module.exports = router;
