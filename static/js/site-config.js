/**
 * Site Configuration Loader
 * Fetches site configuration from API and updates header elements
 */
(function() {
  'use strict';

  // Determine API base URL
  const getApiBaseUrl = () => {
    // Try to get from window.config if available (dashboard)
    if (window.DashboardApp && window.DashboardApp.config && window.DashboardApp.config.apiBaseUrl) {
      return window.DashboardApp.config.apiBaseUrl;
    }
    // Try to get from global config
    if (window.config && window.config.apiBaseUrl) {
      return window.config.apiBaseUrl;
    }
    // Default to same origin
    return '';
  };

  /**
   * Fetch site configuration from API
   */
  const fetchSiteConfig = async () => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/site-config/active/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        console.warn('[SiteConfig] Failed to fetch site configuration:', response.status);
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[SiteConfig] Error fetching site configuration:', error);
      return null;
    }
  };

  /**
   * Update header with site configuration data
   */
  const updateHeader = (config) => {
    if (!config) return;

    // Update logo in navbar
    const logoImg = document.getElementById('site-logo') || document.querySelector('.navbar-brand img');
    if (logoImg && config.logo) {
      // Store original computed styles before changing src
      const originalStyles = {
        width: logoImg.style.width || window.getComputedStyle(logoImg).width,
        height: logoImg.style.height || window.getComputedStyle(logoImg).height,
        maxWidth: logoImg.style.maxWidth || window.getComputedStyle(logoImg).maxWidth,
        maxHeight: logoImg.style.maxHeight || window.getComputedStyle(logoImg).maxHeight,
        objectFit: logoImg.style.objectFit || window.getComputedStyle(logoImg).objectFit
      };
      
      logoImg.src = config.logo;
      logoImg.alt = config.logo_alt_text || 'Site Logo';
      
      // Apply consistent sizing to match fallback logo
      logoImg.style.width = originalStyles.width || '100%';
      logoImg.style.height = originalStyles.height || 'auto';
      logoImg.style.maxWidth = originalStyles.maxWidth || '200px';
      logoImg.style.maxHeight = originalStyles.maxHeight || 'auto';
      logoImg.style.objectFit = originalStyles.objectFit || 'contain';
    }

    // Update location/address
    const locationLink = document.getElementById('header-location');
    if (locationLink && config.address) {
      // Remove existing text nodes and add new one
      Array.from(locationLink.childNodes).forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          node.remove();
        }
      });
      const icon = locationLink.querySelector('.ti-location-pin');
      if (icon) {
        locationLink.insertBefore(document.createTextNode(config.address), icon.nextSibling);
      } else {
        locationLink.appendChild(document.createTextNode(config.address));
      }
    }

    // Update phone number
    const phoneLink = document.getElementById('header-phone');
    if (phoneLink && config.phone) {
      Array.from(phoneLink.childNodes).forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          node.remove();
        }
      });
      const icon = phoneLink.querySelector('.ti-mobile');
      if (icon) {
        phoneLink.insertBefore(document.createTextNode(config.phone), icon.nextSibling);
      } else {
        phoneLink.appendChild(document.createTextNode(config.phone));
      }
    }

    // Update business hours
    const hoursLink = document.getElementById('header-hours');
    if (hoursLink && config.business_hours) {
      Array.from(hoursLink.childNodes).forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          node.remove();
        }
      });
      const icon = hoursLink.querySelector('.ti-time');
      if (icon) {
        hoursLink.insertBefore(document.createTextNode(config.business_hours), icon.nextSibling);
      } else {
        hoursLink.appendChild(document.createTextNode(config.business_hours));
      }
    }

    // Update social media links
    if (config.facebook_url) {
      const facebookLink = document.querySelector('.social-icons-subnav a[href="#"]');
      if (facebookLink && facebookLink.querySelector('.ti-facebook')) {
        facebookLink.href = config.facebook_url;
        facebookLink.target = '_blank';
        facebookLink.rel = 'noopener noreferrer';
      }
    }
    if (config.linkedin_url) {
      const linkedinLinks = document.querySelectorAll('.social-icons-subnav a');
      linkedinLinks.forEach(link => {
        if (link.querySelector('.ti-linkedin')) {
          link.href = config.linkedin_url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
        }
      });
    }
    if (config.x_url || config.instagram_url) {
      const twitterLinks = document.querySelectorAll('.social-icons-subnav a');
      twitterLinks.forEach(link => {
        const twitterIcon = link.querySelector('.ti-twitter');
        const instagramIcon = link.querySelector('.ti-dribbble'); // Using dribbble icon for instagram
        if (twitterIcon && config.x_url) {
          link.href = config.x_url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
        } else if (instagramIcon && config.instagram_url) {
          link.href = config.instagram_url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
        }
      });
    }
  };

  /**
   * Initialize site configuration loader
   */
  const init = async () => {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', async () => {
        const config = await fetchSiteConfig();
        updateHeader(config);
      });
    } else {
      // DOM is already ready
      const config = await fetchSiteConfig();
      updateHeader(config);
    }
  };

  // Auto-initialize
  init();

  // Export for manual use if needed
  window.SiteConfig = {
    fetch: fetchSiteConfig,
    update: updateHeader,
    init: init
  };
})();

