import type { FileSource, BinarySource } from "../shared/types";
export declare enum SpiffsErrorCode {
    SPIFFS_OK = 0,
    SPIFFS_ERR_NOT_MOUNTED = -10000,
    SPIFFS_ERR_FULL = -10001,
    SPIFFS_ERR_NOT_FOUND = -10002,
    SPIFFS_ERR_END_OF_OBJECT = -10003,
    SPIFFS_ERR_DELETED = -10004,
    SPIFFS_ERR_NOT_FINALIZED = -10005,
    SPIFFS_ERR_NOT_INDEX = -10006,
    SPIFFS_ERR_OUT_OF_FILE_DESCS = -10007,
    SPIFFS_ERR_FILE_CLOSED = -10008,
    SPIFFS_ERR_FILE_DELETED = -10009,
    SPIFFS_ERR_BAD_DESCRIPTOR = -10010,
    SPIFFS_ERR_IS_INDEX = -10011,
    SPIFFS_ERR_IS_FREE = -10012,
    SPIFFS_ERR_INDEX_SPAN_MISMATCH = -10013,
    SPIFFS_ERR_DATA_SPAN_MISMATCH = -10014,
    SPIFFS_ERR_INDEX_REF_FREE = -10015,
    SPIFFS_ERR_INDEX_REF_LU = -10016,
    SPIFFS_ERR_INDEX_REF_INVALID = -10017,
    SPIFFS_ERR_INDEX_FREE = -10018,
    SPIFFS_ERR_INDEX_LU = -10019,
    SPIFFS_ERR_INDEX_INVALID = -10020,
    SPIFFS_ERR_NOT_WRITABLE = -10021,
    SPIFFS_ERR_NOT_READABLE = -10022,
    SPIFFS_ERR_CONFLICTING_NAME = -10023,
    SPIFFS_ERR_NOT_CONFIGURED = -10024,
    SPIFFS_ERR_NOT_A_FS = -10025,
    SPIFFS_ERR_MOUNTED = -10026,
    SPIFFS_ERR_ERASE_FAIL = -10027,
    SPIFFS_ERR_MAGIC_NOT_POSSIBLE = -10028,
    SPIFFS_ERR_NO_DELETED_BLOCKS = -10029,
    SPIFFS_ERR_FILE_EXISTS = -10030,
    SPIFFS_ERR_NOT_A_FILE = -10031,
    SPIFFS_ERR_RO_NOT_IMPL = -10032,
    SPIFFS_ERR_RO_ABORTED_OPERATION = -10033,
    SPIFFS_ERR_PROBE_TOO_FEW_BLOCKS = -10034,
    SPIFFS_ERR_PROBE_NOT_A_FS = -10035,
    SPIFFS_ERR_NAME_TOO_LONG = -10036,
    SPIFFS_ERR_IX_MAP_UNMAPPED = -10037,
    SPIFFS_ERR_IX_MAP_MAPPED = -10038,
    SPIFFS_ERR_IX_MAP_BAD_RANGE = -10039,
    SPIFFS_ERR_SEEK_BOUNDS = -10040,
    SPIFFS_ERR_INTERNAL = -10050,
    SPIFFS_ERR_TEST = -10100
}
export declare const SpiffsErrorMessages: Record<SpiffsErrorCode, string>;
export interface SpiffsEntry {
    name: string;
    size: number;
    type: "file" | "dir";
}
export interface SpiffsUsage {
    capacityBytes: number;
    usedBytes: number;
    freeBytes: number;
}
export interface SpiffsOptions {
    wasmURL?: string | URL;
    pageSize?: number;
    blockSize?: number;
    blockCount?: number;
    fdCount?: number;
    cachePages?: number;
    formatOnInit?: boolean;
}
export interface Spiffs {
    list(): Promise<SpiffsEntry[]>;
    read(name: string): Promise<Uint8Array>;
    write(name: string, data: FileSource): Promise<void>;
    remove(name: string): Promise<void>;
    format(): Promise<void>;
    toImage(): Promise<Uint8Array>;
    getUsage(): Promise<SpiffsUsage>;
    canFit?(name: string, dataLength: number): boolean;
}
export declare class SpiffsError extends Error {
    readonly code: number;
    readonly description: string;
    constructor(message: string, code: number);
    static descriptionForCode(code: number): string;
}
export declare function createSpiffs(options?: SpiffsOptions): Promise<Spiffs>;
export declare function createSpiffsFromImage(image: BinarySource, options?: SpiffsOptions): Promise<Spiffs>;
