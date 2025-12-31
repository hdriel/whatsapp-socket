import React, { useState } from 'react';
import {
    TextField,
    Button,
    Paper,
    Typography,
    Box,
    CircularProgress,
    Alert,
    Grid,
    Stack,
    Tooltip,
} from '@mui/material';
import { Chat as MessageSquare } from '@mui/icons-material';
import DoNotTouchIcon from '@mui/icons-material/DoNotTouch';
import { API_ENDPOINTS, makeApiCall } from '../../utils/api.ts';
import { MessageAction } from '../../types';
import { useAppContext } from '../../AppContext.tsx';

export const MessageActionsSection: React.FC = ({}) => {
    const { setMessageToPhone: setPhoneTo, messageToPhone: phoneTo } = useAppContext();
    const [message, setMessage] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [actions, setActions] = useState<MessageAction>({
        copyButton: ['', ''],
        urlLink: ['', ''],
        callTo: ['', ''],
        email: ['', ''],
        reminder: ['', 0],
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleActionChange = (
        field: keyof MessageAction,
        label: string | undefined,
        value: string | number | undefined
    ) => {
        setActions((prev) => ({ ...prev, [field]: [label, value] }));
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
                subtitle: subtitle.trim(),
                actions: {
                    ...(actions.copyButton?.[1].trim() && { copyButton: actions.copyButton }),
                    ...(actions.urlLink?.[1].trim() && { urlLink: actions.urlLink }),
                    ...(actions.callTo?.[1].trim() && { callTo: actions.callTo }),
                    ...(actions.email?.[1].trim() && { email: actions.email }),
                    ...(actions.reminder?.[1] && { reminder: actions.reminder }),
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
                    placeholder="Enter your title message"
                    multiline
                    rows={3}
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
                    rows={3}
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    disabled={loading}
                    sx={{ mb: 2 }}
                />

                <Typography variant="subtitle2" gutterBottom>
                    Optional Actions:
                </Typography>

                <Grid container spacing={2} sx={{ mb: 2 }} width="100%">
                    <Grid flexGrow={1} size={{ xs: 12, sm: 6 }}>
                        <fieldset style={{ borderRadius: '8px' }}>
                            <legend>Copy Button</legend>
                            <Stack spacing={2}>
                                <TextField
                                    fullWidth
                                    label="Label"
                                    placeholder="Text to copy"
                                    value={actions.copyButton?.[0]}
                                    onChange={(e) =>
                                        handleActionChange('copyButton', e.target.value, actions.copyButton?.[1])
                                    }
                                    disabled={loading}
                                />
                                <TextField
                                    fullWidth
                                    label="Value"
                                    placeholder="Text to copy"
                                    value={actions.copyButton?.[1]}
                                    onChange={(e) =>
                                        handleActionChange('copyButton', actions.copyButton?.[0], e.target.value)
                                    }
                                    disabled={loading}
                                />
                            </Stack>
                        </fieldset>
                    </Grid>
                    <Grid flexGrow={1} size={{ xs: 12, sm: 6 }}>
                        <fieldset style={{ borderRadius: '8px' }}>
                            <legend>URL Link</legend>
                            <Stack spacing={2}>
                                <TextField
                                    fullWidth
                                    label="Label"
                                    placeholder="Text of link"
                                    value={actions.urlLink?.[0]}
                                    onChange={(e) =>
                                        handleActionChange('urlLink', e.target.value, actions.urlLink?.[1])
                                    }
                                    disabled={loading}
                                />
                                <TextField
                                    fullWidth
                                    label="Value"
                                    placeholder="https://example.com"
                                    value={actions.urlLink?.[1]}
                                    onChange={(e) =>
                                        handleActionChange('urlLink', actions.urlLink?.[0], e.target.value)
                                    }
                                    disabled={loading}
                                />
                            </Stack>
                        </fieldset>
                    </Grid>
                    <Grid flexGrow={1} size={{ xs: 12, sm: 6 }}>
                        <fieldset style={{ borderRadius: '8px' }}>
                            <legend>Call To</legend>
                            <Stack spacing={2}>
                                <TextField
                                    fullWidth
                                    label="Label"
                                    placeholder="Call Me"
                                    value={actions.callTo?.[0]}
                                    onChange={(e) => handleActionChange('callTo', e.target.value, actions.callTo?.[1])}
                                    disabled={loading}
                                />
                                <TextField
                                    fullWidth
                                    label="Value"
                                    placeholder="+1234567890"
                                    value={actions.callTo?.[1]}
                                    onChange={(e) => handleActionChange('callTo', actions.callTo?.[0], e.target.value)}
                                    disabled={loading}
                                />
                            </Stack>
                        </fieldset>
                    </Grid>
                    <Grid flexGrow={1} size={{ xs: 12, sm: 6 }}>
                        <fieldset style={{ borderRadius: '8px', backgroundColor: 'rgba(119,119,119,0.13)' }}>
                            <legend>
                                <Typography align="center" display="flex" gap="0.4em">
                                    <Tooltip title="This Feature not supported">
                                        <DoNotTouchIcon fontSize="small" />
                                    </Tooltip>
                                    Email To
                                </Typography>
                            </legend>
                            <Stack spacing={2}>
                                <TextField
                                    fullWidth
                                    label="Label"
                                    placeholder="Call Me"
                                    value={actions.email?.[0]}
                                    onChange={(e) => handleActionChange('email', e.target.value, actions.email?.[1])}
                                    disabled={loading}
                                />
                                <TextField
                                    fullWidth
                                    label="Value"
                                    placeholder="email@example.com"
                                    value={actions.email?.[1]}
                                    onChange={(e) => handleActionChange('email', actions.email?.[0], e.target.value)}
                                    disabled={loading}
                                />
                            </Stack>
                        </fieldset>
                    </Grid>

                    <Grid flexGrow={1} size={{ xs: 12, sm: 6 }}>
                        <fieldset style={{ borderRadius: '8px', backgroundColor: 'rgba(119,119,119,0.13)' }}>
                            <legend>
                                <Typography align="center" display="flex" gap="0.4em">
                                    <Tooltip title="This Feature not supported">
                                        <DoNotTouchIcon fontSize="small" />
                                    </Tooltip>
                                    Reminder
                                </Typography>
                            </legend>
                            <Stack spacing={2}>
                                <TextField
                                    fullWidth
                                    label="Name"
                                    placeholder="Event Name"
                                    value={actions.reminder?.[0]}
                                    onChange={(e) =>
                                        handleActionChange('reminder', e.target.value, actions.reminder?.[1])
                                    }
                                    disabled={loading}
                                />
                                <TextField
                                    type="date"
                                    fullWidth
                                    label="Value"
                                    placeholder="Event Time"
                                    value={actions.reminder?.[1]}
                                    onChange={(e) =>
                                        handleActionChange('reminder', actions.reminder?.[0], e.target.value)
                                    }
                                    disabled={loading}
                                />
                            </Stack>
                        </fieldset>
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
