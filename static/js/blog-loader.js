/**
 * Blog Page Loader
 * Fetches blog posts and categories from the API and updates the blog page UI.
 */
(function() {
  'use strict';

  // Utility: get API base URL (reuse pattern from about-loader/dashboard)
  const getApiBaseUrl = () => {
    if (window.DashboardApp && window.DashboardApp.config && window.DashboardApp.config.apiBaseUrl) {
      return window.DashboardApp.config.apiBaseUrl;
    }
    if (window.config && window.config.apiBaseUrl) {
      return window.config.apiBaseUrl;
    }
    // Same-origin by default
    return '';
  };

  const PAGE_SIZE = 10;

  const state = {
    page: 1,
    search: '',
    category: ''
  };

  const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const stripHtml = (html) => {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 1).trimEnd() + '…';
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const normalizeListResponse = (data) => {
    if (!data) {
      return { items: [], count: 0 };
    }
    if (Array.isArray(data)) {
      return { items: data, count: data.length };
    }
    if (Array.isArray(data.results)) {
      return { items: data.results, count: typeof data.count === 'number' ? data.count : data.results.length };
    }
    return { items: [], count: 0 };
  };

  const init = () => {
    const blogList = document.getElementById('blog-list');
    if (!blogList) {
      // Not on the blog page
      return;
    }

    const elements = {
      list: blogList,
      pagination: document.getElementById('blog-pagination'),
      loading: document.getElementById('blog-loading'),
      empty: document.getElementById('blog-empty'),
      searchForm: document.getElementById('blog-search-form'),
      searchInput: document.getElementById('search1'),
      tagsContainer: document.getElementById('blog-tags'),
      recentContainer: document.getElementById('recent-posts')
    };

    const apiBaseUrl = getApiBaseUrl();

    const showLoading = (isLoading) => {
      if (elements.loading) {
        elements.loading.style.display = isLoading ? 'block' : 'none';
      }
    };

    const showEmpty = (isEmpty) => {
      if (elements.empty) {
        elements.empty.style.display = isEmpty ? 'block' : 'none';
      }
    };

    const renderPosts = (posts) => {
      if (!elements.list) return;

      if (!posts || posts.length === 0) {
        elements.list.innerHTML = '';
        showEmpty(true);
        return;
      }

      showEmpty(false);

      const html = posts.map((post) => {
        const image =
          post.thumbnail ||
          post.featured_image ||
          '/static/img/blog/cover_bg_1.jpg';
        const altText = post.featured_image_alt || post.title || 'Blog image';
        const author = post.author || 'Admin';
        const dateStr = formatDate(post.published_at || post.created_at);
        const rawExcerpt = post.excerpt || truncateText(stripHtml(post.content || ''), 260);
        const excerpt = escapeHtml(rawExcerpt);

        const detailUrl = `blog-detail.html?slug=${encodeURIComponent(post.slug)}`;

        return `
          <div class="blog-simple">
            <a href="${detailUrl}">
              <img class="img-responsive" src="${image}" alt="${escapeHtml(altText)}">
            </a>
            <div class="blog-text">
              <h3><a href="${detailUrl}">${escapeHtml(post.title || '')}</a></h3>
              <span class="user-post"><i class="ti-user"></i>${escapeHtml(author)}</span>
              ${dateStr ? `<span class="date-post"><i class="ti-calendar"></i>${escapeHtml(dateStr)}</span>` : ''}
              <p>${excerpt}</p>
              <a class="btn-blog" href="${detailUrl}">More Detail</a>
            </div>
          </div>
        `;
      }).join('');

      elements.list.innerHTML = html;
    };

    const renderPagination = (totalCount) => {
      if (!elements.pagination) return;

      const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

      if (totalPages <= 1) {
        elements.pagination.style.display = 'none';
        elements.pagination.innerHTML = '';
        return;
      }

      elements.pagination.style.display = 'block';

      const items = [];

      // Previous
      items.push(`
        <li class="${state.page <= 1 ? 'disabled' : ''}">
          <a href="#" data-page="${state.page - 1}">&laquo;</a>
        </li>
      `);

      for (let p = 1; p <= totalPages; p++) {
        items.push(`
          <li class="${p === state.page ? 'active' : ''}">
            <a href="#" data-page="${p}">${p}</a>
          </li>
        `);
      }

      // Next
      items.push(`
        <li class="${state.page >= totalPages ? 'disabled' : ''}">
          <a href="#" data-page="${state.page + 1}">&raquo;</a>
        </li>
      `);

      elements.pagination.innerHTML = items.join('');
    };

    const fetchPosts = async () => {
      try {
        const params = new URLSearchParams();
        params.set('status', 'published');
        params.set('page', state.page);
        params.set('ordering', '-published_at');

        if (state.search) {
          params.set('search', state.search);
        }
        if (state.category) {
          params.set('category', state.category);
        }

        const url = `${apiBaseUrl}/api/blog-posts/?${params.toString()}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          console.warn('[BlogLoader] Failed to fetch posts:', response.status);
          return { items: [], count: 0 };
        }

        const data = await response.json();
        return normalizeListResponse(data);
      } catch (error) {
        console.error('[BlogLoader] Error fetching posts:', error);
        return { items: [], count: 0 };
      }
    };

    const fetchRecentPosts = async () => {
      try {
        const params = new URLSearchParams();
        params.set('status', 'published');
        params.set('ordering', '-published_at');
        params.set('page', 1);

        const url = `${apiBaseUrl}/api/blog-posts/?${params.toString()}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          console.warn('[BlogLoader] Failed to fetch recent posts:', response.status);
          return [];
        }

        const data = await response.json();
        const { items } = normalizeListResponse(data);
        return items.slice(0, 3);
      } catch (error) {
        console.error('[BlogLoader] Error fetching recent posts:', error);
        return [];
      }
    };

    const fetchCategories = async () => {
      try {
        const url = `${apiBaseUrl}/api/blog-categories/`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          console.warn('[BlogLoader] Failed to fetch categories:', response.status);
          return [];
        }

        const data = await response.json();
        const { items } = normalizeListResponse(data);
        // Optionally filter inactive categories client-side
        return items.filter(cat => cat.is_active !== false);
      } catch (error) {
        console.error('[BlogLoader] Error fetching categories:', error);
        return [];
      }
    };

    const renderRecentPosts = (posts) => {
      if (!elements.recentContainer) return;

      if (!posts || posts.length === 0) {
        elements.recentContainer.innerHTML = '<p>No recent posts found.</p>';
        return;
      }

      const html = posts.map((post) => {
        const detailUrl = `blog-detail.html?slug=${encodeURIComponent(post.slug)}`;
        const title = escapeHtml(post.title || '');
        const excerpt = escapeHtml(truncateText(stripHtml(post.excerpt || post.content || ''), 80));

        return `
          <div>
            <h6>
              <a href="${detailUrl}">${title}</a>
            </h6>
            <p>${excerpt}</p>
          </div>
        `;
      }).join('');

      elements.recentContainer.innerHTML = html;
    };

    const renderTags = (categories) => {
      if (!elements.tagsContainer) return;

      if (!categories || categories.length === 0) {
        elements.tagsContainer.innerHTML = '<p>No categories available.</p>';
        return;
      }

      const html = categories.map((cat) => {
        const name = cat.name || '';
        const isActive = state.category && state.category === name;

        return `
          <div>
            <a href="#" data-category="${escapeHtml(name)}" class="${isActive ? 'active' : ''}">${escapeHtml(name)}</a>
          </div>
        `;
      }).join('');

      elements.tagsContainer.innerHTML = html;
    };

    const loadPosts = async () => {
      showLoading(true);
      try {
        const { items, count } = await fetchPosts();
        renderPosts(items);
        renderPagination(count);
      } finally {
        showLoading(false);
      }
    };

    const loadSidebar = async () => {
      const [recent, categories] = await Promise.all([
        fetchRecentPosts(),
        fetchCategories()
      ]);
      renderRecentPosts(recent);
      renderTags(categories);
    };

    // Event bindings
    if (elements.searchForm && elements.searchInput) {
      elements.searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        state.search = elements.searchInput.value.trim();
        state.page = 1;
        loadPosts();
      });
    }

    if (elements.pagination) {
      elements.pagination.addEventListener('click', function(e) {
        const link = e.target.closest('a[data-page]');
        if (!link) return;
        e.preventDefault();

        const targetPage = parseInt(link.getAttribute('data-page'), 10);
        if (!Number.isFinite(targetPage) || targetPage < 1 || targetPage === state.page) {
          return;
        }

        state.page = targetPage;
        loadPosts();
      });
    }

    if (elements.tagsContainer) {
      elements.tagsContainer.addEventListener('click', function(e) {
        const link = e.target.closest('a[data-category]');
        if (!link) return;
        e.preventDefault();

        const categoryName = link.getAttribute('data-category') || '';
        // Toggle category filter
        if (state.category === categoryName) {
          state.category = '';
        } else {
          state.category = categoryName;
        }
        state.page = 1;

        // Update active state
        const allLinks = elements.tagsContainer.querySelectorAll('a[data-category]');
        allLinks.forEach((a) => {
          if ((a.getAttribute('data-category') || '') === state.category && state.category) {
            a.classList.add('active');
          } else {
            a.classList.remove('active');
          }
        });

        loadPosts();
      });
    }

    // Initial load
    loadPosts();
    loadSidebar();
  };

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


