/**
 * ============================================
 * BUILDSTATE DASHBOARD - REFACTORED
 * ============================================
 * A secure, modular, and maintainable dashboard application
 * with XSS protection, toast notifications, and robust API handling.
 */

'use strict';

const DashboardApp = (() => {
  // ============================================
  // CONFIGURATION & CONSTANTS
  // ============================================
  const config = {
    // Always talk to the same origin that served the dashboard so that
    // session + CSRF cookies are sent correctly (no localhost/127.0.0.1 mismatch)
    apiBaseUrl: window.location.origin,
    apiTimeout: 30000,
    apiRetryAttempts: 2,
    apiRetryDelay: 1000,
    toastDuration: 4000,
    editorModules: {
      toolbar: [
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'header': [1, 2, 3, false] }],
        ['link', 'image'],
        ['formula'],
        ['clean']
      ],
      modules: {
        formula: true
      }
    }
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  /**
   * Sanitize text to prevent XSS attacks
   */
  const sanitize = (text) => {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  /**
   * Safely set element text content
   */
  const setText = (element, text) => {
    if (!element) return;
    element.textContent = sanitize(text);
  };

  /**
   * Create a DOM element with attributes and text
   */
  const createElement = (tag, attrs = {}, text = '') => {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'className') {
        el.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(el.style, value);
      } else if (key.startsWith('data-')) {
        el.setAttribute(key, value);
      } else {
        el[key] = value;
      }
    });
    if (text) setText(el, text);
    return el;
  };

  /**
   * Format date in readable format
   */
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  // ============================================
  // TOKEN & AUTHENTICATION MANAGEMENT
  // ============================================

  const Auth = (() => {
    const getToken = () => localStorage.getItem('access_token');
    const getRefreshToken = () => localStorage.getItem('refresh_token');
    
    const setTokens = (accessToken, refreshToken) => {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
    };

    const clearTokens = () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    };

    const getAuthHeader = () => {
      const token = getToken();
      return token ? `Bearer ${token}` : '';
    };

    const authHeaders = (additionalHeaders = {}) => {
      const headers = { ...additionalHeaders };
      const token = getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      return headers;
    };

    const refreshAccessToken = async () => {
      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          console.warn('[Auth] No refresh token available');
          Auth.logout();
          return false;
        }

        console.log('[Auth] Attempting to refresh access token...');
        try {
          const endpoint = `${config.apiBaseUrl}/api/token/refresh/`;
          const data = await (window.API && window.API.fetchJSON ? window.API.fetchJSON(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh: refreshToken }), _timeout: config.apiTimeout }) : fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh: refreshToken }) }).then(r => r.json()));
          if (data && data.access) {
            setTokens(data.access, refreshToken);
            console.log('[Auth] Token refreshed successfully');
            return true;
          }
          console.error('[Auth] No access token in refresh response:', data);
          Auth.logout();
          return false;
        } catch (err) {
          console.error('[Auth] Token refresh failed:', err);
          Auth.logout();
          return false;
        }
      } catch (error) {
        console.error('[Auth] Token refresh error:', error);
        Auth.logout();
        return false;
      }
    };

    const requireAuth = async () => {
      // For dashboard pages, Django's @login_required decorator already handles authentication
      // on the backend. If we're on the dashboard page, we can skip JWT token check.
      const isDashboardPage = window.location.pathname === '/dashboard/' || 
                             window.location.pathname.startsWith('/dashboard');
      
      if (isDashboardPage) {
        // Dashboard uses Django session auth, backend already verified user is authenticated
        // Just verify we can make API calls (optional check)
        console.log('[Auth] Dashboard page - using Django session authentication');
        return true;
      }
      
      // For other pages that require JWT tokens
      const token = getToken();
      if (!token) {
        window.location.href = '/login/';
        return false;
      }
      return true;
    };

    const logout = () => {
      // Clear JWT tokens if any
      clearTokens();
      
      // For dashboard (Django session auth), we need to submit a form with CSRF token
      const isDashboardPage = window.location.pathname === '/dashboard/' || 
                             window.location.pathname.startsWith('/dashboard');
      
      if (isDashboardPage) {
        // Get CSRF token from cookie or meta tag
        const getCsrfToken = () => {
          // Try to get from cookie
          const cookies = document.cookie.split(';');
          for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'csrftoken') {
              return decodeURIComponent(value);
            }
          }
          // Try to get from meta tag
          const metaTag = document.querySelector('meta[name="csrf-token"]');
          if (metaTag) {
            return metaTag.getAttribute('content');
          }
          return null;
        };
        
        const csrfToken = getCsrfToken();
        
        if (csrfToken) {
          // Create and submit a form for logout with CSRF token
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = '/logout/';
          form.style.display = 'none';
          
          const csrfInput = document.createElement('input');
          csrfInput.type = 'hidden';
          csrfInput.name = 'csrfmiddlewaretoken';
          csrfInput.value = csrfToken;
          form.appendChild(csrfInput);
          
          document.body.appendChild(form);
          form.submit();
        } else {
          // Fallback: try fetch with credentials (Django will handle CSRF from cookie)
          fetch('/logout/', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          })
          .then((response) => {
            if (response.ok || response.redirected) {
              window.location.href = '/';
            } else {
              // If fetch fails, try direct redirect
              window.location.href = '/logout/';
            }
          })
          .catch(() => {
            // Final fallback: direct redirect (may not work but better than nothing)
            window.location.href = '/logout/';
          });
        }
      } else {
        // For non-dashboard pages, simple redirect
        window.location.href = '/logout/';
      }
    };

    return {
      getToken,
      getRefreshToken,
      setTokens,
      clearTokens,
      getAuthHeader,
      authHeaders,
      refreshAccessToken,
      requireAuth,
      logout
    };
  })();

  // ============================================
  // TOAST NOTIFICATION SYSTEM
  // ============================================

  const Toast = (() => {
    let toastContainer = null;

    const init = () => {
      if (toastContainer) return;
      toastContainer = createElement('div', {
        id: 'toastContainer',
        className: 'toast-container',
        style: {
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: '10000',
          maxWidth: '400px',
          fontFamily: 'Montserrat, sans-serif',
          pointerEvents: 'none'
        }
      });
      document.body.appendChild(toastContainer);
    };

    const show = (message, type = 'info', duration = config.toastDuration) => {
      init();

      const toastId = `toast-${Date.now()}`;
      const toast = createElement('div', {
        id: toastId,
        className: `toast-notification toast-${type}`,
        style: {
          padding: '15px 20px',
          marginBottom: '10px',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          animation: 'slideInRight 0.3s ease-out',
          fontSize: '14px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
          zIndex: '10000',
          pointerEvents: 'auto'
        }
      });

      const bgColors = {
        success: '#4CAF50',
        error: '#f44336',
        info: '#2196F3',
        warning: '#ff9800'
      };

      const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠'
      };

      toast.style.backgroundColor = bgColors[type];
      toast.style.color = '#fff';

      const iconEl = createElement('span', { style: { fontSize: '18px', fontWeight: 'bold' } }, icons[type]);
      const messageEl = createElement('span', {}, message);

      toast.appendChild(iconEl);
      toast.appendChild(messageEl);

      toast.addEventListener('click', () => removeToast(toastId));

      toastContainer.appendChild(toast);

      if (duration > 0) {
        setTimeout(() => removeToast(toastId), duration);
      }

      return toastId;
    };

    const removeToast = (toastId) => {
      const toast = document.getElementById(toastId);
      if (toast) {
        toast.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => toast.remove(), 300);
      }
    };

    return { show, removeToast };
  })();

  // ============================================
  // MODAL MANAGEMENT SYSTEM
  // ============================================

  const Modal = (() => {
    const modals = new Map();

    const create = (name, options = {}) => {
      const {
        title = '',
        content = '',
        buttons = [],
        onClose = null
      } = options;

      const backdrop = createElement('div', {
        className: 'modal-backdrop',
        style: {
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: '1000',
          display: 'none'
        }
      });

      const modalEl = createElement('div', {
        className: 'modal-dialog',
        style: {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          zIndex: '1001',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          display: 'none'
        }
      });

      const header = createElement('div', {
        className: 'modal-header',
        style: {
          padding: '20px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }
      });

      const titleEl = createElement('h5', { style: { margin: '0' } }, title);
      const closeBtn = createElement('button', {
        className: 'modal-close',
        style: {
          background: 'none',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer',
          color: '#999'
        }
      }, '×');

      header.appendChild(titleEl);
      header.appendChild(closeBtn);

      const body = createElement('div', {
        className: 'modal-body',
        style: {
          padding: '20px'
        }
      });

      if (typeof content === 'string') {
        setText(body, content);
      } else if (content instanceof HTMLElement) {
        body.appendChild(content);
      }

      const footer = createElement('div', {
        className: 'modal-footer',
        style: {
          padding: '15px 20px',
          borderTop: '1px solid #eee',
          display: 'flex',
          gap: '10px',
          justifyContent: 'flex-end'
        }
      });

      buttons.forEach(btn => {
        const btnEl = createElement('button', {
          className: `modal-btn modal-btn-${btn.type || 'default'}`,
          style: {
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            backgroundColor: btn.type === 'danger' ? '#f44336' : 
                             btn.type === 'success' ? '#4CAF50' : '#999',
            color: '#fff',
            transition: 'opacity 0.3s'
          }
        }, btn.text);

        btnEl.addEventListener('click', () => {
          if (btn.onClick) btn.onClick();
          close(name);
        });

        footer.appendChild(btnEl);
      });

      modalEl.appendChild(header);
      modalEl.appendChild(body);
      if (buttons.length > 0) modalEl.appendChild(footer);

      const close = () => {
        backdrop.style.display = 'none';
        modalEl.style.display = 'none';
        if (onClose) onClose();
      };

      closeBtn.addEventListener('click', close);
      backdrop.addEventListener('click', close);

      document.body.appendChild(backdrop);
      document.body.appendChild(modalEl);

      modals.set(name, {
        modal: modalEl,
        backdrop: backdrop,
        body: body,
        close: close,
        open: () => {
          backdrop.style.display = 'block';
          modalEl.style.display = 'block';
        }
      });

      return modals.get(name);
    };

    const open = (name) => {
      const modal = modals.get(name);
      if (modal) modal.open();
    };

    const close = (name) => {
      const modal = modals.get(name);
      if (modal) modal.close();
    };

    const updateContent = (name, content) => {
      const modal = modals.get(name);
      if (modal) {
        modal.body.innerHTML = '';
        if (typeof content === 'string') {
          setText(modal.body, content);
        } else if (content instanceof HTMLElement) {
          modal.body.appendChild(content);
        }
      }
    };

    return { create, open, close, updateContent };
  })();

  // ============================================
  // CSRF TOKEN HANDLER
  // ============================================

  const getCsrfToken = () => {
    // Try meta tag first
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (token) return token;

    // Try cookie
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrftoken') return decodeURIComponent(value);
    }
    return null;
  };

  // ============================================
  // API HANDLER WITH ROBUST ERROR HANDLING
  // ============================================

  const API = (() => {
    const call = async (endpoint, options = {}) => {
      const {
        method = 'GET',
        body = null,
        headers = {},
        timeout = config.apiTimeout,
        retries = config.apiRetryAttempts,
        isFormData = false
      } = options;

      let lastError = null;
      let attemptCount = 0;
      let tokenRefreshed = false;

      for (let i = 0; i < retries; i++) {
        try {
          attemptCount++;
          
          // Reconstruct headers on each attempt to get fresh token
          const defaultHeaders = isFormData ? {} : {
            'Content-Type': 'application/json',
            ...Auth.authHeaders()
          };

          if (!isFormData) {
            // JSON requests: merge any custom headers (e.g. extra auth)
            Object.assign(defaultHeaders, headers);
          } else {
            // FormData requests: still send auth header and allow extra headers
            defaultHeaders['Authorization'] = Auth.getAuthHeader();
            Object.assign(defaultHeaders, headers);
          }

          // Add CSRF token for all non-GET requests (JSON + FormData)
          if (method !== 'GET') {
            const csrfToken = getCsrfToken();
            if (csrfToken) {
              defaultHeaders['X-CSRFToken'] = csrfToken;
            }
          }

          console.log(`[API] ${method} ${endpoint} (Attempt ${attemptCount}/${retries})`);

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);

          const response = await fetch(`${config.apiBaseUrl}${endpoint}`, {
            method,
            headers: defaultHeaders,
            body: isFormData ? body : (body ? JSON.stringify(body) : null),
            credentials: 'include',
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.status === 401 && !tokenRefreshed) {
            console.log('[API] 401 Unauthorized - attempting token refresh...');
            const refreshed = await Auth.refreshAccessToken();
            
            if (refreshed) {
              console.log('[API] Token refreshed - retrying request');
              tokenRefreshed = true;
              continue;
            } else {
              throw new Error('Session expired. Please login again.');
            }
          }

          const contentType = response.headers.get('content-type');
          let responseData = {};

          if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
          } else {
            responseData = await response.text();
          }

          if (!response.ok) {
            const errorMessage = responseData?.detail || 
                                responseData?.error || 
                                `HTTP ${response.status}: ${response.statusText}`;
            const error = new Error(errorMessage);
            error.status = response.status;
            error.data = responseData;
            throw error;
          }

          return responseData;
        } catch (error) {
          lastError = error;

          // Check if it's a timeout
          if (error.name === 'AbortError') {
            console.warn(`[API] Timeout on ${method} ${endpoint}`);
            if (i < retries - 1) {
              const delay = Math.min(1000 * Math.pow(2, i), 10000);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
          }

          // Don't retry on auth errors (except 401 with token refresh)
          if (error.status && error.status !== 401) {
            throw error;
          }

          if (i < retries - 1) {
            const delay = Math.min(1000 * Math.pow(2, i), 10000);
            console.warn(`[API] Error (Attempt ${attemptCount}/${retries}) on ${method} ${endpoint}: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      console.error(`[API] FAILED after ${attemptCount} attempts: ${lastError?.message}`);
      throw lastError;
    };

    const get = (endpoint, options = {}) => call(endpoint, { ...options, method: 'GET' });
    const post = (endpoint, body, headers = {}) => call(endpoint, { method: 'POST', body, headers });
    const put = (endpoint, body, headers = {}) => call(endpoint, { method: 'PUT', body, headers });
    const patch = (endpoint, body, options = {}) => call(endpoint, { ...options, method: 'PATCH', body });
    const delete_ = (endpoint, options = {}) => call(endpoint, { ...options, method: 'DELETE' });
    
    /**
     * Upload FormData (files + fields)
     * By default uses POST, but can be overridden with a different HTTP method (e.g. PUT/PATCH)
     */
    const postFormData = (endpoint, formData, headers = {}, method = 'POST') => {
      const csrfToken = getCsrfToken();
      const allHeaders = {
        ...Auth.authHeaders(),
        ...headers
      };
      if (csrfToken) {
        allHeaders['X-CSRFToken'] = csrfToken;
      }
      
      return call(endpoint, {
        method,
        body: formData,
        headers: allHeaders,
        isFormData: true
      });
    };

    return { call, get, post, put, patch, delete: delete_, postFormData };
  })();

  // ============================================
  // QUILL EDITOR MANAGEMENT
  // ============================================

  const Editor = (() => {
    let quillInstances = new Map();

    // Register Quill modules
    const registerModules = () => {
      console.log('[Editor] Registering Quill modules...');
      
      // Register formula (math) module if KaTeX is available
      if (window.katex) {
        try {
          Quill.register('modules/formula', true);
          console.log('[Editor] ✓ Registered formula module (KaTeX available)');
        } catch (e) {
          console.warn('[Editor] Failed to register formula:', e);
        }
      } else {
        console.warn('[Editor] KaTeX library not found - math formulas may not work');
      }
      
      console.log('[Editor] Module registration complete');
    };

    const init = (containerId, content = '') => {
      // Prevent duplicate instances
      if (quillInstances.has(containerId)) {
        console.warn(`[Editor] Reinitializing ${containerId}, destroying previous instance`);
        destroy(containerId);
      }

      const container = document.getElementById(containerId);
      if (!container) {
        console.error(`[Editor] Container not found: ${containerId}`);
        return null;
      }

      try {
        // Register modules on first initialization
        if (quillInstances.size === 0) {
          console.log('[Editor] Registering Quill modules...');
          registerModules();
        }

        console.log(`[Editor] Initializing Quill for ${containerId}...`);
        const quill = new Quill(`#${containerId}`, {
          theme: 'snow',
          modules: config.editorModules.modules,
          placeholder: 'Write your content here...'
        });

        // Set initial content if provided
        if (content && content.trim()) {
          quill.root.innerHTML = content;
          console.debug(`[Editor] Set initial content for ${containerId} (${content.length} chars)`);
        }

        // Verify initialization
        const delta = quill.getContents();
        console.log(`[Editor] ${containerId} initialized successfully. Delta ops: ${delta.ops.length}`);

        quillInstances.set(containerId, quill);
        return quill;
      } catch (error) {
        console.error(`[Editor] Failed to initialize ${containerId}:`, error);
        return null;
      }
    };

    const getContent = (containerId) => {
      const quill = quillInstances.get(containerId);
      if (!quill) return '';
      
      // Get HTML content from the editor
      // Quill properly renders tables, formulas, and all formatting to HTML
      const html = quill.root.innerHTML;
      
      // Log for debugging
      console.debug(`[Editor] getContent('${containerId}') - HTML length: ${html.length}, preview:`, html.substring(0, 100));
      
      return html;
    };

    const hasContent = (containerId) => {
      const quill = quillInstances.get(containerId);
      if (!quill) {
        console.warn(`[Editor] hasContent('${containerId}') - No Quill instance found`);
        return false;
      }
      
      // Get the Delta format (Quill's internal representation)
      const delta = quill.getContents();
      
      // Check if delta has meaningful content
      // Delta is an array of operations; default empty state is [{ insert: '\n' }]
      const hasOps = delta.ops && delta.ops.length > 0;
      if (!hasOps) {
        console.debug(`[Editor] hasContent('${containerId}') - No delta operations`);
        return false;
      }
      
      // Filter out default empty content (just a newline)
      const meaningfulOps = delta.ops.filter(op => {
        if (op.insert === '\n' && Object.keys(op).length === 1) return false; // Just newline
        if (op.insert === '' && Object.keys(op).length === 1) return false; // Empty insert
        return true;
      });
      
      const hasContent = meaningfulOps.length > 0;
      console.debug(`[Editor] hasContent('${containerId}') - Meaningful ops: ${meaningfulOps.length}, result: ${hasContent}`);
      
      return hasContent;
    };

    const setContent = (containerId, content) => {
      const quill = quillInstances.get(containerId);
      if (!quill) {
        console.warn(`[Editor] setContent('${containerId}') - No Quill instance found`);
        return;
      }
      
      // Parse HTML content and set it in the editor
      // Quill will automatically parse tables, formulas, and formatting
      if (content && content.trim()) {
        quill.root.innerHTML = content;
        console.debug(`[Editor] setContent('${containerId}') - Set ${content.length} chars of content`);
      }
    };

    const clear = (containerId) => {
      const quill = quillInstances.get(containerId);
      if (quill) {
        quill.setContents([], 'api');
        console.debug(`[Editor] clear('${containerId}') - Cleared editor`);
      }
    };

    const destroy = (containerId) => {
      const quill = quillInstances.get(containerId);
      if (quill) {
        quill.disable();
        quillInstances.delete(containerId);
      }
    };

    const diagnostics = (containerId) => {
      const quill = quillInstances.get(containerId);
      const info = {
        editor_id: containerId,
        quill_instance_exists: !!quill,
        content_html: quill ? quill.root.innerHTML : 'N/A',
        content_length: quill ? quill.root.innerHTML.length : 0,
        has_content: quill ? DashboardApp.Editor.hasContent(containerId) : false,
      };
      
      if (quill) {
        const delta = quill.getContents();
        info.delta_ops = delta.ops || [];
        info.delta_ops_count = delta.ops ? delta.ops.length : 0;
      }
      
      return info;
    };

    return { init, getContent, hasContent, setContent, clear, destroy, diagnostics };
  })();

  // ============================================
  // INITIALIZATION & PUBLIC API
  // ============================================

  const init = async () => {
    try {
      // Add CSS for toasts and modals
      if (!document.getElementById('dashboardStyles')) {
        const style = createElement('style', {
          id: 'dashboardStyles'
        });
        style.textContent = `
          @keyframes slideInRight {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
          }
          .toast-container { 
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
          }
          .toast-notification {
            padding: 15px 20px;
            margin-bottom: 10px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: slideInRight 0.3s ease-out;
            font-size: 14px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 10px;
            color: white;
          }
          .modal-overlay { 
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 999;
            display: none;
          }
          .modal-dialog { 
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 8px;
            z-index: 1001;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          }
          .modal-header { 
            padding: 20px; 
            border-bottom: 1px solid #eee; 
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .modal-body { 
            padding: 20px; 
          }
          .modal-footer { 
            padding: 15px 20px; 
            border-top: 1px solid #eee; 
            text-align: right;
            display: flex;
            gap: 10px;
            justify-content: flex-end;
          }
          .modal-footer button { 
            margin-left: 8px; 
            padding: 8px 16px;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            color: white;
          }
          .modal-btn-danger { background-color: #f44336; }
          .modal-btn-success { background-color: #4CAF50; }
          .modal-btn-default { background-color: #999; }
        `;
        document.head.appendChild(style);
      }

      // Only require authentication on pages that opt-in by setting
      // <body data-requires-auth="true">. This prevents public pages
      // (login/register) from being forced to redirect when they include
      // the DashboardApp script.
      const requiresAuth = document.body && document.body.dataset && document.body.dataset.requiresAuth === 'true';
      if (requiresAuth) {
        await Auth.requireAuth();
        const userName = localStorage.getItem('user_name') || 'User';
        Toast.show(`Welcome back, ${sanitize(userName)}!`, 'success', 3000);
        console.log('[Dashboard] User authenticated');
      } else {
        console.log('[Dashboard] Running in public mode (no auth required)');
      }

      console.log('[Dashboard] Application initialized successfully');
    } catch (error) {
      console.error('[Dashboard] Initialization failed:', error);
      Toast.show('Failed to initialize dashboard', 'error');
    }
  };

  // Public API
  return {
    config,
    sanitize,
    setText,
    createElement,
    formatDate,
    Auth,
    Toast,
    Modal,
    API,
    Editor,
    init
  };
})();

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  DashboardApp.init();
});
