import { useState } from 'react';
import { TextField, Button, Paper, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { QrCode } from '@mui/icons-material';
import { API_ENDPOINTS, makeApiCall } from '../utils/api';
import { useQR } from '../hooks/useQR.ts';

export const GenerateQRSection = () => {
    const [phoneTo, setPhoneTo] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { QRImage, QRCode } = useQR();

    const handleGenerateQR = async () => {
        if (!phoneTo.trim()) {
            setError('Please enter a phone number');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await makeApiCall(API_ENDPOINTS.GENERATE_QR, { phone: phoneTo.trim() });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate QR code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <QrCode fontSize="large" />
                Generate QR Code
            </Typography>

            <Box sx={{ mt: 2 }}>
                <TextField
                    fullWidth
                    label="Phone To"
                    placeholder="e.g., +1234567890"
                    value={phoneTo}
                    onChange={(e) => setPhoneTo(e.target.value)}
                    disabled={loading}
                    sx={{ mb: 2 }}
                />

                <Button variant="contained" onClick={handleGenerateQR} disabled={loading} fullWidth>
                    {loading ? <CircularProgress size={24} /> : 'Generate QR Code'}
                </Button>

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}

                {(QRImage || QRCode) && (
                    <Box sx={{ mt: 3 }}>
                        {QRCode && (
                            <Alert severity="success" sx={{ mb: 2 }}>
                                Peering Phone Number: {QRCode}
                            </Alert>
                        )}
                        {QRImage && (
                            <Box sx={{ textAlign: 'center' }}>
                                <img src={QRImage} alt="QR Code" style={{ maxWidth: '100%', height: 'auto' }} />
                            </Box>
                        )}
                    </Box>
                )}
            </Box>
        </Paper>
    );
};
