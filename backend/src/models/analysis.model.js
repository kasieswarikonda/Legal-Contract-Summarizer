import mongoose from 'mongoose';

const clauseSchema = new mongoose.Schema({
  title: String,
  content: String,
  explanation: String,
}, { _id: false });

const riskSchema = new mongoose.Schema({
  clause: String,
  level: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
  explanation: String,
}, { _id: false });

const qaSchema = new mongoose.Schema({
  question: String,
  answer: String,
  askedAt: { type: Date, default: Date.now },
}, { _id: false });

const analysisSchema = new mongoose.Schema({
  contract: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  summary: { type: String, default: null },
  importantClauses: { type: [clauseSchema], default: [] },
  risks: { type: [riskSchema], default: [] },
  riskScore: { type: Number, default: null },
  qaHistory: { type: [qaSchema], default: [] },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  errorMessage: { type: String, default: null },
}, { timestamps: true });

export const Analysis = mongoose.model('Analysis', analysisSchema);
