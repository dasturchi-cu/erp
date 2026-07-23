export interface PilotErrorRecord {
  timestamp: string;
  source: 'backend';
  user: string | null;
  screen: string | null;
  action: string | null;
  error: string;
  stackTrace: string | null;
  requestId?: string;
  statusCode?: number;
  method?: string;
  path?: string;
  code?: string;
}
