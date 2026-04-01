const BASE_URL = 'https://api-gateway-iprx.onrender.com';

class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

interface FetchOptions extends RequestInit {
  retry?: boolean;
}

let isRefreshing = false;
let refreshSubscribers: ((error: Error | null) => void)[] = [];

const onRefreshed = (error: Error | null) => {
  refreshSubscribers.forEach((cb) => cb(error));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (cb: (error: Error | null) => void) => {
  refreshSubscribers.push(cb);
};

export const fetchApi = async <T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> => {
  const { retry = true, ...customConfig } = options;
  const headers = new Headers(customConfig.headers);

  // Default to application/json if no body or body isn't FormData
  if (customConfig.body && !(customConfig.body instanceof FormData)) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  const config: RequestInit = {
    ...customConfig,
    headers,
    credentials: 'include', // CRITICAL for handling cookies!
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      // Handle Gateway 401 token expiry
      if (response.status === 401 && retry) {
        return new Promise((resolve, reject) => {
          addRefreshSubscriber(async (error) => {
            if (error) return reject(error);
            try {
              // Retry original request
              const data = await fetchApi<T>(endpoint, { ...options, retry: false });
              resolve(data);
            } catch (retryError) {
              reject(retryError);
            }
          });

          if (!isRefreshing) {
            isRefreshing = true;
            fetch(`${BASE_URL}/api/auth/refresh`, {
              method: 'POST',
              credentials: 'include',
            })
              .then(async (refreshResponse) => {
                if (refreshResponse.ok) {
                  onRefreshed(null);
                } else {
                  // Refresh failed, probably logged out entirely
                  onRefreshed(new Error('Session expired'));
                }
              })
              .catch((err) => {
                onRefreshed(err);
              })
              .finally(() => {
                isRefreshing = false;
              });
          }
        });
      }

      // If it's a 204 or no content on error, just throw standard error
      if (response.status === 204) {
         throw new ApiError(204, 'No Content Error');
      }

      const errorText = await response.text();
      let errorData;
      try {
        errorData = errorText ? JSON.parse(errorText) : null;
      } catch (e) {
        errorData = { message: errorText };
      }
      
      throw new ApiError(
        response.status,
        errorData?.message || response.statusText,
        errorData
      );
    }

    if (response.status === 204) {
      return null as any;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // Handle Network Errors (e.g. backend down)
    throw new Error('Network Error or Backend is unavailable');
  }
};
