import dotenv from 'dotenv';
dotenv.config();
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('Cloud name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API key:', process.env.CLOUDINARY_API_KEY);

try {
  // Check account
  const ping = await cloudinary.api.ping();
  console.log('Cloudinary ping:', ping.status);

  // List files in legal-contracts folder
  const result = await cloudinary.api.resources({
    type: 'upload',
    resource_type: 'raw',
    prefix: 'legal-contracts/',
    max_results: 20,
  });
  console.log('Files in legal-contracts folder:', result.resources.length);
  result.resources.forEach(r => console.log(' -', r.public_id, r.secure_url));
} catch (err) {
  console.error('Cloudinary error:', err.message || err);
}
