import { projectId } from "./supabase/info";
import { getAuthToken } from "../lib/auth/getAuthToken";

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-3b52693b`;

interface UploadResult {
  url: string;
  path: string;
}

/**
 * Upload an image to Supabase Storage
 * @param file - The file to upload
 * @param userId - The user ID
 * @param folder - Optional folder name (e.g., 'avatars', 'characters', 'worlds')
 * @returns Object with the signed URL and file path
 */
export async function uploadImage(
  file: File,
  userId: string,
  folder: string = "general"
): Promise<UploadResult> {
  try {
    // Get auth token
    const token = await getAuthToken();

    if (!token) {
      throw new Error("Unauthorized - please log in");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId);
    formData.append("folder", folder);

    const response = await fetch(`${API_BASE_URL}/storage/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    const data = await response.json();
    return {
      url: data.url,
      path: data.path,
    };
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

/**
 * Get storage usage for a user
 * @param userId - The user ID (not used, derived from auth token)
 * @returns Storage usage information
 */
export async function getStorageUsage(userId?: string): Promise<{
  totalSize: number;
  fileCount: number;
  files: Array<{ name: string; size: number; createdAt: string }>;
}> {
  try {
    // Get auth token
    const token = await getAuthToken();

    if (!token) {
      throw new Error("Unauthorized - please log in");
    }

    const response = await fetch(`${API_BASE_URL}/storage/usage`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Failed to get storage usage" }));
      throw new Error(error.error || "Failed to get storage usage");
    }

    return await response.json();
  } catch (error) {
    console.error("Storage usage error:", error);
    throw error;
  }
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Get the storage limit for the free tier
 * Supabase free tier: 1 GB
 */
export const STORAGE_LIMIT_BYTES = 1 * 1024 * 1024 * 1024; // 1 GB
export const STORAGE_LIMIT_MB = 1024; // 1 GB in MB

/**
 * Check if upload would exceed storage limit
 */
export function wouldExceedLimit(currentBytes: number, fileSize: number): boolean {
  return (currentBytes + fileSize) > STORAGE_LIMIT_BYTES;
}
