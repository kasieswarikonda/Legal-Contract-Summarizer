import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';

import { Contract } from '../models/contract.model.js';
import {
    extractTextFromFile,
    ExtractionError
} from '../services/documentExtraction.service.js';

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

        let contract = await Contract.create({
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

        // Mark as processing before attempting extraction.
        contract.processingStatus = 'processing';
        await contract.save();

        let extractedText;

        try {
            extractedText = await extractTextFromFile(req.file.path, fileType);
        } catch (extractionError) {
            // Keep the Contract record, mark it failed, and surface a safe message.
            contract.processingStatus = 'failed';
            contract.extractionError = extractionError.message || null;
            await contract.save().catch(() => {});

            const message =
                extractionError instanceof ExtractionError
                    ? extractionError.message
                    : 'Text extraction failed. The file may be corrupted or unsupported.';

            console.error('Contract text extraction failed:', extractionError.message);

            return res.status(200).json({
                success: true,
                message: 'Contract uploaded, but text extraction failed.',
                contract: {
                    id: contract._id,
                    originalFileName: contract.originalFileName,
                    fileType: contract.fileType,
                    fileSize: contract.fileSize,
                    processingStatus: contract.processingStatus,
                    extractionError: message,
                    createdAt: contract.createdAt
                }
            });
        }

        // Extraction succeeded: persist the text and mark completed.
        contract.extractedText = extractedText;
        contract.processingStatus = 'completed';
        await contract.save();

        return res.status(201).json({
            success: true,
            message: 'Contract uploaded and processed successfully.',
            contract: {
                id: contract._id,
                originalFileName: contract.originalFileName,
                fileType: contract.fileType,
                fileSize: contract.fileSize,
                processingStatus: contract.processingStatus,
                extractionError: contract.extractionError || null,
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

        const contracts = await Contract.find(
            { user: req.user.userId },
            '-filePath'
        ).sort({ createdAt: -1 });

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

        const contract = await Contract.findOne(
            { _id: id, user: req.user.userId },
            '-filePath'
        );

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