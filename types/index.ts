export interface Widget {
  dataCode: string;
  uiCode: string;
  parameters: any[];
  previewData: any;
  userConfig?: Record<string, string>;
  signature?: string;
  timestamp?: number;
}

export interface Pin {
  id: string;
  title: string;
  tagline: string;
  creator?: string;
  lastUpdated: string;
  version?: string; // IPFS CID of the current version
  widget?: {
    dataCode: string;
    uiCode: string;
    parameters: any[];
    previewData: any;
    userConfig?: Record<string, string>;
    signature?: string;
    timestamp?: number;
  };
}

export interface MiniAppEmbed {
  version: '1';
  imageUrl: string;
  button: {
    title: string;
    action: {
      type: 'launch_miniapp' | 'launch_frame';
      name: string;
      url: string;
      splashImageUrl?: string;
      splashBackgroundColor?: string;
    };
  };
}
