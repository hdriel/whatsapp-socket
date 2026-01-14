import React, { useState } from 'react';
import { TextField, Button, Paper, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { Upload } from '@mui/icons-material';
import { API_ENDPOINTS, makeApiCall } from '../../utils/api.ts';
import { useAppContext } from '../../AppContext.tsx';
import { encodeFile } from '../../utils/helper.ts';

export const FileUploadSection: React.FC = ({}) => {
    const { groupOption } = useAppContext();
    const groupId = groupOption?.value as string;

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setError('');
        }
    };

    const handleUpload = async () => {
        if (!groupId.trim()) {
            setError('Please select a group');
            return;
        }

        if (!selectedFile) {
            setError('Please select a file');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const formData = new FormData();
            formData.append('message', message.trim());
            formData.append('file', encodeFile(selectedFile));

            await makeApiCall(API_ENDPOINTS.GROUP_UPLOAD_FILE.replace('{groupId}', groupId), formData);
            setSuccess('File uploaded successfully!');
            setSelectedFile(null);
            (document.getElementById('file-upload-input') as HTMLInputElement).value = '';
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload file');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Upload fontSize="medium" />
                Any File Upload
            </Typography>

            <Box sx={{ mt: 2 }}>
                <TextField
                    fullWidth
                    label="Message"
                    placeholder="Enter your message"
                    multiline
                    rows={1}
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
                    {selectedFile ? selectedFile.name : 'Choose File'}
                    <input id="file-upload-input" type="file" hidden onChange={handleFileChange} />
                </Button>

                <Button variant="contained" onClick={handleUpload} disabled={loading || !selectedFile} fullWidth>
                    {loading ? <CircularProgress size={24} /> : 'Upload File'}
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
