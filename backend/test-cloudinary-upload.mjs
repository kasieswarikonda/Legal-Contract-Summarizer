import dotenv from 'dotenv';
dotenv.config();
import { v2 as cloudinary } from 'cloudinary';
import { writeFile, unlink } from 'fs/promises';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

await writeFile('test-contract.txt', 'Sample contract text for upload test.');

try {
  const result = await cloudinary.uploader.upload('test-contract.txt', {
    folder: 'legal-contracts',
    resource_type: 'raw',
    public_id: `test-${Date.now()}`,
  });
  console.log('SUCCESS - URL:', result.secure_url);
  await cloudinary.uploader.destroy(result.public_id, { resource_type: 'raw' });
  console.log('Test file cleaned up.');
} catch (err) {
  console.error('UPLOAD FAILED:', err.message);
  console.error('Full error:', JSON.stringify(err, null, 2));
}

await unlink('test-contract.txt').catch(() => {});
