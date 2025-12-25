import React, { useEffect, useState } from 'react';
import {
    Container,
    Box,
    Tabs,
    Tab,
    AppBar,
    Toolbar,
    Typography,
    ThemeProvider,
    createTheme,
    CssBaseline,
    Tooltip,
} from '@mui/material';
import { FiberManualRecord, QrCode2 } from '@mui/icons-material';
import { GenerateQRSection } from './components/GenerateQRSection';
import { FileUploadSection } from './components/FileUploadSection';
import { ImageUploadSection } from './components/ImageUploadSection';
import { AudioRecordSection } from './components/AudioRecordSection';
import { VideoUploadSection } from './components/VideoUploadSection';
import { MessageActionsSection } from './components/MessageActionsSection';
import { MultipleInputsSection } from './components/MultipleInputsSection';
import { useSocketConnection } from './hooks/useSocketConnection';
import { useQR } from './hooks/useQR.ts';

const theme = createTheme({
    palette: { mode: 'light', primary: { main: '#2563eb' }, secondary: { main: '#10b981' } },
    typography: { fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' },
});

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel = (props: TabPanelProps) => {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
};

function App() {
    const [currentTab, setCurrentTab] = useState(0);
    const connected = useSocketConnection();
    const { QRImage } = useQR();

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };

    useEffect(() => {
        if (!connected) setCurrentTab(0);
    }, [connected]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ flexGrow: 1 }}>
                <AppBar position="static" elevation={2}>
                    <Toolbar>
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1, alignItems: 'center' }}>
                            Multi-Feature Communication App
                        </Typography>
                        <Tooltip title={connected ? 'Connected' : 'Disconnected'}>
                            <FiberManualRecord color={connected ? 'secondary' : 'error'} />
                        </Tooltip>
                    </Toolbar>
                </AppBar>

                <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs
                            value={currentTab}
                            onChange={handleTabChange}
                            variant="scrollable"
                            scrollButtons="auto"
                            aria-label="feature tabs"
                        >
                            <Tab label="QR Code" icon={QRImage ? <QrCode2 /> : undefined} iconPosition="start" />
                            <Tab label="File Upload" disabled={!connected} />
                            <Tab label="Image Upload" disabled={!connected} />
                            <Tab label="Audio Record" disabled={!connected} />
                            <Tab label="Video Upload" disabled={!connected} />
                            <Tab label="Message Actions" disabled={!connected} />
                            <Tab label="Multiple Inputs" disabled={!connected} />
                        </Tabs>
                    </Box>

                    <TabPanel value={currentTab} index={0}>
                        <GenerateQRSection />
                    </TabPanel>
                    <TabPanel value={currentTab} index={1}>
                        <FileUploadSection />
                    </TabPanel>
                    <TabPanel value={currentTab} index={2}>
                        <ImageUploadSection />
                    </TabPanel>
                    <TabPanel value={currentTab} index={3}>
                        <AudioRecordSection />
                    </TabPanel>
                    <TabPanel value={currentTab} index={4}>
                        <VideoUploadSection />
                    </TabPanel>
                    <TabPanel value={currentTab} index={5}>
                        <MessageActionsSection />
                    </TabPanel>
                    <TabPanel value={currentTab} index={6}>
                        <MultipleInputsSection />
                    </TabPanel>
                </Container>
            </Box>
        </ThemeProvider>
    );
}

export default App;
