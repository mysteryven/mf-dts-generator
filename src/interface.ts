export interface MessagePayload {
    type: 'message';
    content: string;
}
export interface DownloadPayload {
    type: 'download';
    content: string;
}

export interface MFTypeConfig {
    name: string;
    exposes: Record<string, string>;
    targetPaths: string[];
    clientOutDir?: string;
}