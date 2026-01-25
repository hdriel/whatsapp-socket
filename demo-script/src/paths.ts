import { resolve } from 'node:path';
// import { resolve, dirname } from 'node:path';
// import { fileURLToPath } from 'node:url';
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// export const ENV_FILE_PATH = resolve(__dirname, '..', '.env.dev');
export const ENV_FILE_PATH = resolve(__dirname, '..', '.env.local');
export const FILE_AUTH_PATH = resolve(__dirname, '../..', 'authState/my-profile');

export const IMAGE_ASSET_PATH = resolve(__dirname, 'test-assets/test-image.jpg');
export const VIDEO_ASSET_PATH = resolve(__dirname, 'test-assets/test-video.mp4');
export const MP3_ASSET_PATH = resolve(__dirname, 'test-assets/test-audio.mp3');
export const OGG_ASSET_PATH = resolve(__dirname, 'test-assets/test-voice.ogg');
export const DOCUMENT_ASSET_PATH = resolve(__dirname, 'test-assets/test-document.docx');
export const XLSX_ASSET_PATH = resolve(__dirname, 'test-assets/test-spreadsheet.xlsx');
export const THUMBNAIL_ASSET_PATH = resolve(__dirname, 'test-assets/excel-thumbnail.jpg');
export const STICKER_ASSET_PATH = resolve(__dirname, 'test-assets/test-sticker.webp');
