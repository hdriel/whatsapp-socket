import { GenerateQRSection } from './GenerateQRSection.tsx';
// import { FileUploadSection } from './FileUploadSection.tsx';
// import { ImageUploadSection } from './ImageUploadSection.tsx';
// import { StickerUploadSection } from './StickerUploadSection.tsx';
// import { AudioRecordSection } from './AudioRecordSection.tsx';
// import { VideoUploadSection } from './VideoUploadSection.tsx';
// import { MessageActionsSection } from './MessageActionsSection.tsx';
// import { MessageSection } from './MessageSection.tsx';
// import { MultipleInputsSection } from './MultipleInputsSection.tsx';
import { GroupInfoSection } from './GroupInfoSection.tsx';

export default [
    { label: 'QR Code', Component: GenerateQRSection, init: true },
    { label: 'Group', Component: GroupInfoSection },
    // { label: 'Message', Component: MessageSection },
    // { label: 'Message Actions', Component: MessageActionsSection },
    // { label: 'Reply Inputs', Component: MultipleInputsSection },
    // { label: 'Sticker Upload', Component: StickerUploadSection },
    // { label: 'Image Upload', Component: ImageUploadSection },
    // { label: 'Video Upload', Component: VideoUploadSection },
    // { label: 'Audio Record', Component: AudioRecordSection },
    // { label: 'File Upload', Component: FileUploadSection },
];
