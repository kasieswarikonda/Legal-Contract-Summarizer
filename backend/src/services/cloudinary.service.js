import { v2 as cloudinary } from 'cloudinary';
import config from '../config/env.js';

if (
  !config.cloudinary.cloudName ||
  !config.cloudinary.apiKey ||
  !config.cloudinary.apiSecret
) {
  console.error('❌ Cloudinary configuration is missing.');

  console.error({
    cloudName: !!config.cloudinary.cloudName,
    apiKey: !!config.cloudinary.apiKey,
    apiSecret: !!config.cloudinary.apiSecret,
  });
}

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export async function uploadToCloudinary(filePath, originalName) {
  console.log('----------------------------------------');
  console.log('☁️ Starting Cloudinary upload');
  console.log('File path:', filePath);
  console.log('Original name:', originalName);
  console.log('Cloud name:', config.cloudinary.cloudName);
  console.log('API key exists:', !!config.cloudinary.apiKey);
  console.log('API secret exists:', !!config.cloudinary.apiSecret);

  try {
    const safeName = originalName
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');

    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'legal-contracts',
      resource_type: 'raw',
      public_id: `${Date.now()}-${safeName}`,
      use_filename: false,
    });

    console.log('✅ Cloudinary upload successful');
    console.log('Public ID:', result.public_id);
    console.log('Secure URL:', result.secure_url);
    console.log('Resource type:', result.resource_type);

    console.log('----------------------------------------');

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('❌ CLOUDINARY UPLOAD ERROR');
    console.error('Message:', error.message);
    console.error('HTTP code:', error.http_code);
    console.error('Name:', error.name);
    console.error('Full error:', error);

    console.log('----------------------------------------');

    throw error;
  }
}

export async function deleteFromCloudinary(publicId) {
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw',
    });

    console.log('✅ Cloudinary file deleted:', publicId);
  } catch (error) {
    console.error(
      '❌ Cloudinary delete failed:',
      error.message
    );
  }
}