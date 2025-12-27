import React, { useState } from 'react';
import { TextField, Button, Paper, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { Chat as MessageSquare } from '@mui/icons-material';
import { API_ENDPOINTS, makeApiCall } from '../utils/api';

export const MessageSection: React.FC<{
    messageToPhone: string;
    setMessageToPhone: (phone: string) => void;
}> = ({ messageToPhone: phoneTo, setMessageToPhone: setPhoneTo }) => {
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async () => {
        if (!phoneTo.trim()) {
            setError('Please enter a phone number');
            return;
        }

        if (!message.trim()) {
            setError('Please enter a message');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                phoneTo: phoneTo.trim(),
                message: message.trim(),
            };

            await makeApiCall(API_ENDPOINTS.SEND_MESSAGE, payload);
            setSuccess('Message with actions sent successfully!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send message');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MessageSquare fontSize="medium" />
                Message with Actions
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

                <Button variant="contained" onClick={handleSubmit} disabled={loading} fullWidth>
                    {loading ? <CircularProgress size={24} /> : 'Send Message'}
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
