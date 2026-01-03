import React, { useEffect } from 'react';
import { FiberManualRecord } from '@mui/icons-material';
import {
    AppBar as MuiAppBar,
    Autocomplete,
    AutocompleteRenderInputParams,
    Box,
    type SxProps,
    TextField,
    Toolbar,
    Tooltip,
    Typography,
} from '@mui/material';
import { ToggleButtonGroup } from 'mui-simple';
import { useGroups } from '../hooks/useGroups.ts';
import { getSocket } from '../socket.ts';
import { API_ENDPOINTS, makeApiCall } from '../utils/api.ts';
import { ActionType, useAppContext } from '../AppContext.tsx';

interface AppBarProps {
    serverConnected: boolean;
    wasClientConnectingStatus: 'open' | 'close' | 'connecting';
}

const textFieldStyles: SxProps = {
    minWidth: '400px',
    backgroundColor: '#FFFFFF',
    borderRadius: '10px',
};

export const AppBar: React.FC<AppBarProps> = ({ wasClientConnectingStatus, serverConnected }) => {
    const { actionType, setActionType, groupOption, setGroupOption, setMessageToPhone, messageToPhone } =
        useAppContext();
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
                <Typography
                    variant="h6"
                    component="div"
                    sx={{ flexGrow: 1, alignItems: 'center', color: 'white', minWidth: 'max-content' }}
                >
                    Whatsapp Socket Demo
                </Typography>
                <ToggleButtonGroup
                    exclusive
                    value={actionType}
                    onChange={(_event, value) => {
                        if (value !== null) setActionType(value);
                    }}
                    color={'secondary'}
                    data={[
                        { component: 'Person', value: ActionType.PRIVATE },
                        { component: 'Groups', value: ActionType.GROUP },
                    ]}
                />
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',
                        marginRight: '20%',
                    }}
                >
                    {actionType === ActionType.GROUP && (
                        <Autocomplete
                            value={groupOption}
                            onChange={(_event, value) => setGroupOption(value)}
                            options={groups}
                            renderInput={function (params: AutocompleteRenderInputParams): React.ReactNode {
                                return (
                                    <TextField
                                        variant="filled"
                                        label="Message to Group"
                                        {...params}
                                        sx={textFieldStyles}
                                    />
                                );
                            }}
                        />
                    )}
                    {actionType === ActionType.PRIVATE && (
                        <TextField
                            size="small"
                            variant="filled"
                            label="Message to Phone Number"
                            placeholder="e.g., +1234567890"
                            value={messageToPhone}
                            onChange={(e) => setMessageToPhone(e.target.value)}
                            sx={textFieldStyles}
                        />
                    )}
                </Box>
            </Toolbar>
        </MuiAppBar>
    );
};
