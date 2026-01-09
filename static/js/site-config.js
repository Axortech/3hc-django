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

    // Update logo in footer
    const footerLogoImg = document.getElementById('footer-logo');
    if (footerLogoImg && config.logo) {
      // Store original computed styles before changing src
      const footerOriginalStyles = {
        width: footerLogoImg.style.width || window.getComputedStyle(footerLogoImg).width,
        height: footerLogoImg.style.height || window.getComputedStyle(footerLogoImg).height,
        maxWidth: footerLogoImg.style.maxWidth || window.getComputedStyle(footerLogoImg).maxWidth,
        maxHeight: footerLogoImg.style.maxHeight || window.getComputedStyle(footerLogoImg).maxHeight,
        objectFit: footerLogoImg.style.objectFit || window.getComputedStyle(footerLogoImg).objectFit
      };
      
      footerLogoImg.src = config.logo;
      footerLogoImg.alt = config.logo_alt_text || 'Site Logo';
      
      // Apply consistent sizing to match fallback logo
      footerLogoImg.style.width = footerOriginalStyles.width || '100%';
      footerLogoImg.style.height = footerOriginalStyles.height || 'auto';
      footerLogoImg.style.maxWidth = footerOriginalStyles.maxWidth || '200px';
      footerLogoImg.style.maxHeight = footerOriginalStyles.maxHeight || 'auto';
      footerLogoImg.style.objectFit = footerOriginalStyles.objectFit || 'contain';
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

    // Update social media links in header
    const socialLinks = document.querySelectorAll('.social-icons-subnav a');
    socialLinks.forEach(link => {
      const facebookIcon = link.querySelector('.ti-facebook');
      const linkedinIcon = link.querySelector('.ti-linkedin');
      const twitterIcon = link.querySelector('.ti-twitter');
      const instagramIcon = link.querySelector('.ti-dribbble');
      
      if (facebookIcon && config.facebook_url) {
        link.href = config.facebook_url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      } else if (linkedinIcon && config.linkedin_url) {
        link.href = config.linkedin_url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      } else if (twitterIcon && config.x_url) {
        link.href = config.x_url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      } else if (instagramIcon && config.instagram_url) {
        link.href = config.instagram_url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
    });

    // Update social media links in footer
    const footerSocialLinks = document.querySelectorAll('.subfooter .social-icons a, footer .social-icons a');
    footerSocialLinks.forEach(link => {
      const facebookIcon = link.querySelector('.ti-facebook');
      const linkedinIcon = link.querySelector('.ti-linkedin');
      const twitterIcon = link.querySelector('.ti-twitter');
      const instagramIcon = link.querySelector('.ti-dribbble, .ti-instagram');
      const youtubeIcon = link.querySelector('.ti-youtube');
      
      if (facebookIcon && config.facebook_url) {
        link.href = config.facebook_url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      } else if (linkedinIcon && config.linkedin_url) {
        link.href = config.linkedin_url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      } else if (twitterIcon && config.x_url) {
        link.href = config.x_url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      } else if (instagramIcon && config.instagram_url) {
        link.href = config.instagram_url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      } else if (youtubeIcon && config.youtube_url) {
        link.href = config.youtube_url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
    });

    // Update footer contact information
    const footerAddress = document.querySelector('.subfooter address');
    if (footerAddress) {
      const addressSpans = footerAddress.querySelectorAll('span');
      
      // Update address (first span)
      if (addressSpans[0] && config.address) {
        addressSpans[0].textContent = config.address;
      }
      
      // Update phone (second span)
      if (addressSpans[1] && config.phone) {
        addressSpans[1].innerHTML = `<strong>PHONE:</strong> ${config.phone}`;
      }
      
      // Update email (third span)
      if (addressSpans[2] && config.email) {
        addressSpans[2].innerHTML = `<strong>EMAIL:</strong> <a href="mailto:${config.email}">${config.email}</a>`;
      }
      
      // Update website (fourth span)
      if (addressSpans[3] && config.website) {
        addressSpans[3].innerHTML = `<strong>SITE:</strong> <a href="${config.website}" target="_blank" rel="noopener noreferrer">${config.website}</a>`;
      }
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

