import React, { useEffect, useState } from 'react';
import { TextField, Button, Paper, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { Group } from '@mui/icons-material';
import { API_ENDPOINTS, makeApiCall } from '../../utils/api.ts';
import { useAppContext } from '../../AppContext.tsx';

export const GroupInfoSection: React.FC = ({}) => {
    const { groupOption } = useAppContext();
    const groupId = groupOption?.value as string;

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [addParticipant, setAddParticipant] = useState('');
    const [removeParticipant, setRemoveParticipant] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCreateGroup = async () => {
        setLoading(true);
        setError('');

        try {
            await makeApiCall(API_ENDPOINTS.GROUP_CREATE, {
                name: name.trim(),
                description: description.trim(),
                addParticipants: addParticipant ? [addParticipant.trim()] : [],
            });
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
            await makeApiCall(API_ENDPOINTS.GROUP_INFO.replace('{groupId}', groupId), {
                name: name.trim(),
                description: description.trim(),
                addParticipants: addParticipant ? [addParticipant.trim()] : [],
                removeParticipants: removeParticipant ? [removeParticipant.trim()] : [],
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate QR code');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setName(groupOption?.label ?? '');
        if (!groupId) {
            setAddParticipant('');
            setRemoveParticipant('');
        }
    }, [groupOption]);

    return (
        <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Group fontSize="medium" />
                Group Information
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

                <TextField
                    fullWidth
                    label="Group Description"
                    placeholder="e.g., hello world"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={loading}
                    sx={{ mb: 2 }}
                />

                <TextField
                    fullWidth
                    label="Add Participant By Phone"
                    placeholder="e.g., +1234567890"
                    value={addParticipant}
                    onChange={(e) => setAddParticipant(e.target.value)}
                    disabled={loading}
                    sx={{ mb: 2 }}
                />

                <TextField
                    fullWidth
                    label="Remove Participant By Phone"
                    placeholder="e.g., +1234567890"
                    value={removeParticipant}
                    onChange={(e) => setRemoveParticipant(e.target.value)}
                    disabled={!groupId || loading}
                    sx={{ mb: 2 }}
                />

                <Button
                    variant="contained"
                    onClick={groupOption ? handleUpdateGroup : handleCreateGroup}
                    disabled={loading}
                    fullWidth
                >
                    {loading ? <CircularProgress size={24} /> : groupOption ? 'Update Group' : 'Create Group'}
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
