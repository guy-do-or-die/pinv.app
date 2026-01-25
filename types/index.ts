export interface Widget {
  dataCode: string;
  uiCode: string;
  parameters: any[];
  previewData: any;
  userConfig?: Record<string, string>;
  signature?: string;
  timestamp?: number;
  litActionCid?: string;
  encryptedParams?: string | any;
}

export interface Pin {
  id: string;
  title: string;
  tagline: string;
  creator?: string;
  lastUpdated: string;
  version?: string;
  widget?: {
    dataCode: string;
    uiCode: string;
    parameters: any[];
    previewData: any;
    userConfig?: Record<string, string>;
    signature?: string;
    timestamp?: number;
    litActionCid?: string;
    encryptedParams?: string | any;
  };
}