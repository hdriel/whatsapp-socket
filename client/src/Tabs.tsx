import React from 'react';
import { Box } from '@mui/material';
import { GenerateQRSection } from './components/GenerateQRSection';
import { FileUploadSection } from './components/FileUploadSection';
import { ImageUploadSection } from './components/ImageUploadSection';
import { AudioRecordSection } from './components/AudioRecordSection';
import { VideoUploadSection } from './components/VideoUploadSection';
import { MessageActionsSection } from './components/MessageActionsSection';
import { MessageSection } from './components/MessageSection';
import { MultipleInputsSection } from './components/MultipleInputsSection';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

export const TabPanel = (props: TabPanelProps) => {
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

export const AppTabs = [
    { label: 'QR Code', Component: GenerateQRSection, init: true },
    { label: 'Message', Component: MessageSection },
    { label: 'Message Actions', Component: MessageActionsSection },
    { label: 'Reply Inputs', Component: MultipleInputsSection },
    { label: 'Image Upload', Component: ImageUploadSection },
    { label: 'Video Upload', Component: VideoUploadSection },
    { label: 'Audio Record', Component: AudioRecordSection },
    { label: 'File Upload', Component: FileUploadSection },
];
