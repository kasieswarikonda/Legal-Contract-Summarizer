import { readFile } from 'fs/promises';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

export class ExtractionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ExtractionError';
  }
}

function normalizeText(raw) {
  if (!raw) return raw;
  let t = raw.replace(/\u00a0/g, ' ');
  t = t.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '');
  t = t.replace(/[ \t]{2,}/g, ' ');
  t = t.replace(/\r\n/g, '\n');
  t = t.split('\n').map(l => l.replace(/[ \t]+$/, '')).join('\n');
  t = t.replace(/\n{3,}/g, '\n\n');
  return t.trim();
}

async function extractFromPdf(filePath) {
  const data = await readFile(filePath);
  const parser = new PDFParse({ data });
  const result = await parser.getText();
  const extracted = normalizeText(result.text);
  if (!extracted) throw new ExtractionError('No usable text could be extracted from this PDF. It may be scanned or image-only.');
  return extracted;
}

async function extractFromDocx(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    const extracted = normalizeText(result.value);
    if (!extracted) throw new ExtractionError('No readable text could be extracted from this document.');
    return extracted;
  } catch (err) {
    if (err instanceof ExtractionError) throw err;
    throw new ExtractionError('Failed to extract text from the document. It may be corrupted or unsupported.');
  }
}

export async function extractTextFromFile(filePath, fileType) {
  if (!filePath || !fileType) throw new ExtractionError('File path and type are required.');
  if (fileType === 'pdf') return extractFromPdf(filePath);
  if (fileType === 'docx') return extractFromDocx(filePath);
  throw new ExtractionError('Unsupported file type.');
}
