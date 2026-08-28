import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';

import { Contract } from '../models/contract.model.js';

export async function uploadContract(req, res) {
    try {
        // Module 1 authentication
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Multer should provide the uploaded file
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file received. Please upload a PDF or DOCX file.'
            });
        }

        const extension = path.extname(req.file.originalname).toLowerCase();

        let fileType;

        if (extension === '.pdf') {
            fileType = 'pdf';
        } else if (extension === '.docx') {
            fileType = 'docx';
        } else {
            await fs.unlink(req.file.path).catch(() => {});

            return res.status(400).json({
                success: false,
                message: 'Only PDF and DOCX files are allowed.'
            });
        }

        const contract = await Contract.create({
            user: req.user.userId,
            originalFileName: req.file.originalname,
            storedFileName: req.file.filename,
            fileType,
            mimeType: req.file.mimetype,
            fileSize: req.file.size,
            filePath: req.file.path,
            processingStatus: 'pending',
            extractedText: null
        });

        return res.status(201).json({
            success: true,
            message: 'Contract uploaded successfully.',
            contract: {
                id: contract._id,
                originalFileName: contract.originalFileName,
                fileType: contract.fileType,
                fileSize: contract.fileSize,
                processingStatus: contract.processingStatus,
                createdAt: contract.createdAt
            }
        });
    } catch (error) {
        if (req.file?.path) {
            await fs.unlink(req.file.path).catch(() => {});
        }

        console.error('Contract upload error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to save contract.'
        });
    }
}

export async function getContracts(req, res) {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const contracts = await Contract.find({
            user: req.user.userId
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            contracts
        });
    } catch (error) {
        console.error('Get contracts error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve contracts.'
        });
    }
}

export async function getContractById(req, res) {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid contract ID.'
            });
        }

        const contract = await Contract.findOne({
            _id: id,
            user: req.user.userId
        });

        if (!contract) {
            return res.status(404).json({
                success: false,
                message: 'Contract not found.'
            });
        }

        return res.status(200).json({
            success: true,
            contract
        });
    } catch (error) {
        console.error('Get contract error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve contract.'
        });
    }
}