export function isErrorWithResponseCode(
  error: unknown
): error is { response: { code: number; message: string } } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: unknown }).response === 'object' &&
    'code' in (error as { response: { code?: unknown } }).response &&
    'message' in (error as { response: { code?: unknown; message?: unknown } }).response
  );
}
