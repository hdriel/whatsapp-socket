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
import { useSocketConnection } from './hooks/useSocketConnection';
import { useQR } from './hooks/useQR';
import AppTabs, { TabPanel } from './components';

const theme = createTheme({
    palette: { mode: 'light', primary: { main: '#10b981' }, secondary: { main: '#dea842' } },
    typography: { fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' },
});

function App() {
    const [currentTab, setCurrentTab] = useState(0);
    const [messageToPhone, setMessageToPhone] = useState('');
    const [serverConnected, wasClientConnected] = useSocketConnection();
    const { QRImage } = useQR();

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };

    useEffect(() => {
        if (!serverConnected) setCurrentTab(0);
    }, [serverConnected]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ flexGrow: 1 }}>
                <AppBar position="static" elevation={2}>
                    <Toolbar sx={{ gap: '0.8em' }}>
                        <Tooltip
                            title={
                                serverConnected
                                    ? `whatsapp socket connection status: ${wasClientConnected}`
                                    : 'Server socket not connected!'
                            }
                        >
                            <FiberManualRecord
                                stroke="black"
                                color={
                                    ({ open: 'success', connecting: 'warning', close: 'error' }[wasClientConnected] ??
                                        'disabled') as any
                                }
                            />
                        </Tooltip>
                        <Typography
                            variant="h6"
                            component="div"
                            sx={{ flexGrow: 1, alignItems: 'center', color: 'white' }}
                        >
                            Whatsapp Socket Demo
                        </Typography>
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
                            {AppTabs.map((tab) => (
                                <Tab
                                    key={tab.label}
                                    label={tab.label}
                                    {...(tab.init
                                        ? {
                                              icon: QRImage ? <QrCode2 /> : undefined,
                                              iconPosition: 'start',
                                          }
                                        : { disabled: !serverConnected })}
                                />
                            ))}
                        </Tabs>
                    </Box>

                    {AppTabs.map((tab, index) => {
                        return (
                            <TabPanel key={index} value={currentTab} index={index}>
                                <tab.Component messageToPhone={messageToPhone} setMessageToPhone={setMessageToPhone} />
                            </TabPanel>
                        );
                    })}
                </Container>
            </Box>
        </ThemeProvider>
    );
}

export default App;
