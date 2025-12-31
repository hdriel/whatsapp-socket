import React from 'react';
import { Box } from '@mui/material';
import { GenerateQRSection } from './GenerateQRSection.tsx';
import { FileUploadSection } from './FileUploadSection.tsx';
import { ImageUploadSection } from './ImageUploadSection.tsx';
import { StickerUploadSection } from './StickerUploadSection.tsx';
import { AudioRecordSection } from './AudioRecordSection.tsx';
import { VideoUploadSection } from './VideoUploadSection.tsx';
import { MessageActionsSection } from './MessageActionsSection.tsx';
import { MessageSection } from './MessageSection.tsx';
import { MultipleInputsSection } from './MultipleInputsSection.tsx';

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

export const privateTabs = [
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

export const groupTabs = [
    { label: 'QR Code', Component: GenerateQRSection, init: true },
    { label: 'Message', Component: MessageSection },
];
