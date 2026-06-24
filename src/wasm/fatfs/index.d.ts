import type { BinarySource, FileSource, FileSystemUsage } from "../shared/types";
export declare const FAT_MOUNT = "/fatfs";
export interface FatFSEntry {
    path: string;
    size: number;
    type: "file" | "dir";
}
export interface FatFSOptions {
    blockSize?: number;
    blockCount?: number;
    formatOnInit?: boolean;
    wasmURL?: string | URL;
}
export interface FatFS {
    list(path?: string): FatFSEntry[];
    readFile(path: string): Uint8Array;
    toImage(): Uint8Array;
    getUsage(): FileSystemUsage;
    format(): void;
    writeFile(path: string, data: FileSource): void;
    deleteFile(path: string): void;
    mkdir(path: string): void;
    rename(oldPath: string, newPath: string): void;
}
export declare class FatFSError extends Error {
    readonly code: number;
    constructor(message: string, code: number);
}
export declare function createFatFSFromImage(image: BinarySource, options?: FatFSOptions): Promise<FatFS>;
export declare function createFatFS(options?: FatFSOptions): Promise<FatFS>;
