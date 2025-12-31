import { GenerateQRSection } from './GenerateQRSection.tsx';
import { FileUploadSection } from './FileUploadSection.tsx';
import { ImageUploadSection } from './ImageUploadSection.tsx';
import { StickerUploadSection } from './StickerUploadSection.tsx';
import { AudioRecordSection } from './AudioRecordSection.tsx';
import { VideoUploadSection } from './VideoUploadSection.tsx';
import { MessageActionsSection } from './MessageActionsSection.tsx';
import { MessageSection } from './MessageSection.tsx';
import { MultipleInputsSection } from './MultipleInputsSection.tsx';
import { GroupInfoSection } from './GroupInfoSection.tsx';
import { TabType } from '../../types';

export default [
    { label: 'QR Code', Component: GenerateQRSection, init: true },
    { label: 'Group', Component: GroupInfoSection },
    { label: 'Message', Component: MessageSection, group: true },
    { label: 'Message Actions', Component: MessageActionsSection, group: true },
    { label: 'Reply Inputs', Component: MultipleInputsSection, group: true },
    { label: 'Sticker Upload', Component: StickerUploadSection, group: true },
    { label: 'Image Upload', Component: ImageUploadSection, group: true },
    { label: 'Video Upload', Component: VideoUploadSection, group: true },
    { label: 'Audio Record', Component: AudioRecordSection, group: true },
    { label: 'File Upload', Component: FileUploadSection, group: true },
] as TabType[];
