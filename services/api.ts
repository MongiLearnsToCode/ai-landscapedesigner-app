// API service for backend communication
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-domain.com/api' // Replace with your actual backend domain in production
  : '/api'; // This will be proxied to the backend server during development

// Utility function to make API requests with proper error handling
const apiRequest = async <T>(
  endpoint: string,
  options: { method?: string; body?: any; params?: Record<string, string> } = {}
): Promise<T> => {
  const { method = 'GET', body, params } = options;
  
  // Build URL with query parameters if provided
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  // Prepare request options
  const requestOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Add body if provided
  if (body) {
    requestOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, requestOptions);

    // Handle non-success responses
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorData}`);
    }

    // Return JSON response
    return await response.json();
  } catch (error) {
    console.error(`API request error for ${method} ${url}:`, error);
    throw error;
  }
};

// Function to upload an image file to the backend via Cloudinary
export const uploadImage = async (file: File | { base64: string; type: string; name?: string }): Promise<{ id: string; storagePath: string; type: string }> => {
  // Import the Cloudinary service dynamically to avoid circular dependencies
  const { uploadImageToCloudinary } = await import('./cloudinaryService');
  
  // Convert file to our ImageFile type if it's a File object
  let imageFile: { base64: string; type: string; name: string };
  
  if (file instanceof File) {
    // Convert File to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Extract base64 part after the comma
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
    
    imageFile = {
      base64,
      type: file.type,
      name: file.name
    };
  } else {
    imageFile = {
      base64: file.base64,
      type: file.type,
      name: file.name || 'image'
    };
  }

  try {
    // Upload image to Cloudinary
    const cloudinaryResult = await uploadImageToCloudinary(imageFile);
    
    // Then save metadata to backend
    // In a real implementation, you would call your backend endpoint
    // to store the image metadata in the database
    const imageMetadata = {
      id: cloudinaryResult.public_id, // Using Cloudinary public ID as our image ID
      storagePath: cloudinaryResult.secure_url, // Using Cloudinary secure URL
      type: imageFile.type
    };
    
    return imageMetadata;
  } catch (error) {
    console.error('Error uploading image via Cloudinary:', error);
    throw error;
  }
};

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  subscription: {
    id?: string;
    plan?: string;
    status?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
    polarCustomerId?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Image {
  id: string;
  name: string;
  type: string;
  storagePath: string;
  size?: number;
  userId?: string;
  createdAt: string;
}

export interface LandscapeRedesign {
  id: string;
  userId: string;
  originalImageId: string;
  redesignedImageId: string;
  designCatalog: { plants: { name: string; species: string }[]; features: { name: string; description: string }[] };
  styles: string[];
  climateZone?: string;
  density?: string;
  isPinned: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export const userService = {
  // Get user by ID
  getById: (userId: string): Promise<User> => apiRequest<User>(`/users/${userId}`),

  // Create or update user
  createOrUpdate: (userData: Partial<User>): Promise<User> => 
    apiRequest<User>('/users', { method: 'POST', body: userData }),
};

export const imageService = {
  // Upload image
  upload: (file: File | { base64: string; type: string; name?: string }): Promise<{ id: string; storagePath: string; type: string }> => 
    uploadImage(file),
  
  // Get image by ID (for download or metadata)
  getById: (imageId: string): Promise<Image> => 
    apiRequest<Image>(`/images/${imageId}`),
};

export const landscapeRedesignService = {
  // Get all redesigns for a user
  getByUserId: (userId: string): Promise<LandscapeRedesign[]> => 
    apiRequest<LandscapeRedesign[]>(`/landscaperedesigns/users/${userId}`),

  // Get a specific redesign
  getById: (redesignId: string): Promise<LandscapeRedesign> => 
    apiRequest<LandscapeRedesign>(`/landscaperedesigns/${redesignId}`),

  // Save a new redesign
  create: (redesignData: Omit<LandscapeRedesign, 'id' | 'createdAt' | 'updatedAt'>): Promise<LandscapeRedesign> => 
    apiRequest<LandscapeRedesign>('/landscaperedesigns', { method: 'POST', body: redesignData }),

  // Update a redesign (e.g., pin/unpin)
  update: (redesignId: string, updateData: Partial<LandscapeRedesign>): Promise<LandscapeRedesign> => 
    apiRequest<LandscapeRedesign>(`/landscaperedesigns/${redesignId}`, { 
      method: 'PATCH', 
      body: updateData 
    }),

  // Delete a redesign (soft delete)
  delete: (redesignId: string): Promise<{ message: string }> => 
    apiRequest<{ message: string }>(`/landscaperedesigns/${redesignId}`, { method: 'DELETE' }),

  // Get pinned redesigns for a user
  getPinnedByUserId: (userId: string): Promise<LandscapeRedesign[]> => 
    apiRequest<LandscapeRedesign[]>(`/landscaperedesigns/users/${userId}/pinned`),
};

export default apiRequest;