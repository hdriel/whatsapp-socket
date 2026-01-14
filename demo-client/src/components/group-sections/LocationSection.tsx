import React, { useState } from 'react';
import { Button, Paper, Typography, Box, CircularProgress, Alert, TextField } from '@mui/material';
import { LocationCity, GpsFixed } from '@mui/icons-material';
import { API_ENDPOINTS, makeApiCall } from '../../utils/api';
import { useAppContext } from '../../AppContext';
import { getCurrentLocation } from '../../utils/helper';

export const LocationSection: React.FC = ({}) => {
    const { groupOption } = useAppContext();
    const groupId = groupOption?.value as string;
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async () => {
        if (!groupId.trim()) {
            setError('Please select a group');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const position = await getCurrentLocation();
            await makeApiCall(API_ENDPOINTS.GROUP_SEND_LOCATION.replace('{groupId}', groupId), {
                position,
                name: name.trim(),
                address: address.trim(),
            });
            setSuccess('Location send successfully!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send location');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationCity fontSize="medium" />
                Location
            </Typography>

            <Box sx={{ mt: 2 }}>
                <TextField
                    fullWidth
                    label="Name"
                    placeholder="Enter your title name"
                    multiline
                    rows={1}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    sx={{ mb: 2 }}
                />

                <TextField
                    fullWidth
                    label="Address"
                    placeholder="Enter your footer here"
                    multiline
                    rows={1}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={loading}
                    sx={{ mb: 2 }}
                />

                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading}
                    fullWidth
                    startIcon={<GpsFixed fontSize="small" />}
                >
                    {loading ? <CircularProgress size={24} /> : 'Send Your Location'}
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
