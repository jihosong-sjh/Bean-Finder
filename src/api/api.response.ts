import type { PaginationMeta } from '../features/beans/bean.search';

export type ApiErrorCode =
  | 'INVALID_QUERY'
  | 'INVALID_BODY'
  | 'NOT_FOUND'
  | 'DUPLICATE_RESOURCE'
  | 'VALIDATION_FAILED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export type ApiErrorDetail = {
  field: string;
  reason: string;
};

export type ApiMeta = {
  request_id: string;
  pagination?: PaginationMeta;
  [key: string]: unknown;
};

export type ApiSuccessBody<TData, TMeta extends ApiMeta = ApiMeta> = {
  data: TData;
  meta: TMeta;
};

export type ApiErrorBody = {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: ApiErrorDetail[];
  };
  meta: {
    request_id: string;
  };
};

export type ApiSuccess<TData, TMeta extends ApiMeta = ApiMeta> = {
  status: number;
  body: ApiSuccessBody<TData, TMeta>;
};

export type ApiFailure = {
  status: number;
  body: ApiErrorBody;
};

export type ApiResult<TData, TMeta extends ApiMeta = ApiMeta> =
  | ApiSuccess<TData, TMeta>
  | ApiFailure;

let requestSequence = 0;

export function createRequestId() {
  requestSequence += 1;
  return `req_${requestSequence.toString().padStart(6, '0')}`;
}

export function apiSuccess<TData>(
  data: TData,
  meta?: Omit<ApiMeta, 'request_id'>,
  status = 200,
): ApiSuccess<TData> {
  return {
    status,
    body: {
      data,
      meta: {
        request_id: createRequestId(),
        ...meta,
      },
    },
  };
}

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: ApiErrorDetail[],
): ApiFailure {
  return {
    status,
    body: {
      error: {
        code,
        message,
        ...(details && details.length > 0 ? { details } : {}),
      },
      meta: {
        request_id: createRequestId(),
      },
    },
  };
}
