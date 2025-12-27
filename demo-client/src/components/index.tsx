import React from 'react';
import { Box } from '@mui/material';
import { GenerateQRSection } from './GenerateQRSection';
import { FileUploadSection } from './FileUploadSection';
import { ImageUploadSection } from './ImageUploadSection';
import { StickerUploadSection } from './StickerUploadSection';
import { AudioRecordSection } from './AudioRecordSection';
import { VideoUploadSection } from './VideoUploadSection';
import { MessageActionsSection } from './MessageActionsSection';
import { MessageSection } from './MessageSection';
import { MultipleInputsSection } from './MultipleInputsSection';

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

export default [
    { label: 'QR Code', Component: GenerateQRSection, init: true },
    { label: 'Message', Component: MessageSection },
    { label: 'Message Actions', Component: MessageActionsSection },
    { label: 'Reply Inputs', Component: MultipleInputsSection },
    { label: 'Sticker Upload', Component: StickerUploadSection },
    { label: 'Image Upload', Component: ImageUploadSection },
    { label: 'Video Upload', Component: VideoUploadSection },
    { label: 'Audio Record', Component: AudioRecordSection },
    { label: 'File Upload', Component: FileUploadSection },
];
