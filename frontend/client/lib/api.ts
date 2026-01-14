// Removed ApiResponse import - using direct API responses per OpenAPI spec

class ApiClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl?: string) {
    // Use environment variable or provided baseUrl, fallback to /api for local development
    this.baseUrl =
      baseUrl ||
      import.meta.env.BASE_API_URL ||
      import.meta.env.VITE_API_BASE_URL || "/api";
    this.authToken = localStorage.getItem("auth_token");
  }

  setAuthToken(token: string) {
    this.authToken = token;
    localStorage.setItem("auth_token", token);
  }

  updateEmail(email: string) {
    const oldToken = atob(this.authToken);
    const oldPassword = oldToken.substring(oldToken.indexOf(":") + 1)
    const newAuthString = `${email}:${oldPassword}`;
    this.setAuthToken(btoa(newAuthString));
  }

  clearAuthToken() {
    this.authToken = null;
    localStorage.removeItem("auth_token");
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.authToken) {
      headers["Authorization"] = `Basic ${this.authToken}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        if (response.status === 401) {
          this.clearAuthToken();
          console.log(window.location.href)
          if (!window.location.href.endsWith("/login")) {
            window.location.href = "/login";
          }
          throw new Error(`Ошибка авторизации`);
        }

        // Try to get error response data
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          // If response is not JSON, try to get text
          try {
            const errorText = await response.text();
            errorData = {
              error: errorText || `HTTP error! status: ${response.status}`,
            };
          } catch (textError) {
            console.error("Failed to parse error response as text:", textError);
            errorData = {
              error: `HTTP error! status: ${response.status}`,
              details: `URL: ${url}, Status: ${response.status} ${response.statusText}`,
            };
          }
        }

        // Create error with response information
        const error = new Error(
          errorData.error || `HTTP error! status: ${response.status}`,
        ) as any;
        error.response = {
          status: response.status,
          data: errorData,
        };
        throw error;
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      console.error("Request URL:", url);
      console.error("Request config:", config);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  async uploadFile<T>(endpoint: string, file: File): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    if (this.authToken) {
      headers["Authorization"] = `Basic ${this.authToken}`;
    }
    // Note: Don't set Content-Type for FormData - browser sets it automatically with boundary

    const config: RequestInit = {
      method: "POST",
      headers,
      body: formData,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        if (response.status === 401) {
          this.clearAuthToken();
          console.log(window.location.href)
          if (!window.location.href.endsWith("/login")) {
            window.location.href = "/login";
          }
          throw new Error(`Ошибка авторизации`);
        }
        if (response.status === 422) {
          const errorText = await response.text();
          throw new Error(errorText || "Unprocessable Entity");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("File upload failed:", error);
      throw error;
    }
  }

  async downloadFile(endpoint: string): Promise<Blob> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {};
    if (this.authToken) {
      headers["Authorization"] = `Basic ${this.authToken}`;
    }

    const config: RequestInit = {
      method: "GET",
      headers,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        if (response.status === 401) {
          this.clearAuthToken();
          console.log(window.location.href)
          if (!window.location.href.endsWith("/login")) {
            window.location.href = "/login";
          }
          throw new Error(`Ошибка авторизации`);
        }
        if (response.status === 422) {
          const errorText = await response.text();
          throw new Error(errorText || "Unprocessable Entity");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error("File download failed:", error);
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
