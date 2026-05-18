export interface AppSettings {
  compressionQuality: number;
  outputDirectory: string;
  theme: 'light' | 'dark';
  zipAutoDownload: boolean;
  base64RemoveQualifier: boolean;
  base64CustomFormat: string;
  base64CopyAll: boolean;
}

export type ProcessingStatus = 'idle' | 'processing' | 'done' | 'error';

export interface QueuedFile {
  id: string;
  filePath: string;
  name: string;
  extension: string;
  size: number;
  isImage: boolean;
  status: ProcessingStatus;
  
  // Compression results
  originalSize?: number;
  compressedSize?: number;
  percentageChange?: number;
  outputPath?: string;
  width?: number;
  height?: number;

  // Base64 results
  base64?: string;
  mimeType?: string;
  
  // Error message if any
  error?: string;
}

export type ActiveTab = 'compressor' | 'base64' | 'combined' | 'settings';
