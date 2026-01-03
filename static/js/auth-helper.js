/**
 * auth-helper.js
 * 
 * Provides utilities for managing JWT tokens and making authenticated API calls.
 * Include this in your templates before other scripts:
 * 
 *   <script src="{% static 'js/auth-helper.js' %}"></script>
 */

(function (window) {
  // Auth helper object
  window.AuthHelper = {
    // Token keys
    ACCESS_TOKEN_KEY: 'access_token',
    REFRESH_TOKEN_KEY: 'refresh_token',
    USERNAME_KEY: 'username',

    /**
     * Check if user is logged in (has valid token)
     */
    isLoggedIn() {
      return !!this.getAccessToken();
    },

    /**
     * Get the stored access token
     */
    getAccessToken() {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    },

    /**
     * Get the stored refresh token
     */
    getRefreshToken() {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    },

    /**
     * Get the logged-in username
     */
    getUsername() {
      return localStorage.getItem(this.USERNAME_KEY);
    },

    /**
     * Store tokens after successful login
     */
    setTokens(accessToken, refreshToken, username) {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
      if (username) {
        localStorage.setItem(this.USERNAME_KEY, username);
      }
    },

    /**
     * Clear tokens (logout)
     */
    clearTokens() {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USERNAME_KEY);
    },

    /**
     * Refresh the access token using the refresh token
     * Returns a promise that resolves to true if successful
     */
    async refreshAccessToken() {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      try {
        const response = await fetch('/api/token/refresh/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem(this.ACCESS_TOKEN_KEY, data.access);
          return true;
        } else {
          // Refresh failed, clear tokens and redirect to login
          this.clearTokens();
          return false;
        }
      } catch (error) {
        console.error('Token refresh error:', error);
        this.clearTokens();
        return false;
      }
    },

    /**
     * Make an authenticated API call with automatic token refresh
     * Usage:
     *   const data = await AuthHelper.apiFetch('/api/endpoint/', { method: 'GET' });
     */
    async apiFetch(url, options = {}) {
      options.headers = options.headers || {};
      
      // Add authorization header if logged in
      const token = this.getAccessToken();
      if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
      }

      let response = await fetch(url, options);

      // If 401 (unauthorized), try to refresh token and retry
      if (response.status === 401 && token) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          options.headers['Authorization'] = `Bearer ${this.getAccessToken()}`;
          response = await fetch(url, options);
        } else {
          // Redirect to login
          window.location.href = '/login.html';
          return null;
        }
      }

      return response;
    },

    /**
     * Logout: clear tokens and redirect to home
     */
    logout() {
      this.clearTokens();
      window.location.href = '/';
    },

    /**
     * Check if user is logged in and redirect to login if not
     * Usage: call at top of pages that require authentication
     */
    requireLogin() {
      if (!this.isLoggedIn()) {
        window.location.href = '/login.html';
      }
    },

    /**
     * Update the header/navbar with login status
     * Look for #auth-status element in your template
     */
    updateAuthStatus() {
      const authStatusEl = document.getElementById('auth-status');
      if (authStatusEl) {
        const username = this.getUsername();
        if (username) {
          authStatusEl.innerHTML = `
            <span>Welcome, <strong>${username}</strong></span>
            <a href="#" onclick="AuthHelper.logout(); return false;" style="margin-left: 10px;">Logout</a>
          `;
        } else {
          authStatusEl.innerHTML = `<a href="/login.html">Login</a> | <a href="/register.html">Register</a>`;
        }
      }
    },
  };

  // Update auth status when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.AuthHelper.updateAuthStatus();
    });
  } else {
    window.AuthHelper.updateAuthStatus();
  }
})(window);
