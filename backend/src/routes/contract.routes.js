import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { requireAuth } from '../middleware/auth.middleware.js';

import {
    uploadContract,
    getContracts,
    getContractById,
    pinContract,
    deleteContract
} from '../controllers/contract.controller.js';

const router = express.Router();

// Upload directory
const uploadDir = path.join(process.cwd(), 'uploads', 'contracts');

// Create directory if it does not exist
fs.mkdirSync(uploadDir, { recursive: true });

// Multer disk storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();

        const uniqueName =
            `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;

        cb(null, uniqueName);
    }
});

// Allow only PDF and DOCX
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error('Only PDF and DOCX files are allowed.'));
    }

    cb(null, true);
};

// Multer configuration
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB
    }
});

// Upload contract
router.post(
    '/upload',
    requireAuth,
    upload.single('file'),

    (err, req, res, next) => {
        if (err instanceof multer.MulterError) {

            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'File size must not exceed 10 MB.'
                });
            }

            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        next();
    },

    uploadContract
);

// Get all contracts belonging to logged-in user
router.get(
    '/',
    requireAuth,
    getContracts
);

// Get one contract belonging to logged-in user
router.get(
    '/:id',
    requireAuth,
    getContractById
);

// Pin / unpin a contract
router.patch(
    '/:id/pin',
    requireAuth,
    pinContract
);

// Delete a contract
router.delete(
    '/:id',
    requireAuth,
    deleteContract
);

export default router;