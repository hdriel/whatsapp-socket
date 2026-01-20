import React, { useEffect, useState } from 'react';
import { TextField, Button, Paper, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { Upload } from '@mui/icons-material';
import { InputAutocomplete } from 'mui-simple';
import { API_ENDPOINTS, fetchAwsDirectories, makeApiCall } from '../../utils/api.ts';
import { useAppContext } from '../../AppContext.tsx';

export const AWSStreamFileSection: React.FC = ({}) => {
    const { groupOption } = useAppContext();
    const groupId = groupOption?.value as string;

    const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null);
    const [selectedFileKey, setSelectedFileKey] = useState<string | null>(null);
    const [directoryOptions, setDirectoryOptions] = useState<any>([]);
    const [fileOptions, setFileOptions] = useState<any>([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleDirectoryChange = (event: React.ChangeEvent<HTMLInputElement>, value: string) => {
        event.stopPropagation();
        setSelectedDirectory(value);
        setSelectedFileKey(null);
        setError('');
    };

    const handleFileKeyChange = (event: React.ChangeEvent<HTMLInputElement>, value: string) => {
        event.stopPropagation();
        setSelectedFileKey(value);
        setError('');
    };

    const handleUpload = async () => {
        if (!groupId.trim()) {
            setError('Please select group');
            return;
        }

        if (!selectedFileKey) {
            setError('Please select a file');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const data = { message: message.trim() };

            await makeApiCall(
                API_ENDPOINTS.AWS_FILE.replace(':fileKey', encodeURIComponent(selectedFileKey)) + `?groupId=${groupId}`,
                data
            );
            setSuccess('AWS FileKey send successfully!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload file');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAwsDirectories(selectedDirectory || '').then((result) => {
            const directories = result.directories ?? [];
            selectedDirectory && directories.unshift(selectedDirectory);
            directories.unshift({ id: '', label: '/ (root)' });
            setDirectoryOptions(directories);
            setFileOptions(result.files.map((file: any) => file.Key) ?? []);
        });
    }, [selectedDirectory]);

    return (
        <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Upload fontSize="medium" />
                AWS File
            </Typography>

            <Box sx={{ mt: 2, gap: 2, display: 'flex', flexDirection: 'column' }}>
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
                />

                <InputAutocomplete
                    label={`${directoryOptions.length} Directories`}
                    filterSelectedOptions={false}
                    value={selectedDirectory}
                    options={directoryOptions}
                    onChange={(event, option: any) => {
                        handleDirectoryChange(event, (option?.id ?? option) as string);
                    }}
                />

                <InputAutocomplete
                    label={`${fileOptions.length} Files`}
                    filterSelectedOptions={false}
                    value={selectedFileKey}
                    options={fileOptions}
                    onChange={(event, option: any) => {
                        handleFileKeyChange(event, (option?.id ?? option) as string);
                    }}
                />

                <Button variant="contained" onClick={handleUpload} disabled={loading || !selectedFileKey} fullWidth>
                    {loading ? <CircularProgress size={24} /> : `Send File to group: \"${groupOption?.label}\"`}
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
