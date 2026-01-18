import { GenerateQRSection } from './GenerateQRSection';
import { FileUploadSection } from './FileUploadSection';
import { ImageUploadSection } from './ImageUploadSection';
import { StickerUploadSection } from './StickerUploadSection';
import { AudioRecordSection } from './AudioRecordSection';
import { VideoUploadSection } from './VideoUploadSection';
import { MessageActionsSection } from './MessageActionsSection';
import { MessageSection } from './MessageSection';
import { MultipleInputsSection } from './MultipleInputsSection';
import { LocationSection } from './LocationSection';
import { AWSStreamFileSection } from './AWSStreamFileSection';
import { TabType } from '../../types';

export default [
    { label: 'QR Code', Component: GenerateQRSection, init: true },
    { label: 'AWS File', Component: AWSStreamFileSection, phone: true },
    { label: 'Message', Component: MessageSection, phone: true },
    { label: 'Message Actions', Component: MessageActionsSection, phone: true },
    { label: 'Reply Inputs', Component: MultipleInputsSection, phone: true },
    { label: 'Sticker Upload', Component: StickerUploadSection, phone: true },
    { label: 'Image Upload', Component: ImageUploadSection, phone: true },
    { label: 'Video Upload', Component: VideoUploadSection, phone: true },
    { label: 'Audio Record', Component: AudioRecordSection, phone: true },
    { label: 'File Upload', Component: FileUploadSection, phone: true },
    { label: 'Location', Component: LocationSection, phone: true },
] as TabType[];
