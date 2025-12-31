import React, { useEffect, useState } from 'react';
import { Box, Container, createTheme, CssBaseline, Tab, Tabs, ThemeProvider } from '@mui/material';
import { QrCode2 } from '@mui/icons-material';
import { useSocketConnection } from './hooks/useSocketConnection';
import { useQR } from './hooks/useQR';
import { groupTabs, privateTabs, TabPanel } from './components';
import { AppBar } from './components/AppBar';
import { ActionType, useAppContext } from './AppContext.tsx';

const theme = createTheme({
    palette: { mode: 'light', primary: { main: '#0b7853' }, secondary: { main: '#dea842' } },
    typography: { fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' },
});

function App() {
    const { actionType, messageToPhone, groupOption } = useAppContext();
    const [currentTab, setCurrentTab] = useState(0);
    const [serverConnected, wasClientConnectingStatus] = useSocketConnection();
    const { QRImage } = useQR();

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };

    useEffect(() => {
        if (!serverConnected) setCurrentTab(0);
    }, [serverConnected]);

    const tabs = actionType === ActionType.GROUP ? groupTabs : privateTabs;
    useEffect(() => {
        const tab = tabs[currentTab];
        const initTab = tabs.findIndex((tab) => tab.init);

        if (!serverConnected || (tab.group && !groupOption) || (tab.phone && !messageToPhone)) {
            setCurrentTab(initTab >= 0 ? initTab : 0);
        }
    }, [groupOption, messageToPhone]);

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
                            {tabs.map((tab) => (
                                <Tab
                                    key={tab.label}
                                    label={tab.label}
                                    {...(tab.init
                                        ? {
                                              icon: QRImage ? <QrCode2 /> : undefined,
                                              iconPosition: 'start',
                                          }
                                        : {
                                              disabled:
                                                  !serverConnected ||
                                                  (tab.group && !groupOption) ||
                                                  (tab.phone && !messageToPhone),
                                          })}
                                />
                            ))}
                        </Tabs>
                    </Box>

                    {tabs.map((tab, index) => {
                        return (
                            <TabPanel key={index} value={currentTab} index={index}>
                                <tab.Component />
                            </TabPanel>
                        );
                    })}
                </Container>
            </Box>
        </ThemeProvider>
    );
}

export default App;
