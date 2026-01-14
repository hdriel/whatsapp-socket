import React, { useState } from 'react';
import { TextField, Button, Paper, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { SmartDisplay as Video } from '@mui/icons-material';
import { API_ENDPOINTS, makeApiCall } from '../../utils/api.ts';
import { useAppContext } from '../../AppContext.tsx';
import { encodeFile } from '../../utils/helper.ts';

export const VideoUploadSection: React.FC = ({}) => {
    const { messageToPhone: phoneTo } = useAppContext();
    const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
    const [message, setMessage] = useState('');
    const [videoPreview, setVideoPreview] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('video/')) {
            setSelectedVideo(file);
            setError('');
            setVideoPreview(URL.createObjectURL(file));
        } else {
            setError('Please select a valid video file');
        }
    };

    const handleUpload = async () => {
        if (!phoneTo.trim()) {
            setError('Please enter a phone number');
            return;
        }

        if (!selectedVideo) {
            setError('Please select a video');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const formData = new FormData();
            formData.append('phoneTo', phoneTo.trim());
            formData.append('message', message.trim());
            formData.append('video', encodeFile(selectedVideo));

            await makeApiCall(API_ENDPOINTS.UPLOAD_VIDEO, formData);
            setSuccess('Video uploaded successfully!');
            setSelectedVideo(null);
            setVideoPreview('');
            (document.getElementById('video-upload-input') as HTMLInputElement).value = '';
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload video');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Video fontSize="medium" />
                Video Upload
            </Typography>

            <Box sx={{ mt: 2 }}>
                <TextField
                    fullWidth
                    label="Message"
                    placeholder="Enter your message"
                    multiline
                    rows={3}
                    value={message}
                    onChange={(e) => {
                        setMessage(e.target.value);
                        setSuccess('');
                        setError('');
                    }}
                    disabled={loading}
                    sx={{ mb: 2 }}
                />

                <Button variant="outlined" component="label" fullWidth sx={{ mb: 2 }} disabled={loading}>
                    {selectedVideo ? selectedVideo.name : 'Choose Video'}
                    <input id="video-upload-input" type="file" accept="video/*" hidden onChange={handleVideoChange} />
                </Button>

                {videoPreview && (
                    <Box sx={{ mb: 2 }}>
                        <video
                            src={videoPreview}
                            controls
                            style={{ width: '100%', maxHeight: '300px', borderRadius: '8px' }}
                        />
                    </Box>
                )}

                <Button variant="contained" onClick={handleUpload} disabled={loading || !selectedVideo} fullWidth>
                    {loading ? <CircularProgress size={24} /> : 'Upload Video'}
                </Button>

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                        {success}
                    </Alert>
                )}
            </Box>
        </Paper>
    );
};
