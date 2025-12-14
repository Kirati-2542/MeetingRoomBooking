import { createClient } from '@supabase/supabase-js';

// Read Supabase configuration from environment variables (.env file)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate that environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey;
};

// Check connection status to Supabase
export const checkConnection = async (): Promise<{
  connected: boolean;
  latency?: number;
  error?: string;
}> => {
  if (!isSupabaseConfigured()) {
    return { connected: false, error: 'ยังไม่ได้ตั้งค่า Supabase' };
  }

  const startTime = Date.now();

  try {
    // Try to query a simple table to test connection
    const { error } = await supabase.from('users').select('id').limit(1);

    const latency = Date.now() - startTime;

    if (error) {
      // Check if it's a table not found error (means connection works but table doesn't exist)
      if (error.code === '42P01') {
        return { connected: true, latency, error: 'เชื่อมต่อได้ แต่ยังไม่มีตาราง users' };
      }
      return { connected: false, error: error.message };
    }

    return { connected: true, latency };
  } catch (err: any) {
    return { connected: false, error: err.message || 'ไม่สามารถเชื่อมต่อได้' };
  }
};

// Storage functions for room images
const BUCKET_NAME = 'room-images';

export const storage = {
  // Upload image to Supabase Storage
  uploadImage: async (file: File, fileName?: string): Promise<{ url: string | null; error: string | null }> => {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const uniqueName = fileName || `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload file
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(uniqueName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Upload error:', error);
        return { url: null, error: error.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

      return { url: urlData.publicUrl, error: null };
    } catch (err: any) {
      return { url: null, error: err.message || 'ไม่สามารถอัปโหลดรูปภาพได้' };
    }
  },

  // Delete image from Supabase Storage
  deleteImage: async (imageUrl: string): Promise<{ success: boolean; error: string | null }> => {
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split(`/${BUCKET_NAME}/`);
      if (urlParts.length < 2) {
        return { success: false, error: 'URL รูปภาพไม่ถูกต้อง' };
      }

      const filePath = urlParts[1];

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || 'ไม่สามารถลบรูปภาพได้' };
    }
  },

  // Get public URL for an image
  getPublicUrl: (filePath: string): string => {
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    return data.publicUrl;
  }
};
