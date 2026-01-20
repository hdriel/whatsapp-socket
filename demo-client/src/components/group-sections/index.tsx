import { GenerateQRSection } from './GenerateQRSection';
import { FileUploadSection } from './FileUploadSection';
import { ImageUploadSection } from './ImageUploadSection';
import { StickerUploadSection } from './StickerUploadSection';
import { AudioRecordSection } from './AudioRecordSection';
import { VideoUploadSection } from './VideoUploadSection';
import { MessageActionsSection } from './MessageActionsSection';
import { MessageSection } from './MessageSection';
import { MultipleInputsSection } from './MultipleInputsSection';
import { GroupInfoSection } from './GroupInfoSection';
import { LocationSection } from './LocationSection';
import { AWSStreamFileSection } from './AWSStreamFileSection';
import { TabType } from '../../types';

export default [
    { label: 'QR Code', Component: GenerateQRSection, init: true },
    { label: 'Group', Component: GroupInfoSection },
    { label: 'AWS File', Component: AWSStreamFileSection, group: true },
    { label: 'Message', Component: MessageSection, group: true },
    { label: 'Message Actions', Component: MessageActionsSection, group: true },
    { label: 'Reply Inputs', Component: MultipleInputsSection, group: true },
    { label: 'Sticker Upload', Component: StickerUploadSection, group: true },
    { label: 'Image Upload', Component: ImageUploadSection, group: true },
    { label: 'Video Upload', Component: VideoUploadSection, group: true },
    { label: 'Audio Record', Component: AudioRecordSection, group: true },
    { label: 'File Upload', Component: FileUploadSection, group: true },
    { label: 'Location', Component: LocationSection, group: true },
] as TabType[];
