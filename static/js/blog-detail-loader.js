/**
 * Blog Detail Page Loader
 * Loads a single blog post (by slug) and populates the detail page UI.
 */
(function() {
  'use strict';

  const getApiBaseUrl = () => {
    if (window.DashboardApp && window.DashboardApp.config && window.DashboardApp.config.apiBaseUrl) {
      return window.DashboardApp.config.apiBaseUrl;
    }
    if (window.config && window.config.apiBaseUrl) {
      return window.config.apiBaseUrl;
    }
    return '';
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
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.results)) return data.results;
    return [];
  };

  const getSlugFromUrl = () => {
    try {
      const url = new URL(window.location.href);
      const slug = url.searchParams.get('slug');
      return slug ? slug.trim() : '';
    } catch (e) {
      return '';
    }
  };

  const init = () => {
    const slug = getSlugFromUrl();
    const loadingEl = document.getElementById('blog-detail-loading');
    const errorEl = document.getElementById('blog-detail-error');
    const articleEl = document.getElementById('blog-detail-article');
    const titleMainEl = document.querySelector('[data-blog-title-main]');
    const titleHeaderEl = document.querySelector('[data-blog-title]');
    const breadcrumbTitleEl = document.querySelector('[data-breadcrumb-title]');
    const imageEl = document.getElementById('blog-detail-image');
    const metaEl = document.querySelector('[data-blog-meta]');
    const contentEl = document.getElementById('blog-detail-content');
    const recentContainer = document.getElementById('detail-recent-posts');
    const categoriesContainer = document.getElementById('detail-categories');

    if (!slug) {
      if (loadingEl) loadingEl.style.display = 'none';
      if (errorEl) {
        errorEl.style.display = 'block';
        errorEl.textContent = 'No article specified.';
      }
      return;
    }

    const apiBaseUrl = getApiBaseUrl();

    const showError = (message) => {
      if (loadingEl) loadingEl.style.display = 'none';
      if (articleEl) articleEl.style.display = 'none';
      if (errorEl) {
        errorEl.style.display = 'block';
        errorEl.textContent = message || 'Unable to load this article.';
      }
    };

    const showArticle = () => {
      if (loadingEl) loadingEl.style.display = 'none';
      if (errorEl) errorEl.style.display = 'none';
      if (articleEl) articleEl.style.display = 'block';
    };

    const fetchPost = async () => {
      try {
        const url = `${apiBaseUrl}/api/blog-posts/slug/${encodeURIComponent(slug)}/`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          console.warn('[BlogDetailLoader] Failed to fetch post:', response.status);
          showError(response.status === 404 ? 'Article not found.' : 'Unable to load this article.');
          return null;
        }

        return await response.json();
      } catch (error) {
        console.error('[BlogDetailLoader] Error fetching post:', error);
        showError('Network error while loading this article.');
        return null;
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
          console.warn('[BlogDetailLoader] Failed to fetch recent posts:', response.status);
          return [];
        }

        const data = await response.json();
        return normalizeListResponse(data).slice(0, 3);
      } catch (error) {
        console.error('[BlogDetailLoader] Error fetching recent posts:', error);
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
          console.warn('[BlogDetailLoader] Failed to fetch categories:', response.status);
          return [];
        }

        const data = await response.json();
        return normalizeListResponse(data).filter(cat => cat.is_active !== false);
      } catch (error) {
        console.error('[BlogDetailLoader] Error fetching categories:', error);
        return [];
      }
    };

    const renderPost = (post) => {
      if (!post) return;

      const title = post.title || '';
      const author = post.author || 'Admin';
      const dateStr = formatDate(post.published_at || post.created_at);
      const readingTime = post.reading_time_minutes
        ? `${post.reading_time_minutes} min read`
        : '';
      const categoryName = post.category || '';

      if (titleMainEl) {
        titleMainEl.textContent = title;
      }
      if (titleHeaderEl) {
        titleHeaderEl.textContent = title;
      }
      if (breadcrumbTitleEl) {
        breadcrumbTitleEl.textContent = title;
      }

      if (imageEl) {
        const image =
          post.featured_image ||
          post.thumbnail ||
          imageEl.getAttribute('src');
        imageEl.src = image || imageEl.getAttribute('src');
        imageEl.alt = post.featured_image_alt || title || 'Blog image';
      }

      if (metaEl) {
        const bits = [];
        if (author) {
          bits.push(`<span class="user-post"><i class="ti-user"></i>${escapeHtml(author)}</span>`);
        }
        if (dateStr) {
          bits.push(`<span class="date-post"><i class="ti-calendar"></i>${escapeHtml(dateStr)}</span>`);
        }
        if (readingTime) {
          bits.push(`<span class="date-post"><i class="ti-time"></i>${escapeHtml(readingTime)}</span>`);
        }
        if (categoryName) {
          bits.push(`<span class="date-post"><i class="ti-tag"></i>${escapeHtml(categoryName)}</span>`);
        }
        metaEl.innerHTML = bits.join(' ');
      }

      if (contentEl) {
        if (post.content) {
          const text = stripHtml(post.content);
          const paragraphs = text
            .split(/\n{2,}/)
            .map(p => p.trim())
            .filter(p => p.length > 0)
            .map(p => `<p>${escapeHtml(p)}</p>`)
            .join('');
          contentEl.innerHTML = paragraphs || `<p>${escapeHtml(text)}</p>`;
        } else if (post.excerpt) {
          contentEl.innerHTML = `<p>${escapeHtml(post.excerpt)}</p>`;
        }
      }

      showArticle();
    };

    const renderRecentPosts = (posts) => {
      if (!recentContainer) return;

      if (!posts || posts.length === 0) {
        recentContainer.innerHTML = '<p>No recent posts.</p>';
        return;
      }

      const html = posts.map((post) => {
        const detailUrl = `blog-detail.html?slug=${encodeURIComponent(post.slug)}`;
        const title = escapeHtml(post.title || '');
        const excerpt = escapeHtml(stripHtml(post.excerpt || '').slice(0, 80));

        return `
          <div>
            <h6>
              <a href="${detailUrl}">${title}</a>
            </h6>
            <p>${excerpt}</p>
          </div>
        `;
      }).join('');

      recentContainer.innerHTML = html;
    };

    const renderCategories = (categories) => {
      if (!categoriesContainer) return;

      if (!categories || categories.length === 0) {
        categoriesContainer.innerHTML = '<p>No categories.</p>';
        return;
      }

      const html = categories.map(cat => {
        const name = cat.name || '';
        return `
          <div>
            <a href="blog.html" data-category="${escapeHtml(name)}">${escapeHtml(name)}</a>
          </div>
        `;
      }).join('');

      categoriesContainer.innerHTML = html;
    };

    const loadSidebar = async () => {
      const [recent, categories] = await Promise.all([
        fetchRecentPosts(),
        fetchCategories()
      ]);
      renderRecentPosts(recent);
      renderCategories(categories);
    };

    // Initial load
    fetchPost().then((post) => {
      if (post) {
        renderPost(post);
      }
    });
    loadSidebar();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


