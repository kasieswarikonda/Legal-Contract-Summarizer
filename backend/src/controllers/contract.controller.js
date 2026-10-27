import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import { Contract } from '../models/contract.model.js';
import { extractTextFromFile, ExtractionError } from '../services/documentExtraction.service.js';
import { uploadToCloudinary } from '../services/cloudinary.service.js';

export async function uploadContract(req, res) {
  try {
    if (!req.user?.userId)
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!req.file)
      return res.status(400).json({ success: false, message: 'No file received. Please upload a PDF or DOCX file.' });

    const extension = path.extname(req.file.originalname).toLowerCase();
    const fileType = extension === '.pdf' ? 'pdf' : extension === '.docx' ? 'docx' : null;
    if (!fileType) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ success: false, message: 'Only PDF and DOCX files are allowed.' });
    }

    let contract = await Contract.create({
      user: req.user.userId,
      originalFileName: req.file.originalname,
      storedFileName: req.file.filename,
      fileType,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      filePath: req.file.path,
      processingStatus: 'processing',
    });

    // Extract text
    let extractedText;
    try {
      extractedText = await extractTextFromFile(req.file.path, fileType);
    } catch (err) {
      const message = err instanceof ExtractionError ? err.message : 'Text extraction failed.';
      contract.processingStatus = 'failed';
      contract.extractionError = message;
      await contract.save().catch(() => {});
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(200).json({
        success: true,
        message: 'Contract uploaded, but text extraction failed.',
        contract: safeContract(contract),
      });
    }

    // Upload to Cloudinary
    let cloudinaryUrl = null, cloudinaryPublicId = null;
    try {
  const result = await uploadToCloudinary(
    req.file.path,
    req.file.originalname
  );

  cloudinaryUrl = result.url;
  cloudinaryPublicId = result.publicId;
} catch (err) {
  console.error('Cloudinary upload failed:', err.message);

  contract.processingStatus = 'failed';
  contract.extractionError = `Cloudinary upload failed: ${err.message}`;

  await contract.save();

  await fs.unlink(req.file.path).catch(() => {});

  return res.status(500).json({
    success: false,
    message: 'Contract extracted successfully, but Cloudinary upload failed.',
    error: err.message,
  });
}

    // Clean up local file
    await fs.unlink(req.file.path).catch(() => {});

    contract.extractedText = extractedText;
    contract.processingStatus = 'completed';
    contract.cloudinaryUrl = cloudinaryUrl;
    contract.cloudinaryPublicId = cloudinaryPublicId;
    await contract.save();

    return res.status(201).json({
      success: true,
      message: 'Contract uploaded and processed successfully.',
      contract: safeContract(contract),
    });
  } catch (err) {
    if (req.file?.path) await fs.unlink(req.file.path).catch(() => {});
    console.error('Contract upload error:', err);
    return res.status(500).json({ success: false, message: 'Failed to save contract.' });
  }
}

export async function getContracts(req, res) {
  try {
    if (!req.user?.userId)
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    const contracts = await Contract.find(
      { user: req.user.userId },
      '-filePath -storedFileName -extractedText'
    ).sort({ createdAt: -1 });
    return res.json({ success: true, contracts });
  } catch (err) {
    console.error('Get contracts error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve contracts.' });
  }
}

export async function pinContract(req, res) {
  try {
    if (!req.user?.userId)
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'Invalid contract ID.' });
    const contract = await Contract.findOne({ _id: id, user: req.user.userId });
    if (!contract)
      return res.status(404).json({ success: false, message: 'Contract not found.' });
    contract.pinned = !contract.pinned;
    await contract.save();
    return res.json({ success: true, pinned: contract.pinned });
  } catch (err) {
    console.error('Pin contract error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update pin.' });
  }
}

export async function deleteContract(req, res) {
  try {
    if (!req.user?.userId)
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'Invalid contract ID.' });
    const contract = await Contract.findOne({ _id: id, user: req.user.userId });
    if (!contract)
      return res.status(404).json({ success: false, message: 'Contract not found.' });
    // Delete from Cloudinary
    if (contract.cloudinaryPublicId) {
      const { deleteFromCloudinary } = await import('../services/cloudinary.service.js');
      await deleteFromCloudinary(contract.cloudinaryPublicId);
    }
    // Delete analysis
    const { Analysis } = await import('../models/analysis.model.js');
    await Analysis.deleteOne({ contract: contract._id });
    await contract.deleteOne();
    return res.json({ success: true, message: 'Contract deleted.' });
  } catch (err) {
    console.error('Delete contract error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete contract.' });
  }
}

export async function getContractById(req, res) {
  try {
    if (!req.user?.userId)
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'Invalid contract ID.' });
    const contract = await Contract.findOne(
      { _id: id, user: req.user.userId },
      '-filePath -storedFileName'
    );
    if (!contract)
      return res.status(404).json({ success: false, message: 'Contract not found.' });
    return res.json({ success: true, contract });
  } catch (err) {
    console.error('Get contract error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve contract.' });
  }
}

function safeContract(c) {
  return {
    id: c._id,
    originalFileName: c.originalFileName,
    fileType: c.fileType,
    fileSize: c.fileSize,
    processingStatus: c.processingStatus,
    cloudinaryUrl: c.cloudinaryUrl,
    extractionError: c.extractionError || null,
    createdAt: c.createdAt,
  };
}
