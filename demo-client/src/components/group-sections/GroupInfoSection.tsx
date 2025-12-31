import React, { useState } from 'react';
import { TextField, Button, Paper, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { QrCode } from '@mui/icons-material';
import { API_ENDPOINTS, makeApiCall } from '../../utils/api.ts';
import { useAppContext } from '../../AppContext.tsx';

export const GroupInfoSection: React.FC = ({}) => {
    const { groupOption } = useAppContext();
    const groupId = groupOption?.value as string;

    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCreateGroup = async () => {
        setLoading(true);
        setError('');

        try {
            await makeApiCall(API_ENDPOINTS.GROUP_CREATE, { name: name.trim() });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate QR code');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateGroup = async () => {
        setLoading(true);
        setError('');

        try {
            await makeApiCall(API_ENDPOINTS.GROUP_CREATE.replace('{groupId}', groupId), { name: name.trim() });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate QR code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <QrCode fontSize="medium" />
                Generate QR Code
            </Typography>

            <Box sx={{ mt: 2 }}>
                <TextField
                    fullWidth
                    label="Group Name"
                    placeholder="e.g., best-friend"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    sx={{ mb: 2 }}
                />

                <Button variant="contained" onClick={handleCreateGroup} disabled={loading} fullWidth>
                    {loading ? <CircularProgress size={24} /> : 'Create Group'}
                </Button>

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}
            </Box>
        </Paper>
    );
};
