const STORAGE_URL = import.meta.env.VITE_STORAGE_URL || import.meta.env.VITE_SUPABASE_URL;

export function getStorageUrl(bucket: string, path: string): string {
  return `${STORAGE_URL}/storage/v1/object/public/${bucket}/${path}`;
}
