import express from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.middleware.js';
import { uploadContract } from '../controllers/contract.controller.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();

// Accept PDF and Word documents
const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'application/pdf' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimetype === 'application/msword'
    ) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF and Word documents (.docx, .doc) are allowed'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Protect the endpoint with requireAuth and multer middleware
router.post('/upload', requireAuth, upload.single('file'), (err, req, res, next) => {
    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    next();
}, uploadContract);

export default router;
