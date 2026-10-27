import mongoose from 'mongoose';
import { Analysis } from '../models/analysis.model.js';
import { Contract } from '../models/contract.model.js';
import { analyzeContract, askQuestion } from '../services/gemini.service.js';

function ownsContract(contract, userId) {
  return contract.user.toString() === userId;
}

async function resolveContract(contractId, userId, res) {
  if (!mongoose.Types.ObjectId.isValid(contractId)) {
    res.status(400).json({ success: false, message: 'Invalid contract ID.' });
    return null;
  }
  const contract = await Contract.findById(contractId);
  if (!contract || !ownsContract(contract, userId)) {
    res.status(404).json({ success: false, message: 'Contract not found.' });
    return null;
  }
  if (contract.processingStatus !== 'completed' || !contract.extractedText) {
    res.status(400).json({ success: false, message: 'Contract text extraction is not complete.' });
    return null;
  }
  return contract;
}

export async function analyze(req, res) {
  try {
    const contract = await resolveContract(req.params.contractId, req.user.userId, res);
    if (!contract) return;

    const existing = await Analysis.findOne({ contract: contract._id });
    if (existing && existing.status === 'completed')
      return res.json({ success: true, analysis: existing });

    const record = existing || new Analysis({ contract: contract._id, user: req.user.userId });
    record.status = 'pending';
    record.errorMessage = null;
    await record.save();

    let result;
    try {
      result = await analyzeContract(contract.extractedText);
    } catch (err) {
      console.error('AI analysis error:', err.message);
      record.status = 'failed';
      record.errorMessage = err.message;
      await record.save();
      return res.status(502).json({ success: false, message: 'AI analysis failed.', detail: err.message });
    }

    record.summary = result.summary || '';
    record.importantClauses = Array.isArray(result.importantClauses) ? result.importantClauses : [];
    record.risks = Array.isArray(result.risks) ? result.risks : [];
    record.riskScore = typeof result.riskScore === 'number' ? result.riskScore : null;
    record.status = 'completed';
    await record.save();

    return res.json({ success: true, analysis: record });
  } catch (err) {
    console.error('analyze error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

export async function getAnalysis(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.contractId))
      return res.status(400).json({ success: false, message: 'Invalid contract ID.' });

    const analysis = await Analysis.findOne({
      contract: req.params.contractId,
      user: req.user.userId,
    });
    if (!analysis)
      return res.status(404).json({ success: false, message: 'No analysis found for this contract.' });

    return res.json({ success: true, analysis });
  } catch (err) {
    console.error('getAnalysis error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

export async function ask(req, res) {
  try {
    const { question } = req.body;
    if (!question || !question.trim())
      return res.status(400).json({ success: false, message: 'Question is required.' });

    const contract = await resolveContract(req.params.contractId, req.user.userId, res);
    if (!contract) return;

    const analysis = await Analysis.findOne({ contract: contract._id, user: req.user.userId });
    if (!analysis || analysis.status !== 'completed')
      return res.status(400).json({ success: false, message: 'Run analysis first before asking questions.' });

    let answer;
    try {
      answer = await askQuestion(contract.extractedText, question.trim());
    } catch (err) {
      console.error('Q&A error:', err.message);
      return res.status(502).json({ success: false, message: 'AI service failed.', detail: err.message });
    }

    analysis.qaHistory.push({ question: question.trim(), answer });
    await analysis.save();

    return res.json({ success: true, question: question.trim(), answer });
  } catch (err) {
    console.error('ask error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

export async function getReport(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.contractId))
      return res.status(400).json({ success: false, message: 'Invalid contract ID.' });

    const contract = await Contract.findOne({ _id: req.params.contractId, user: req.user.userId });
    if (!contract)
      return res.status(404).json({ success: false, message: 'Contract not found.' });

    const analysis = await Analysis.findOne({ contract: contract._id, user: req.user.userId });
    if (!analysis || analysis.status !== 'completed')
      return res.status(400).json({ success: false, message: 'Analysis not completed yet.' });

    const report = {
      generatedAt: new Date().toISOString(),
      contract: {
        fileName: contract.originalFileName,
        fileType: contract.fileType,
        fileSize: contract.fileSize,
        uploadedAt: contract.createdAt,
      },
      summary: analysis.summary,
      riskScore: analysis.riskScore,
      importantClauses: analysis.importantClauses,
      risks: analysis.risks,
      qaHistory: analysis.qaHistory,
    };

    return res.json({ success: true, report });
  } catch (err) {
    console.error('getReport error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}
