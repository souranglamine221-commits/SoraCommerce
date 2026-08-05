const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { generateInvoice } = require('../controllers/invoiceController');

// Generate invoice PDF
router.get('/:orderId', protect, generateInvoice);

module.exports = router;
