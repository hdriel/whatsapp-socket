export const encodeFile = (file: File): File => new File([file], encodeURIComponent(file.name), { type: file.type });
