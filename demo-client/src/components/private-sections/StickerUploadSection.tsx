import React, { useState } from 'react';
import { Button, Paper, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { Image } from '@mui/icons-material';
import { API_ENDPOINTS, makeApiCall } from '../../utils/api.ts';
import { useAppContext } from '../../AppContext.tsx';

export const StickerUploadSection: React.FC = ({}) => {
    const { messageToPhone: phoneTo } = useAppContext();
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedImage(file);
            setError('');

            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setError('Please select a valid image file');
        }
    };

    const handleUpload = async () => {
        if (!phoneTo.trim()) {
            setError('Please enter a phone number');
            return;
        }

        if (!selectedImage) {
            setError('Please select an image');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const formData = new FormData();
            formData.append('phoneTo', phoneTo.trim());
            formData.append('sticker', selectedImage);

            await makeApiCall(API_ENDPOINTS.UPLOAD_STICKER, formData);
            setSuccess('Image uploaded successfully!');
            setSelectedImage(null);
            setImagePreview('');
            (document.getElementById('image-upload-input') as HTMLInputElement).value = '';
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload image');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Image fontSize="medium" />
                Image Upload
            </Typography>

            <Box sx={{ mt: 2 }}>
                <Button variant="outlined" component="label" fullWidth sx={{ mb: 2 }} disabled={loading}>
                    {selectedImage ? selectedImage.name : 'Choose Image'}
                    <input id="image-upload-input" type="file" accept="image/*" hidden onChange={handleImageChange} />
                </Button>

                {imagePreview && (
                    <Box sx={{ mb: 2, textAlign: 'center' }}>
                        <img
                            src={imagePreview}
                            alt="Preview"
                            style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
                        />
                    </Box>
                )}

                <Button variant="contained" onClick={handleUpload} disabled={loading || !selectedImage} fullWidth>
                    {loading ? <CircularProgress size={24} /> : 'Upload Image'}
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
