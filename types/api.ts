export interface ApiSuccess<T> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: string;
  code: string;
  timestamp: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface AssetSearchResult {
  symbol: string;
  name: string;
  exchDisp: string;
  typeDisp: string;
}
