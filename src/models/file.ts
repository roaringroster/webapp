import { Platform } from "quasar";
import { createBase, BaseType } from "./base";

// cordova-plugin-file overwrites native implementations, so we keep our own reference
const File = window.File;
const FileReader = window.FileReader;

type FileListProps = {
  files: FileType[];
};

export type FileList = FileListProps & BaseType;

export type FileType = {
  name: string;
  mimeType: string;
  description: string;
  tags: string[];
  /** creation date when this file object waa added to this app storage */
  createdAt: Date;
  /** timestamp from the original EcmaScript File data, might be older than this object */
  lastModified: number;
  bytes: Uint8Array;
};

export const createFileList = (): FileList => ({
  ...createBase(),
  files: [],
});

export const createFile = ({
  name = "",
  mimeType = "",
  description = "",
  tags = [],
  createdAt = new Date(),
  lastModified = createdAt.getTime(),
  bytes = new Uint8Array(),
}: Partial<FileType> = {}): FileType => ({
  name,
  mimeType,
  description,
  tags,
  createdAt,
  lastModified,
  bytes,
});

export async function createFromFile(file?: File | null) {
  if (file) {
    const { name, lastModified, type: mimeType } = file;
    const bytes = new Uint8Array(await file.arrayBuffer());

    return createFile({ name, mimeType, lastModified, bytes });
  } else {
    return createFile();
  }
}

export function createObjectURL(file?: FileType | null) {
  if (file) {
    return URL.createObjectURL(
      new Blob([file.bytes], { type: file.mimeType })
    );
  } else {
    return "";
  }
}

export function toFile(file: FileType) {
  const { name, bytes, mimeType: type, lastModified } = file;
  return new File([bytes], name, { type, lastModified });
}

export async function toDataURL(file: FileType) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result as string));
    reader.addEventListener("error", error => reject(error));
    reader.readAsDataURL(toFile(file));
  });
}

export const acceptedMimeTypes = [
  "application/pdf",
  "image/*",
];

export function equals(a: FileType, b: FileType) {
  return a.name == b.name
    && a.mimeType == b.mimeType
    && a.lastModified == b.lastModified
    && a.bytes.length == b.bytes.length
    && indexedDB.cmp(Array.from(a.bytes), Array.from(b.bytes)) == 0;
}

export function probablyEquals(a: FileType, b: FileType) {
  return a.name == b.name
    && a.mimeType == b.mimeType
    && a.lastModified == b.lastModified
    && a.bytes.length == b.bytes.length;
}

export async function shareFile(file: FileType) {
  // navigator.share does not work in electron.
  // There is a macOS only ShareMenu class for main process though: https://www.electronjs.org/docs/latest/api/share-menu.
  if (navigator.share) {
    const files = [ toFile(file) ];
    await navigator.share({ files }).catch(console.warn);
  } else if (Platform.is.cordova) {
    const subject = file.name;
    const files = [ await toDataURL(file) ];
    window.plugins?.socialsharing?.shareWithOptions({ subject, files });
  }
}
