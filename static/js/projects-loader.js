/**
 * Projects Page Content Loader
 * Fetches projects from API and dynamically displays them with filtering
 */
(function() {
  'use strict';

  // Get API base URL
  const getApiBaseUrl = () => {
    // Try to get from window.config if available
    if (window.config && window.config.apiBaseUrl) {
      return window.config.apiBaseUrl;
    }
    // Default to same origin (empty string means current domain)
    return '';
  };

  /**
   * Fetch projects from API
   */
  const fetchProjects = async (filters = {}) => {
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
      
      const response = await fetch(`${apiBaseUrl}/api/projects/${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        console.warn('[ProjectsLoader] Failed to fetch projects:', response.status);
        return null;
      }

      const data = await response.json();
      // Handle paginated response structure
      let projectsData = null;
      if (data.results && Array.isArray(data.results)) {
        // Paginated response
        projectsData = data.results;
      } else if (Array.isArray(data)) {
        // Direct array response
        projectsData = data;
      } else {
        // Single object response
        projectsData = [data];
      }
      
      console.log('[ProjectsLoader] Fetched projects:', projectsData);
      return projectsData;
    } catch (error) {
      console.error('[ProjectsLoader] Error fetching projects:', error);
      return null;
    }
  };

  /**
   * Fetch project categories from API
   */
  const fetchProjectCategories = async () => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/project-categories/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        console.warn('[ProjectsLoader] Failed to fetch categories:', response.status);
        return [];
      }

      const data = await response.json();
      const categories = data.results || data;
      console.log('[ProjectsLoader] Fetched categories:', categories);
      return Array.isArray(categories) ? categories : [];
    } catch (error) {
      console.error('[ProjectsLoader] Error fetching categories:', error);
      return [];
    }
  };

  /**
   * Render project card HTML
   */
  const renderProjectCard = (project) => {
    const imageUrl = project.cover_image || '/static/img/projects/placeholder.jpg';
    const projectUrl = `/projects/${project.slug || project.id}/`;
    const categoryClass = project.category ? project.category.slug : 'uncategorized';
    
    return `
      <div class="col-md-4 col-xs-12 item ${categoryClass}" data-category="${project.category ? project.category.id : ''}" data-status="${project.status}">
        <div class="projects big-img">
          <a href="${projectUrl}">
            <div class="hovereffect">
              <img alt="${project.title}" class="img-responsive" src="${imageUrl}" onerror="this.src='/static/img/projects/placeholder.jpg'">
              <div class="overlay">
                <h3>${project.title}</h3>
                ${project.category ? `<p>${project.category.name}</p>` : ''}
                <span class="fa fa-arrow-right" aria-hidden="true"></span>
              </div>
            </div>
          </a>
        </div>
      </div>
    `;
  };

  /**
   * Display projects in the grid
   */
  const displayProjects = (projects, containerId = 'projects-wrap') => {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('[ProjectsLoader] Container not found:', containerId);
      return;
    }

    if (!projects || projects.length === 0) {
      container.innerHTML = `
        <div class="col-md-12">
          <div style="text-align: center; padding: 60px 20px;">
            <i class="fa fa-folder-open" style="font-size: 64px; color: #ddd; margin-bottom: 20px;"></i>
            <h3 style="color: #999;">No projects found</h3>
            <p style="color: #999;">Please check back later for new projects.</p>
          </div>
        </div>
      `;
      return;
    }

    const projectsHtml = projects.map(project => renderProjectCard(project)).join('');
    container.innerHTML = projectsHtml;

    // Reinitialize isotope/filtering if available
    if (window.jQuery && typeof jQuery.fn.isotope !== 'undefined') {
      setTimeout(() => {
        jQuery('#projects-wrap').isotope('reloadItems').isotope();
      }, 100);
    }
  };

  /**
   * Create filter buttons from categories
   */
  const createCategoryFilters = (categories, containerId = 'filter-porto') => {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('[ProjectsLoader] Filter container not found:', containerId);
      return;
    }

    let filtersHtml = `
      <li class="filt-projects selected" data-category="*" data-project="*">ALL PROJECTS</li>
      <li class="space">.</li>
    `;

    categories.forEach((category, index) => {
      filtersHtml += `
        <li class="filt-projects" data-category="${category.id}" data-project=".${category.slug}">${category.name.toUpperCase()}</li>
      `;
      
      if (index < categories.length - 1) {
        filtersHtml += '<li class="space">.</li>';
      }
    });

    container.innerHTML = filtersHtml;

    // Add click handlers for filtering
    container.querySelectorAll('.filt-projects').forEach(button => {
      button.addEventListener('click', function() {
        // Update active state
        container.querySelectorAll('.filt-projects').forEach(btn => btn.classList.remove('selected'));
        this.classList.add('selected');

        // Get filter criteria
        const categoryFilter = this.getAttribute('data-category');
        const projectFilter = this.getAttribute('data-project');

        // Apply filter
        if (window.jQuery && typeof jQuery.fn.isotope !== 'undefined') {
          jQuery('#projects-wrap').isotope({ filter: projectFilter });
        } else {
          // Fallback for non-isotope filtering
          filterProjectsManually(categoryFilter);
        }
      });
    });
  };

  /**
   * Manual filtering fallback (if isotope not available)
   */
  const filterProjectsManually = (categoryId) => {
    const projects = document.querySelectorAll('#projects-wrap .item');
    
    projects.forEach(project => {
      if (categoryId === '*') {
        project.style.display = 'block';
      } else {
        const projectCategory = project.getAttribute('data-category');
        project.style.display = projectCategory === categoryId ? 'block' : 'none';
      }
    });
  };

  /**
   * Initialize projects page
   */
  const initProjectsPage = async () => {
    console.log('[ProjectsLoader] Initializing projects page...');

    try {
      // Fetch categories first
      const categories = await fetchProjectCategories();
      
      // Create filter buttons
      if (categories.length > 0) {
        createCategoryFilters(categories);
      }

      // Fetch and display projects
      const projects = await fetchProjects();
      if (projects) {
        displayProjects(projects);
      }

      console.log('[ProjectsLoader] Projects page initialized successfully');
    } catch (error) {
      console.error('[ProjectsLoader] Error initializing projects page:', error);
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProjectsPage);
  } else {
    initProjectsPage();
  }

  // Export for manual usage
  window.ProjectsLoader = {
    fetchProjects,
    fetchProjectCategories,
    displayProjects,
    createCategoryFilters,
    init: initProjectsPage
  };
})();

