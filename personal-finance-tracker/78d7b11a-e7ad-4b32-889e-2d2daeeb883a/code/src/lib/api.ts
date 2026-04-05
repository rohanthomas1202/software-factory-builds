class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(endpoint, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options?.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // If response is not JSON, use default error message
    }
    throw new APIError(errorMessage, response.status);
  }

  const data = await response.json();
  return data;
}

export { APIError };