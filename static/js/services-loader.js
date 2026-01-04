/**
 * Services Page Content Loader
 * Fetches services from API and dynamically displays them with category filtering
 */
(function() {
  'use strict';

  // Get API base URL
  const getApiBaseUrl = () => {
    if (window.config && window.config.apiBaseUrl) {
      return window.config.apiBaseUrl;
    }
    return '';
  };

  /**
   * Fetch services from API
   */
  const fetchServices = async (filters = {}) => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      let queryParams = [];
      
      if (filters.status) {
        queryParams.push(`status=${encodeURIComponent(filters.status)}`);
      }
      if (filters.category) {
        queryParams.push(`category=${encodeURIComponent(filters.category)}`);
      }
      if (filters.is_featured !== undefined) {
        queryParams.push(`is_featured=${filters.is_featured}`);
      }
      
      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      
      const response = await fetch(`${apiBaseUrl}/api/services/${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        console.warn('[ServicesLoader] Failed to fetch services:', response.status);
        return null;
      }

      const data = await response.json();
      // Handle paginated response structure
      let servicesData = null;
      if (data.results && Array.isArray(data.results)) {
        servicesData = data.results;
      } else if (Array.isArray(data)) {
        servicesData = data;
      } else {
        servicesData = [data];
      }
      
      console.log('[ServicesLoader] Fetched services:', servicesData);
      return servicesData;
    } catch (error) {
      console.error('[ServicesLoader] Error fetching services:', error);
      return null;
    }
  };

  /**
   * Fetch service categories from API
   */
  const fetchServiceCategories = async () => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/service-categories/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        console.warn('[ServicesLoader] Failed to fetch categories:', response.status);
        return [];
      }

      const data = await response.json();
      const categories = data.results || data;
      console.log('[ServicesLoader] Fetched categories:', categories);
      return Array.isArray(categories) ? categories : [];
    } catch (error) {
      console.error('[ServicesLoader] Error fetching categories:', error);
      return [];
    }
  };

  /**
   * Sanitize text to prevent XSS
   */
  const sanitize = (text) => {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  /**
   * Truncate text to a certain length
   */
  const truncate = (text, maxLength = 150) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  /**
   * Get icon class from service data
   */
  const getServiceIcon = (service) => {
    // Try to extract icon from service data or use default
    if (service.icon) return service.icon;
    
    // Default icons based on common service titles
    const title = service.title.toLowerCase();
    if (title.includes('consult')) return 'fa-building';
    if (title.includes('architect')) return 'fa-pencil';
    if (title.includes('design')) return 'fa-paint-brush';
    if (title.includes('renovat')) return 'fa-wrench';
    if (title.includes('construct')) return 'fa-hard-hat';
    
    return 'fa-cog'; // Default icon
  };

  /**
   * Render service card HTML
   */
  const renderServiceCard = (service, animationDelay = 300) => {
    const imageUrl = service.featured_image || '/static/img/serv.jpg';
    const serviceUrl = `/services/${service.slug || service.id}/`;
    const categoryClass = service.category ? service.category.slug : 'uncategorized';
    const iconClass = getServiceIcon(service);
    const excerpt = truncate(service.excerpt || '', 150);
    
    return `
      <div class="col-md-4 col-sm-6 onStep service-item" 
           data-animation="fadeInUp" 
           data-time="${animationDelay}"
           data-category="${service.category ? service.category.id : ''}" 
           data-status="${service.status}">
        <div class="service-tile">
          <div class="service-tile-image">
            <img alt="${sanitize(service.title)}" src="${imageUrl}" onerror="this.src='/static/img/serv.jpg'">
          </div>
          <div class="service-tile-content">
            <div class="service-tile-icon">
              <i class="fa ${iconClass}"></i>
            </div>
            <h3>${sanitize(service.title)}</h3>
            <p>${excerpt}</p>
            <a class="service-tile-link" href="${serviceUrl}" title="View ${sanitize(service.title)}">
              Learn More <i class="fa fa-arrow-right"></i>
            </a>
          </div>
        </div>
      </div>
    `;
  };

  /**
   * Display services in the grid
   */
  const displayServices = (services, containerId = 'services-grid') => {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('[ServicesLoader] Container not found:', containerId);
      return;
    }

    if (!services || services.length === 0) {
      container.innerHTML = `
        <div class="col-md-12">
          <div style="text-align: center; padding: 60px 20px;">
            <i class="fa fa-folder-open" style="font-size: 64px; color: #ddd; margin-bottom: 20px;"></i>
            <h3 style="color: #999;">No services found</h3>
            <p style="color: #999;">Please check back later for new services.</p>
          </div>
        </div>
      `;
      return;
    }

    const servicesHtml = services.map((service, index) => {
      const delay = 300 + (index * 100); // Stagger animation
      return renderServiceCard(service, delay);
    }).join('');
    
    container.innerHTML = servicesHtml;

    // Re-trigger animations if needed
    if (window.jQuery && typeof window.jQuery.fn.appear === 'function') {
      setTimeout(() => {
        jQuery('.onStep').appear();
      }, 100);
    }
  };

  /**
   * Create category filter buttons
   */
  const createCategoryFilters = (categories, containerId = 'service-category-filters') => {
    const container = document.getElementById(containerId);
    if (!container) {
      console.log('[ServicesLoader] Filter container not found, skipping filters');
      return;
    }

    let filtersHtml = `
      <button class="filter-btn active" data-category="*">All Services</button>
    `;

    categories.forEach((category) => {
      filtersHtml += `
        <button class="filter-btn" data-category="${category.id}">${sanitize(category.name)}</button>
      `;
    });

    container.innerHTML = filtersHtml;

    // Add click handlers for filtering
    container.querySelectorAll('.filter-btn').forEach(button => {
      button.addEventListener('click', function() {
        // Update active state
        container.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');

        // Get filter criteria
        const categoryId = this.getAttribute('data-category');

        // Apply filter
        filterServicesManually(categoryId);
      });
    });
  };

  /**
   * Manual filtering
   */
  const filterServicesManually = (categoryId) => {
    const services = document.querySelectorAll('.service-item');
    
    services.forEach(service => {
      if (categoryId === '*') {
        service.style.display = 'block';
        service.classList.add('onStep');
      } else {
        const serviceCategory = service.getAttribute('data-category');
        if (serviceCategory === categoryId) {
          service.style.display = 'block';
          service.classList.add('onStep');
        } else {
          service.style.display = 'none';
          service.classList.remove('onStep');
        }
      }
    });

    // Re-trigger animations
    if (window.jQuery && typeof window.jQuery.fn.appear === 'function') {
      setTimeout(() => {
        jQuery('.onStep').appear();
      }, 100);
    }
  };

  /**
   * Initialize services page
   */
  const initServicesPage = async () => {
    console.log('[ServicesLoader] Initializing services page...');

    try {
      // Fetch categories first
      const categories = await fetchServiceCategories();
      
      // Create filter buttons if categories exist
      if (categories.length > 0) {
        createCategoryFilters(categories);
      }

      // Fetch and display services
      const services = await fetchServices();
      if (services) {
        displayServices(services);
      }

      console.log('[ServicesLoader] Services page initialized successfully');
    } catch (error) {
      console.error('[ServicesLoader] Error initializing services page:', error);
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initServicesPage);
  } else {
    initServicesPage();
  }

  // Export for manual usage
  window.ServicesLoader = {
    fetchServices,
    fetchServiceCategories,
    displayServices,
    createCategoryFilters,
    init: initServicesPage
  };
})();
