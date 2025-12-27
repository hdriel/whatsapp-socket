import React, { useState } from 'react';
import {
    TextField,
    Button,
    Paper,
    Typography,
    Box,
    CircularProgress,
    Alert,
    IconButton,
    List,
    ListItem,
    ListItemText,
} from '@mui/material';
import { List as ListIcon, ControlPoint as Plus, Delete as Trash2 } from '@mui/icons-material';
import { API_ENDPOINTS, makeApiCall } from '../utils/api';

export const MultipleInputsSection: React.FC<{
    messageToPhone: string;
    setMessageToPhone: (phone: string) => void;
}> = ({ messageToPhone: phoneTo, setMessageToPhone: setPhoneTo }) => {
    const [currentInput, setCurrentInput] = useState('');
    const [message, setMessage] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [inputs, setInputs] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleAddInput = () => {
        if (currentInput.trim()) {
            setInputs((prev) => [...prev, currentInput.trim()]);
            setCurrentInput('');
            setError('');
        }
    };

    const handleRemoveInput = (index: number) => {
        setInputs((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!phoneTo.trim()) {
            setError('Please enter a phone number');
            return;
        }

        if (inputs.length === 0) {
            setError('Please add at least one input');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                phoneTo: phoneTo.trim(),
                message: message.trim(),
                subtitle: subtitle.trim(),
                inputs: inputs,
            };

            await makeApiCall(API_ENDPOINTS.SEND_MULTIPLE_INPUTS, payload);
            setSuccess('Multiple inputs sent successfully!');
            setInputs([]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send inputs');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleAddInput();
        }
    };

    return (
        <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ListIcon fontSize="medium" />
                Multiple Inputs
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
                    placeholder="Enter your title message"
                    multiline
                    rows={1}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={loading}
                    sx={{ mb: 2 }}
                />

                <TextField
                    fullWidth
                    label="Subtitle"
                    placeholder="Enter your footer here"
                    multiline
                    rows={1}
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    disabled={loading}
                    sx={{ mb: 2 }}
                />

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                        fullWidth
                        label="Add Input"
                        placeholder="Enter a value and press Enter or click Add"
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={loading}
                    />
                    <Button
                        variant="outlined"
                        onClick={handleAddInput}
                        disabled={loading || !currentInput.trim()}
                        sx={{ minWidth: '100px' }}
                    >
                        <Plus fontSize="small" />
                    </Button>
                </Box>

                {inputs.length > 0 && (
                    <Paper variant="outlined" sx={{ mb: 2, maxHeight: '300px', overflow: 'auto' }}>
                        <List>
                            {inputs.map((input, index) => (
                                <ListItem
                                    key={index}
                                    secondaryAction={
                                        <IconButton
                                            edge="end"
                                            onClick={() => handleRemoveInput(index)}
                                            disabled={loading}
                                        >
                                            <Trash2 fontSize="small" />
                                        </IconButton>
                                    }
                                >
                                    <ListItemText primary={input} secondary={`Item ${index + 1}`} />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                )}

                <Button variant="contained" onClick={handleSubmit} disabled={loading || inputs.length === 0} fullWidth>
                    {loading ? <CircularProgress size={24} /> : `Submit ${inputs.length} Input(s)`}
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
