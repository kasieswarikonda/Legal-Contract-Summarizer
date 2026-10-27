import { PDFParse } from 'pdf-parse';
import { readFile } from 'fs/promises';

const data = await readFile('uploads/contracts/1788346937694-19058308.pdf');
const inst = new PDFParse({ data });
const result = await inst.getText();
console.log('keys:', Object.keys(result));
console.log('text snippet:', result.text?.slice(0, 200));
