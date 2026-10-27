import mongoose from 'mongoose';

const contractSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalFileName: { type: String, required: true },
  storedFileName: { type: String, required: true },
  fileType: { type: String, required: true, enum: ['pdf', 'docx'] },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  filePath: { type: String, required: true },
  cloudinaryUrl: { type: String, default: null },
  cloudinaryPublicId: { type: String, default: null },
  processingStatus: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  extractedText: { type: String, default: null },
  extractionError: { type: String, default: null },
  pinned: { type: Boolean, default: false },
}, { timestamps: true });

export const Contract = mongoose.model('Contract', contractSchema);
