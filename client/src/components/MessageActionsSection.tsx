import { useState } from 'react';
import { TextField, Button, Paper, Typography, Box, CircularProgress, Alert, Grid } from '@mui/material';
import { Chat as MessageSquare } from '@mui/icons-material';
import { API_ENDPOINTS, makeApiCall } from '../utils/api';
import { MessageAction } from '../types';

export const MessageActionsSection = () => {
    const [phoneTo, setPhoneTo] = useState('');
    const [message, setMessage] = useState('');
    const [actions, setActions] = useState<MessageAction>({
        copyButton: '',
        urlLink: '',
        callAction: '',
        email: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleActionChange = (field: keyof MessageAction, value: string) => {
        setActions((prev) => ({ ...prev, [field]: value }));
    };

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
                actions: {
                    ...(actions.copyButton && { copyButton: actions.copyButton }),
                    ...(actions.urlLink && { urlLink: actions.urlLink }),
                    ...(actions.callAction && { callAction: actions.callAction }),
                    ...(actions.email && { email: actions.email }),
                },
            };

            await makeApiCall(API_ENDPOINTS.SEND_MESSAGE_ACTIONS, payload);
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
                <MessageSquare fontSize="large" />
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
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={loading}
                    sx={{ mb: 2 }}
                />

                <Typography variant="subtitle2" gutterBottom>
                    Optional Actions:
                </Typography>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Copy Button Value"
                            placeholder="Text to copy"
                            value={actions.copyButton}
                            onChange={(e) => handleActionChange('copyButton', e.target.value)}
                            disabled={loading}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="URL Link"
                            placeholder="https://example.com"
                            value={actions.urlLink}
                            onChange={(e) => handleActionChange('urlLink', e.target.value)}
                            disabled={loading}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Call Action"
                            placeholder="+1234567890"
                            value={actions.callAction}
                            onChange={(e) => handleActionChange('callAction', e.target.value)}
                            disabled={loading}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Email"
                            placeholder="email@example.com"
                            value={actions.email}
                            onChange={(e) => handleActionChange('email', e.target.value)}
                            disabled={loading}
                        />
                    </Grid>
                </Grid>

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
