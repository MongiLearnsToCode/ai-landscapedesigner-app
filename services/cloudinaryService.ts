// Cloudinary service for handling image uploads and transformations
import type { ImageFile } from '../types';

interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

export interface CloudinaryUploadResult {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  original_filename: string;
}

// Configuration - these would typically be stored in environment variables
const CLOUDINARY_CONFIG: CloudinaryConfig = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '', // Would be set in .env.local
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '' // For unsigned uploads
};

/**
 * Uploads an image file to Cloudinary using unsigned upload preset with retry logic
 * @param imageFile The image file to upload
 * @param retries Number of retry attempts (default: 3)
 * @returns A promise that resolves to the upload result
 */
export const uploadImageToCloudinary = async (
  imageFile: ImageFile,
  retries: number = 3
): Promise<CloudinaryUploadResult> => {
  const { cloudName, uploadPreset } = CLOUDINARY_CONFIG;

  console.log('🔧 Cloudinary Config:', { cloudName, uploadPreset });

  if (!cloudName) {
    throw new Error('Cloudinary cloud name is not configured');
  }

  if (!uploadPreset) {
    throw new Error('Cloudinary upload preset is not configured');
  }

  // Convert base64 to blob
  const binaryString = atob(imageFile.base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: imageFile.type });

  const formData = new FormData();
  formData.append('file', blob, imageFile.name);
  formData.append('upload_preset', uploadPreset);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  
  console.log('📤 Uploading to:', uploadUrl);
  console.log('📦 File size:', blob.size, 'bytes');

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Upload error:', errorData);
        throw new Error(`Cloudinary upload failed: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      console.log('✅ Upload successful:', result.public_id);
      return result as CloudinaryUploadResult;
    } catch (error) {
      console.error(`Upload attempt ${attempt + 1} failed:`, error);
      
      if (attempt === retries) {
        throw new Error(`Failed to upload after ${retries + 1} attempts: ${error}`);
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  throw new Error('Upload failed after all retry attempts');
};

/**
 * Gets a Cloudinary URL for an image with optional transformations
 * @param publicId The public ID of the image on Cloudinary
 * @param transformations Optional transformations (e.g., resize, crop)
 * @returns The Cloudinary URL
 */
export const getCloudinaryUrl = (
  publicId: string,
  transformations?: Record<string, string | number>
): string => {
  const { cloudName } = CLOUDINARY_CONFIG;

  if (!cloudName) {
    throw new Error('Cloudinary cloud name is not configured');
  }

  let url = `https://res.cloudinary.com/${cloudName}/image/upload`;

  // Add transformations if provided
  if (transformations) {
    const transformationString = Object.entries(transformations)
      .map(([key, value]) => `${key}_${value}`)
      .join(',');
    
    url += `/${transformationString}`;
  }

  url += `/${publicId}`;
  
  return url;
};

/**
 * Deletes an image from Cloudinary
 * Note: This requires authentication and is typically done from the backend
 * @param publicId The public ID of the image to delete
 * @param apiKey Cloudinary API key
 * @param apiSecret Cloudinary API secret
 * @returns A promise that resolves when deletion is complete
 */
export const deleteImageFromCloudinary = async (
  publicId: string,
  apiKey: string,
  apiSecret: string
): Promise<void> => {
  const { cloudName } = CLOUDINARY_CONFIG;

  if (!cloudName) {
    throw new Error('Cloudinary cloud name is not configured');
  }

  // In a production app, you'd typically make a backend API call to handle deletion
  // rather than including API key and secret in frontend code
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`;

  const signature = generateSignature(publicId, apiSecret);
  
  const formData = new FormData();
  formData.append('public_id', publicId);
  formData.append('signature', signature);
  formData.append('api_key', apiKey);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Cloudinary deletion failed: ${response.status} - ${errorData}`);
    }
    
    await response.json();
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

/**
 * Generates signature for Cloudinary API calls (backend should handle this in production)
 */
const generateSignature = (publicId: string, apiSecret: string): string => {
  // In a real application, this should be done on the backend for security
  // For demonstration purposes, we're showing the approach
  throw new Error('Signature generation should be done on the backend for security');
};