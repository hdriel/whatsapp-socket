# Multi-Feature Communication App

A comprehensive React-based client-side application built with Vite, Material-UI, and TypeScript. This app provides multiple communication features including QR code generation, file uploads, audio recording, video uploads, message actions, and multi-input handling.

## Features

1. **Generate QR Code** - Generate QR codes with phone numbers
2. **File Upload** - Upload any file type
3. **Image Upload** - Upload and preview images
4. **Audio Record & Upload** - Record audio using your microphone or upload audio files
5. **Video Upload** - Upload and preview video files
6. **Message with Actions** - Send messages with interactive actions (copy, URL, call, email)
7. **Multiple Inputs** - Send multiple string inputs as a list

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool and dev server
- **Material-UI (MUI)** - Component library and styling
- **Lucide React** - Icons
- **Web Audio API** - For audio recording functionality

## Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd <project-directory>
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## API Endpoints

This application expects the following API endpoints to be available on your backend server. All endpoints accept `POST` requests.

### 1. Generate QR Code
**Endpoint:** `/api/generate-qr`

**Request Body:**
```json
{
  "phoneTo": "string"
}
```

**Expected Response:**
```json
{
  "peeringPhoneNumber": "050-000-0000",
  "qrCodeImage": "data:image/png;base64,..." // Optional base64 image
}
```

### 2. Upload File
**Endpoint:** `/api/upload-file`

**Request Body:** `FormData`
- `phoneTo` (string) - Phone number
- `file` (File) - The file to upload

**Expected Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully"
}
```

### 3. Upload Image
**Endpoint:** `/api/upload-image`

**Request Body:** `FormData`
- `phoneTo` (string) - Phone number
- `image` (File) - The image file to upload

**Expected Response:**
```json
{
  "success": true,
  "message": "Image uploaded successfully"
}
```

### 4. Upload Audio
**Endpoint:** `/api/upload-audio`

**Request Body:** `FormData`
- `phoneTo` (string) - Phone number
- `audio` (File) - The audio file to upload

**Expected Response:**
```json
{
  "success": true,
  "message": "Audio uploaded successfully"
}
```

### 5. Upload Video
**Endpoint:** `/api/upload-video`

**Request Body:** `FormData`
- `phoneTo` (string) - Phone number
- `video` (File) - The video file to upload

**Expected Response:**
```json
{
  "success": true,
  "message": "Video uploaded successfully"
}
```

### 6. Send Message with Actions
**Endpoint:** `/api/send-message-actions`

**Request Body:**
```json
{
  "phoneTo": "string",
  "message": "string",
  "actions": {
    "copyButton": "string (optional)",
    "urlLink": "string (optional)",
    "callAction": "string (optional)",
    "email": "string (optional)"
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Message sent successfully"
}
```

### 7. Send Multiple Inputs
**Endpoint:** `/api/send-multiple-inputs`

**Request Body:**
```json
{
  "phoneTo": "string",
  "inputs": ["string1", "string2", "string3"]
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Inputs sent successfully"
}
```

## Configuration

To configure the API endpoints, edit the `src/utils/api.ts` file:

```typescript
export const API_ENDPOINTS = {
  GENERATE_QR: '/api/generate-qr',
  UPLOAD_FILE: '/api/upload-file',
  UPLOAD_IMAGE: '/api/upload-image',
  UPLOAD_AUDIO: '/api/upload-audio',
  UPLOAD_VIDEO: '/api/upload-video',
  SEND_MESSAGE_ACTIONS: '/api/send-message-actions',
  SEND_MULTIPLE_INPUTS: '/api/send-multiple-inputs',
};
```

Replace the placeholder paths with your actual backend API endpoints.

## Project Structure

```
src/
├── components/           # React components for each feature
│   ├── AudioRecordSection.tsx
│   ├── FileUploadSection.tsx
│   ├── GenerateQRSection.tsx
│   ├── ImageUploadSection.tsx
│   ├── MessageActionsSection.tsx
│   ├── MultipleInputsSection.tsx
│   └── VideoUploadSection.tsx
├── types/               # TypeScript type definitions
│   └── index.ts
├── utils/               # Utility functions and API calls
│   └── api.ts
├── App.tsx              # Main application component
├── main.tsx             # Application entry point
└── index.css            # Global styles
```

## Features in Detail

### QR Code Generation
- Input a phone number
- Generate QR code via API
- Display peering phone number and QR code image

### File Upload
- Select any file type
- Upload to server with phone number

### Image Upload
- Select image files (jpg, png, etc.)
- Preview image before upload
- Upload to server with phone number

### Audio Record & Upload
- Record audio using device microphone
- Play back recorded audio
- Upload recorded audio or select audio file
- Supports various audio formats

### Video Upload
- Select video files
- Preview video before upload
- Upload to server with phone number

### Message with Actions
- Send text messages
- Include optional actions:
  - Copy button with text
  - URL link
  - Call action with phone number
  - Email address

### Multiple Inputs
- Add multiple text inputs dynamically
- Remove individual inputs
- Submit all inputs as an array

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Audio recording requires HTTPS in production (or localhost in development)
- Microphone permission required for audio recording feature

## Security Notes

- All API calls use fetch with appropriate content types
- FormData is used for file uploads
- No authentication is implemented in the client (implement on your backend)
- CORS must be configured on your backend server

## Customization

### Theme
Edit the Material-UI theme in `src/App.tsx`:
```typescript
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb',
    },
    secondary: {
      main: '#10b981',
    },
  },
});
```

### Styling
- Material-UI components use the `sx` prop for styling
- Global styles can be modified in `src/index.css`
- Tailwind CSS is available for additional utility classes

## Error Handling

The application includes comprehensive error handling:
- Input validation before API calls
- Network error handling
- User-friendly error messages via MUI Alerts
- Loading states for async operations

## License

This project is provided as-is for your use and modification.
