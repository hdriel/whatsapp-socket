import React, { useState, useRef } from 'react';
import { Button, Paper, Typography, Box, CircularProgress, Alert, ButtonGroup } from '@mui/material';
import { Mic, Square, PlayCircle as Play, Upload } from '@mui/icons-material';
import { API_ENDPOINTS, makeApiCall } from '../../utils/api.ts';
import { useAppContext } from '../../AppContext.tsx';

export const AudioRecordSection: React.FC = ({}) => {
    const { messageToPhone: phoneTo } = useAppContext();
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setError('');
        } catch (err) {
            setError('Failed to access microphone. Please grant permission.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const playAudio = () => {
        if (audioUrl) {
            const audio = new Audio(audioUrl);
            audio.play();
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setAudioBlob(null);
            setAudioUrl('');
            setError('');
        }
    };

    const handleUpload = async () => {
        if (!phoneTo.trim()) {
            setError('Please enter a phone number');
            return;
        }

        const fileToUpload =
            selectedFile || (audioBlob ? new File([audioBlob], 'recording.webm', { type: 'audio/webm' }) : null);

        if (!fileToUpload) {
            setError('Please record audio or select an audio file');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const formData = new FormData();
            formData.append('phoneTo', phoneTo.trim());
            formData.append('audio', fileToUpload);

            await makeApiCall(API_ENDPOINTS.UPLOAD_AUDIO, formData);
            setSuccess('Audio uploaded successfully!');
            setAudioBlob(null);
            setAudioUrl('');
            setSelectedFile(null);
            (document.getElementById('audio-upload-input') as HTMLInputElement).value = '';
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload audio');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Mic fontSize="medium" />
                Audio Record & Upload
            </Typography>

            <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                    Record Audio:
                </Typography>
                <ButtonGroup fullWidth sx={{ mb: 2 }}>
                    <Button
                        variant={isRecording ? 'contained' : 'outlined'}
                        onClick={startRecording}
                        disabled={isRecording || loading}
                        startIcon={<Mic fontSize="small" />}
                    >
                        Start Recording
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={stopRecording}
                        disabled={!isRecording || loading}
                        startIcon={<Square fontSize="small" />}
                    >
                        Stop
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={playAudio}
                        disabled={!audioUrl || loading}
                        startIcon={<Play fontSize="small" />}
                    >
                        Play
                    </Button>
                </ButtonGroup>

                <Typography variant="subtitle2" gutterBottom>
                    Or Upload Audio File:
                </Typography>
                <Button variant="outlined" component="label" fullWidth sx={{ mb: 2 }} disabled={loading || isRecording}>
                    {selectedFile ? selectedFile.name : 'Choose Audio File'}
                    <input id="audio-upload-input" type="file" accept="audio/*" hidden onChange={handleFileChange} />
                </Button>

                <Button
                    variant="contained"
                    onClick={handleUpload}
                    disabled={loading || isRecording || (!audioBlob && !selectedFile)}
                    fullWidth
                    startIcon={<Upload fontSize="small" />}
                >
                    {loading ? <CircularProgress size={24} /> : 'Upload Audio'}
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
