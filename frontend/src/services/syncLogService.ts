import { AxiosInstance } from 'axios';

export interface SyncLog {
  id: number;
  run_at: string;
  total_synced: number;
  new_products: number;
  updated_products: number;
  inactive_products: number;
  status: string;
  error_message?: string;
}

export interface SyncLogResponse {
  logs: SyncLog[];
  total: number;
  skip: number;
  limit: number;
}

export interface BatchData {
  id: string;
  rows: number;
  results: {
    inserted: number;
    updated: number;
    skipped: number;
    validated: number;
  };
  errorRate: number;
  status: string;
  ts: string;
}

// Function to fetch sync logs from API
export const getSyncLogs = async (api: AxiosInstance, skip: number = 0, limit: number = 50): Promise<SyncLogResponse> => {
  const response = await api.get(`/sync-logs/?skip=${skip}&limit=${limit}`);
  return response.data;
};

// Function to map backend status to frontend status
const mapStatus = (backendStatus: string): string => {
  switch (backendStatus.toLowerCase()) {
    case 'success':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'partial':
      return 'Partial';
    default:
      return 'Unknown';
  }
};

// Function to convert backend sync logs to frontend batch format
export const convertToBatches = (syncLogs: SyncLog[]): BatchData[] => {
  return syncLogs.map(log => {
    const errorRate = log.total_synced > 0 
      ? ((log.inactive_products || 0) / log.total_synced) * 100 
      : 0;

    return {
      id: `BATCH-${log.id}-${new Date(log.run_at).getTime()}`,
      rows: log.total_synced,
      results: {
        inserted: log.new_products,
        updated: log.updated_products,
        skipped: log.inactive_products || 0,
        validated: 0, // Not available in backend response
      },
      errorRate: Math.round(errorRate * 10) / 10, // Round to 1 decimal
      status: mapStatus(log.status),
      ts: new Date(log.run_at).toLocaleString('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(',', '')
    };
  });
};
