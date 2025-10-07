import { AxiosError } from 'axios';

export type FieldErrors = Record<string, string>;

interface FastAPIErrorItem {
  loc: Array<string | number>;
  msg: string;
  type?: string;
}

interface FastAPIErrorResponse {
  detail?: string | FastAPIErrorItem[];
  message?: string;
}

export function getErrorMessage(err: unknown, fallback = 'An unexpected error occurred'): string {
  const ax = err as AxiosError<FastAPIErrorResponse>;
  const data = ax?.response?.data;

  if (data) {
    if (typeof data.detail === 'string') {
      return data.detail;
    }
    if (typeof data.message === 'string') {
      return data.message;
    }
    if (Array.isArray(data.detail) && data.detail.length) {
      const first = data.detail[0];
      if (first && typeof first.msg === 'string') {
        return first.msg;
      }
    }
  }

  if (ax?.message) return ax.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function getFieldErrors(err: unknown): FieldErrors {
  const fieldErrors: FieldErrors = {};
  const ax = err as AxiosError<FastAPIErrorResponse>;
  const data = ax?.response?.data;
  if (data && Array.isArray(data.detail)) {
    for (const item of data.detail) {
      const loc = Array.isArray(item.loc) ? item.loc.join('.') : '';
      const msg = item.msg || 'Invalid value';
      if (loc) fieldErrors[loc] = msg;
    }
  }
  return fieldErrors;
}
