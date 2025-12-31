import React, { useEffect, useState } from 'react';
import { Container, Box, Tabs, Tab, ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { QrCode2 } from '@mui/icons-material';
import { useSocketConnection } from './hooks/useSocketConnection';
import { useQR } from './hooks/useQR';
import { TabPanel, privateTabs, groupTabs } from './components/private-sections';
import { AppBar } from './components/AppBar';

const theme = createTheme({
    palette: { mode: 'light', primary: { main: '#0b7853' }, secondary: { main: '#dea842' } },
    typography: { fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' },
});

function App() {
    const [currentTab, setCurrentTab] = useState(0);
    const [messageToPhone, setMessageToPhone] = useState('');
    const [serverConnected, wasClientConnectingStatus] = useSocketConnection();
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
                <AppBar serverConnected={serverConnected} wasClientConnectingStatus={wasClientConnectingStatus} />

                <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs
                            value={currentTab}
                            onChange={handleTabChange}
                            variant="scrollable"
                            scrollButtons="auto"
                            aria-label="feature tabs"
                        >
                            {privateTabs.map((tab) => (
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

                    {privateTabs.map((tab, index) => {
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
