import { GenerateQRSection } from './GenerateQRSection.tsx';
import { FileUploadSection } from './FileUploadSection.tsx';
import { ImageUploadSection } from './ImageUploadSection.tsx';
import { StickerUploadSection } from './StickerUploadSection.tsx';
import { AudioRecordSection } from './AudioRecordSection.tsx';
import { VideoUploadSection } from './VideoUploadSection.tsx';
import { MessageActionsSection } from './MessageActionsSection.tsx';
import { MessageSection } from './MessageSection.tsx';
import { MultipleInputsSection } from './MultipleInputsSection.tsx';
import { TabType } from '../../types';

export default [
    { label: 'QR Code', Component: GenerateQRSection, init: true },
    { label: 'Message', Component: MessageSection, phone: true },
    { label: 'Message Actions', Component: MessageActionsSection, phone: true },
    { label: 'Reply Inputs', Component: MultipleInputsSection, phone: true },
    { label: 'Sticker Upload', Component: StickerUploadSection, phone: true },
    { label: 'Image Upload', Component: ImageUploadSection, phone: true },
    { label: 'Video Upload', Component: VideoUploadSection, phone: true },
    { label: 'Audio Record', Component: AudioRecordSection, phone: true },
    { label: 'File Upload', Component: FileUploadSection, phone: true },
] as TabType[];
