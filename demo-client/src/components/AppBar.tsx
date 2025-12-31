import React, { useEffect } from 'react';
import { FiberManualRecord } from '@mui/icons-material';
import {
    AppBar as MuiAppBar,
    Toolbar,
    Typography,
    Tooltip,
    Box,
    ToggleButton,
    ToggleButtonGroup,
    Autocomplete,
    AutocompleteRenderInputParams,
    TextField,
} from '@mui/material';
import { useGroups } from '../hooks/useGroups.ts';
import { getSocket } from '../socket.ts';
import { API_ENDPOINTS, makeApiCall } from '../utils/api.ts';
import { ActionType, useAppContext } from '../AppContext.tsx';

interface AppBarProps {
    serverConnected: boolean;
    wasClientConnectingStatus: 'open' | 'close' | 'connecting';
}

export const AppBar: React.FC<AppBarProps> = ({ wasClientConnectingStatus, serverConnected }) => {
    const { actionType, setActionType, groupOption, setGroupOption } = useAppContext();
    const groups = useGroups();
    const socket = getSocket();

    const color = { open: 'success', connecting: 'warning', close: 'error' }[wasClientConnectingStatus] ?? 'disabled';
    const tooltip = serverConnected
        ? `whatsapp socket connection status: ${wasClientConnectingStatus}`
        : 'Server socket not connected!';

    useEffect(() => {
        if (socket && actionType === ActionType.GROUP) {
            socket?.emit('groups');
        }
    }, [socket, actionType]);

    const onStatusClick = async () => {
        if (!serverConnected) return;
        switch (wasClientConnectingStatus) {
            case 'open':
                await makeApiCall(API_ENDPOINTS.DISCONNECT);
                break;
            case 'close':
                await makeApiCall(API_ENDPOINTS.CONNECT);
                break;
        }
    };

    return (
        <MuiAppBar position="static" elevation={2}>
            <Toolbar sx={{ gap: '0.8em' }}>
                <Tooltip title={tooltip}>
                    <FiberManualRecord stroke="black" color={color as any} onClick={onStatusClick} />
                </Tooltip>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1, alignItems: 'center', color: 'white' }}>
                    Whatsapp Socket Demo
                </Typography>
                {actionType === ActionType.GROUP && (
                    <Autocomplete
                        value={groupOption}
                        onChange={(_event, value) => setGroupOption(value)}
                        options={groups}
                        renderInput={function (params: AutocompleteRenderInputParams): React.ReactNode {
                            return (
                                <TextField
                                    variant="filled"
                                    label="Group"
                                    {...params}
                                    sx={{ padding: 0, margin: 0, minWidth: '400px' }}
                                    color="secondary"
                                />
                            );
                        }}
                    />
                )}
                <Box marginInlineStart="auto">
                    <ToggleButtonGroup
                        color="secondary"
                        exclusive
                        value={actionType}
                        onChange={(_event, value) => setActionType(value)}
                    >
                        <ToggleButton value={ActionType.PRIVATE} sx={{ padding: '0.3em 1em' }}>
                            PRIVATE
                        </ToggleButton>
                        <ToggleButton value={ActionType.GROUP} sx={{ padding: '0.3em 1em' }}>
                            GROUP
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </Toolbar>
        </MuiAppBar>
    );
};
