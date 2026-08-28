import { readFile } from 'fs/promises';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

// Logical error thrown when text extraction fails for a recoverable reason.
// The message is safe to surface to the frontend (no stack traces included).
export class ExtractionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ExtractionError';
    }
}

function normalizeText(rawText) {
    if (!rawText) {
        return rawText;
    }

    // Replace common tab characters / page breaks / non-breaking spaces.
    let text = rawText.replace(/\u00a0/g, ' ');
    text = text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '');

    // Collapse multiple blank lines into at most one (preserving paragraphs).
    text = text.replace(/[ \t]{2,}/g, ' ');

    // Normalize line terminations to a single newline and collapse the
    // runs of consecutive newlines into at most two (one empty line
    // between paragraphs).
    text = text.replace(/\r\n/g, '\n');

    // Trim trailing whitespace on each line.
    text = text.split('\n').map((line) => line.replace(/[ \t]+$/, '')).join('\n');

    // Collapse 3+ newlines into a single blank line.
    text = text.replace(/\n{3,}/g, '\n\n');

    return text.trim();
}

async function extractFromPdf(filePath) {
    let parser;

    try {
        const data = await readFile(filePath);
        parser = new PDFParse({ data });
        const result = await parser.getText();

        const extracted = normalizeText(result.text);

        if (!extracted || extracted.length === 0) {
            throw new ExtractionError(
                'No usable text could be extracted from this PDF. ' +
                'The file may be scanned or image-only, and normal text ' +
                'extraction is unavailable.'
            );
        }

        return extracted;
    } finally {
        if (parser) {
            await parser.destroy().catch(() => {});
        }
    }
}

async function extractFromDocx(filePath) {
    try {
        const result = await mammoth.extractRawText({ path: filePath });

        const extracted = normalizeText(result.value);

        if (!extracted || extracted.length === 0) {
            throw new ExtractionError(
                'No readable text could be extracted from this document.'
            );
        }

        return extracted;
    } catch (error) {
        // Pass through our controlled error untouched.
        if (error instanceof ExtractionError) {
            throw error;
        }

        throw new ExtractionError(
            'Failed to extract text from the document. ' +
            'The file may be corrupted or unsupported.'
        );
    }
}

/**
 * Extract readable text from an uploaded PDF or DOCX file.
 *
 * @param {string} filePath - Absolute path to the stored file.
 * @param {string} fileType - 'pdf' or 'docx'.
 * @returns {Promise<string>} Extracted, normalized text.
 * @throws {ExtractionError} When extraction fails or yields no usable text.
 */
export async function extractTextFromFile(filePath, fileType) {
    if (!filePath || !fileType) {
        throw new ExtractionError('File path and type are required for extraction.');
    }

    if (fileType === 'pdf') {
        return extractFromPdf(filePath);
    }

    if (fileType === 'docx') {
        return extractFromDocx(filePath);
    }

    throw new ExtractionError('Unsupported file type for text extraction.');
}
