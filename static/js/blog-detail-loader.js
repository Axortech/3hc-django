// /**
//  * Blog Detail Page Loader
//  * Loads a single blog post (by slug) and populates the detail page UI.
//  */
// (function() {
//   'use strict';

//   /**
//    * Simple markdown parser for common markdown syntax
//    * Supports: headings, bold, italic, lists, code blocks, links, images, etc.
//    */
//   const parseMarkdown = (markdown) => {
//     if (!markdown) return '';
    
//     let html = markdown;

//     // Process code blocks first (before any HTML escaping)
//     const codeBlocks = [];
//     html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
//       const lines = code.trim().split('\n');
//       const lang = lines[0] && !lines[0].includes(' ') ? lines[0] : '';
//       const actualCode = lang ? lines.slice(1).join('\n') : code.trim();
//       const langClass = lang ? ` class="language-${lang}"` : '';
//       const codeHtml = `<pre><code${langClass}>${escapeHtml(actualCode)}</code></pre>`;
//       codeBlocks.push(codeHtml);
//       return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
//     });

//     // Now escape remaining HTML
//     html = html
//       .replace(/&/g, '&amp;')
//       .replace(/</g, '&lt;')
//       .replace(/>/g, '&gt;');

//     // Inline code (backticks) - escape content
//     html = html.replace(/`([^`]+)`/g, (match, code) => {
//       return `<code style="background-color: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: monospace;">${escapeHtml(code)}</code>`;
//     });

//     // Links [text](url)
//     html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
//       return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${text}</a>`;
//     });

//     // Images ![alt](url)
//     html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
//       return `<img src="${escapeHtml(url)}" alt="${alt}" class="img-responsive" style="max-width: 100%; height: auto; margin: 15px 0;">`;
//     });

//     // Headings (process highest level first)
//     html = html.replace(/^### (.*?)$/gm, '<h3 style="margin-top: 25px; margin-bottom: 15px;">$1</h3>');
//     html = html.replace(/^## (.*?)$/gm, '<h2 style="margin-top: 30px; margin-bottom: 18px;">$1</h2>');
//     html = html.replace(/^# (.*?)$/gm, '<h1 style="margin-top: 35px; margin-bottom: 20px;">$1</h1>');

//     // Bold **text** and __text__
//     html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
//     html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

//     // Italic *text* and _text_ (be careful not to match emphasis in URLs)
//     html = html.replace(/(?<!\*)\*([^\*\n]+?)\*(?!\*)/g, '<em>$1</em>');
//     html = html.replace(/(?<!_)_([^_\n]+?)_(?!_)/g, '<em>$1</em>');

//     // Unordered lists - convert lines starting with * or -
//     const lines = html.split('\n');
//     let inList = false;
//     html = lines.map((line) => {
//       if (/^\s*[\*\-]\s+/.test(line)) {
//         const item = line.replace(/^\s*[\*\-]\s+/, '').trim();
//         if (!inList) {
//           inList = true;
//           return `<ul style="margin-bottom: 15px; padding-left: 30px;"><li style="margin-bottom: 8px;">${item}</li>`;
//         }
//         return `<li style="margin-bottom: 8px;">${item}</li>`;
//       } else if (inList && line.trim() === '') {
//         inList = false;
//         return '</ul>';
//       } else if (inList) {
//         inList = false;
//         return `</ul>${line}`;
//       }
//       return line;
//     }).join('\n');
    
//     if (inList) {
//       html = html + '</ul>';
//     }

//     // Ordered lists - convert lines starting with number.
//     html = html.replace(/^\d+\.\s+(.+)$/gm, '<li style="margin-bottom: 8px;">$1</li>');
//     html = html.replace(/(<li[^>]*>.*<\/li>)/s, '<ol style="margin-bottom: 15px; padding-left: 30px;">$1</ol>');

//     // Blockquote
//     html = html.replace(/^&gt;\s+(.+?)$/gm, '<blockquote style="border-left: 4px solid #ff6600; padding-left: 15px; margin: 15px 0; color: #666; font-style: italic;">$1</blockquote>');

//     // Horizontal rules
//     html = html.replace(/^(-{3,}|\*{3,}|_{3,})$/gm, '<hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">');

//     // Process paragraphs - wrap text not already in tags
//     const paraLines = html.split('\n');
//     let result = [];
//     let currentPara = [];
    
//     paraLines.forEach((line) => {
//       if (line.trim() === '' || line.trim().startsWith('<')) {
//         if (currentPara.length > 0) {
//           const paraText = currentPara.join('\n').trim();
//           if (paraText && !paraText.startsWith('<')) {
//             result.push(`<p style="margin-bottom: 15px; line-height: 1.8;">${paraText}</p>`);
//           } else {
//             result.push(paraText);
//           }
//           currentPara = [];
//         }
//         if (line.trim() !== '') {
//           result.push(line);
//         }
//       } else {
//         currentPara.push(line);
//       }
//     });
    
//     if (currentPara.length > 0) {
//       const paraText = currentPara.join('\n').trim();
//       if (paraText && !paraText.startsWith('<')) {
//         result.push(`<p style="margin-bottom: 15px; line-height: 1.8;">${paraText}</p>`);
//       } else {
//         result.push(paraText);
//       }
//     }
    
//     html = result.join('\n');

//     // Restore code blocks
//     codeBlocks.forEach((block, index) => {
//       html = html.replace(`__CODE_BLOCK_${index}__`, block);
//     });

//     return html;
//   };

//   const getApiBaseUrl = () => {
//     if (window.DashboardApp && window.DashboardApp.config && window.DashboardApp.config.apiBaseUrl) {
//       return window.DashboardApp.config.apiBaseUrl;
//     }
//     if (window.config && window.config.apiBaseUrl) {
//       return window.config.apiBaseUrl;
//     }
//     // Construct from current location if not set
//     const protocol = window.location.protocol;
//     const host = window.location.host;
//     return `${protocol}//${host}`;
//   };

//   const escapeHtml = (str) => {
//     if (!str) return '';
//     return String(str)
//       .replace(/&/g, '&amp;')
//       .replace(/</g, '&lt;')
//       .replace(/>/g, '&gt;')
//       .replace(/"/g, '&quot;')
//       .replace(/'/g, '&#039;');
//   };

//   const stripHtml = (html) => {
//     if (!html) return '';
//     const div = document.createElement('div');
//     div.innerHTML = html;
//     return div.textContent || div.innerText || '';
//   };

//   const formatDate = (isoString) => {
//     if (!isoString) return '';
//     const date = new Date(isoString);
//     if (Number.isNaN(date.getTime())) return '';
//     return date.toLocaleDateString(undefined, {
//       month: 'short',
//       day: 'numeric',
//       year: 'numeric'
//     });
//   };

//   const normalizeListResponse = (data) => {
//     if (!data) return [];
//     if (Array.isArray(data)) return data;
//     if (Array.isArray(data.results)) return data.results;
//     return [];
//   };

//   const getSlugFromUrl = () => {
//     try {
//       const url = new URL(window.location.href);
//       const slug = url.searchParams.get('slug');
//       return slug ? slug.trim() : '';
//     } catch (e) {
//       return '';
//     }
//   };

//   const init = () => {
//     const slug = getSlugFromUrl();
//     const loadingEl = document.getElementById('blog-detail-loading');
//     const errorEl = document.getElementById('blog-detail-error');
//     const articleEl = document.getElementById('blog-detail-article');
//     const titleMainEl = document.querySelector('[data-blog-title-main]');
//     const titleHeaderEl = document.querySelector('[data-blog-title]');
//     const breadcrumbTitleEl = document.querySelector('[data-breadcrumb-title]');
//     const imageEl = document.getElementById('blog-detail-image');
//     const metaEl = document.querySelector('[data-blog-meta]');
//     const contentEl = document.getElementById('blog-detail-content');
//     const recentContainer = document.getElementById('detail-recent-posts');
//     const categoriesContainer = document.getElementById('detail-categories');

//     if (!slug) {
//       if (loadingEl) loadingEl.style.display = 'none';
//       if (errorEl) {
//         errorEl.style.display = 'block';
//         errorEl.textContent = 'No article specified.';
//       }
//       return;
//     }

//     const apiBaseUrl = getApiBaseUrl();

//     const showError = (message) => {
//       if (loadingEl) loadingEl.style.display = 'none';
//       if (articleEl) articleEl.style.display = 'none';
//       if (errorEl) {
//         errorEl.style.display = 'block';
//         errorEl.textContent = message || 'Unable to load this article.';
//       }
//     };

//     const showArticle = () => {
//       if (loadingEl) loadingEl.style.display = 'none';
//       if (errorEl) errorEl.style.display = 'none';
//       if (articleEl) articleEl.style.display = 'block';
//     };

//     const fetchPost = async () => {
//       try {
//         const url = `${apiBaseUrl}/api/blog-posts/slug/${encodeURIComponent(slug)}/`;
//         console.log('[BlogDetailLoader] Fetching from:', url);
        
//         const response = await fetch(url, {
//           method: 'GET',
//           headers: {
//             'Content-Type': 'application/json'
//           },
//           credentials: 'include'
//         });

//         if (!response.ok) {
//           console.warn('[BlogDetailLoader] Failed to fetch post:', response.status);
//           showError(response.status === 404 ? 'Article not found.' : 'Unable to load this article.');
//           return null;
//         }

//         const post = await response.json();
//         console.log('[BlogDetailLoader] Post loaded:', post);
//         return post;
//       } catch (error) {
//         console.error('[BlogDetailLoader] Error fetching post:', error);
//         showError('Network error while loading this article.');
//         return null;
//       }
//     };

//     const fetchRecentPosts = async () => {
//       try {
//         const params = new URLSearchParams();
//         params.set('status', 'published');
//         params.set('ordering', '-published_at');
//         params.set('page', 1);

//         const url = `${apiBaseUrl}/api/blog-posts/?${params.toString()}`;
//         const response = await fetch(url, {
//           method: 'GET',
//           headers: {
//             'Content-Type': 'application/json'
//           },
//           credentials: 'include'
//         });

//         if (!response.ok) {
//           console.warn('[BlogDetailLoader] Failed to fetch recent posts:', response.status);
//           return [];
//         }

//         const data = await response.json();
//         return normalizeListResponse(data).slice(0, 3);
//       } catch (error) {
//         console.error('[BlogDetailLoader] Error fetching recent posts:', error);
//         return [];
//       }
//     };

//     const fetchCategories = async () => {
//       try {
//         const url = `${apiBaseUrl}/api/blog-categories/`;
//         const response = await fetch(url, {
//           method: 'GET',
//           headers: {
//             'Content-Type': 'application/json'
//           },
//           credentials: 'include'
//         });

//         if (!response.ok) {
//           console.warn('[BlogDetailLoader] Failed to fetch categories:', response.status);
//           return [];
//         }

//         const data = await response.json();
//         return normalizeListResponse(data).filter(cat => cat.is_active !== false);
//       } catch (error) {
//         console.error('[BlogDetailLoader] Error fetching categories:', error);
//         return [];
//       }
//     };

//     const renderPost = (post) => {
//       if (!post) return;

//       const title = post.title || '';
//       const author = post.author || 'Admin';
//       const dateStr = formatDate(post.published_at || post.created_at);
//       const readingTime = post.reading_time_minutes
//         ? `${post.reading_time_minutes} min read`
//         : '';
//       const categoryName = post.category || '';

//       if (titleMainEl) {
//         titleMainEl.textContent = title;
//       }
//       if (titleHeaderEl) {
//         titleHeaderEl.textContent = title;
//       }
//       if (breadcrumbTitleEl) {
//         breadcrumbTitleEl.textContent = title;
//       }

//       if (imageEl) {
//         let image = post.featured_image || post.thumbnail;
        
//         // If image URL is relative, make it absolute
//         if (image && !image.startsWith('http')) {
//           const baseUrl = apiBaseUrl.replace('/api', '');
//           image = baseUrl + (image.startsWith('/') ? image : '/' + image);
//         }
        
//         if (image) {
//           imageEl.src = image;
//           imageEl.onerror = function() {
//             console.warn('[BlogDetailLoader] Failed to load image:', image);
//             this.style.display = 'none';
//           };
//         }
        
//         imageEl.alt = post.featured_image_alt || title || 'Blog image';
//       }

//       if (metaEl) {
//         const bits = [];
//         if (author) {
//           bits.push(`<span class="user-post"><i class="ti-user"></i>${escapeHtml(author)}</span>`);
//         }
//         if (dateStr) {
//           bits.push(`<span class="date-post"><i class="ti-calendar"></i>${escapeHtml(dateStr)}</span>`);
//         }
//         if (readingTime) {
//           bits.push(`<span class="date-post"><i class="ti-time"></i>${escapeHtml(readingTime)}</span>`);
//         }
//         if (categoryName) {
//           bits.push(`<span class="date-post"><i class="ti-tag"></i>${escapeHtml(categoryName)}</span>`);
//         }
//         metaEl.innerHTML = bits.join(' ');
//       }

//       if (contentEl) {
//         if (post.content) {
//           // Parse markdown content
//           const htmlContent = parseMarkdown(post.content);
//           contentEl.innerHTML = htmlContent;
//         } else if (post.excerpt) {
//           contentEl.innerHTML = `<p>${escapeHtml(post.excerpt)}</p>`;
//         }
//       }

//       showArticle();
//     };

//     const renderRecentPosts = (posts) => {
//       if (!recentContainer) return;

//       if (!posts || posts.length === 0) {
//         recentContainer.innerHTML = '<p>No recent posts.</p>';
//         return;
//       }

//       const html = posts.map((post) => {
//         const detailUrl = `blog-detail.html?slug=${encodeURIComponent(post.slug)}`;
//         const title = escapeHtml(post.title || '');
//         const excerpt = escapeHtml(stripHtml(post.excerpt || '').slice(0, 80));

//         return `
//           <div>
//             <h6>
//               <a href="${detailUrl}">${title}</a>
//             </h6>
//             <p>${excerpt}</p>
//           </div>
//         `;
//       }).join('');

//       recentContainer.innerHTML = html;
//     };

//     const renderCategories = (categories) => {
//       if (!categoriesContainer) return;

//       if (!categories || categories.length === 0) {
//         categoriesContainer.innerHTML = '<p>No categories.</p>';
//         return;
//       }

//       const html = categories.map(cat => {
//         const name = cat.name || '';
//         return `
//           <div>
//             <a href="blog.html" data-category="${escapeHtml(name)}">${escapeHtml(name)}</a>
//           </div>
//         `;
//       }).join('');

//       categoriesContainer.innerHTML = html;
//     };

//     const loadSidebar = async () => {
//       const [recent, categories] = await Promise.all([
//         fetchRecentPosts(),
//         fetchCategories()
//       ]);
//       renderRecentPosts(recent);
//       renderCategories(categories);
//     };

//     // Initial load
//     fetchPost().then((post) => {
//       if (post) {
//         renderPost(post);
//       }
//     });
//     loadSidebar();
//   };

//   if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', init);
//   } else {
//     init();
//   }
// })();


/**
 * Blog Detail Page Loader with Enhanced Scientific Content Support
 * Handles mathematical equations, tables, and scientific notation
 */
/**
 * Blog Detail Page Loader - Optimized for Quill.js Content
 * Handles HTML content from Quill editor with tables, formulas, and formatting
 */
(function() {
  'use strict';

  /**
   * Main content processing function for Quill HTML content
   */
  const processQuillContent = (content) => {
    if (!content) return '';
    
    console.log('[ContentProcessor] Processing Quill content, length:', content.length);
    
    let html = content;
    
    // If content is Delta JSON, convert it to HTML
    if (typeof content === 'string' && (content.trim().startsWith('{') || content.trim().startsWith('['))) {
      try {
        const data = JSON.parse(content);
        if (data && data.ops && Array.isArray(data.ops)) {
          html = convertDeltaToHtml(data);
          console.log('[ContentProcessor] Converted Delta to HTML');
        }
      } catch (e) {
        console.warn('[ContentProcessor] Not valid Delta JSON, treating as HTML');
      }
    }
    
    // Process any LaTeX/math formulas if present
    html = processMathFormulas(html);
    
    // Ensure tables are properly styled
    html = enhanceTables(html);
    
    // Add proper styling to all elements
    html = addContentStyling(html);
    
    return html;
  };

  /**
   * Convert Quill Delta format to HTML
   */
  const convertDeltaToHtml = (delta) => {
    if (!delta || !delta.ops) return '';
    
    let html = '';
    let inList = false;
    let listType = '';
    
    delta.ops.forEach((op, index) => {
      if (typeof op.insert === 'string') {
        let text = escapeHtml(op.insert);
        let tags = '';
        let closingTags = '';
        
        // Apply formatting attributes
        if (op.attributes) {
          // Bold
          if (op.attributes.bold) {
            tags += '<strong>';
            closingTags = '</strong>' + closingTags;
          }
          
          // Italic
          if (op.attributes.italic) {
            tags += '<em>';
            closingTags = '</em>' + closingTags;
          }
          
          // Underline
          if (op.attributes.underline) {
            tags += '<u>';
            closingTags = '</u>' + closingTags;
          }
          
          // Strikethrough
          if (op.attributes.strike) {
            tags += '<s>';
            closingTags = '</s>' + closingTags;
          }
          
          // Headers
          if (op.attributes.header) {
            const level = Math.min(op.attributes.header, 6);
            const prevOp = delta.ops[index - 1];
            const prevHadHeader = prevOp && prevOp.attributes && prevOp.attributes.header;
            
            if (!prevHadHeader) {
              tags += `<h${level} class="content-header">`;
              closingTags = `</h${level}>${closingTags}`;
            }
          }
          
          // Blockquote
          if (op.attributes.blockquote) {
            tags += '<blockquote class="content-blockquote">';
            closingTags = '</blockquote>' + closingTags;
          }
          
          // Code block
          if (op.attributes['code-block']) {
            const prevOp = delta.ops[index - 1];
            const nextOp = delta.ops[index + 1];
            const prevIsCodeBlock = prevOp && prevOp.attributes && prevOp.attributes['code-block'];
            const nextIsCodeBlock = nextOp && nextOp.attributes && nextOp.attributes['code-block'];
            
            if (!prevIsCodeBlock) {
              tags += '<pre class="content-pre"><code>';
            }
            
            if (!nextIsCodeBlock) {
              closingTags = '</code></pre>' + closingTags;
            }
          }
          
          // Inline code
          if (op.attributes.code) {
            tags += '<code class="inline-code">';
            closingTags = '</code>' + closingTags;
          }
          
          // Lists
          if (op.attributes.list) {
            const currentListType = op.attributes.list;
            const prevOp = delta.ops[index - 1];
            const prevListType = prevOp && prevOp.attributes && prevOp.attributes.list;
            
            if (!prevListType) {
              // Start new list
              const listTag = currentListType === 'ordered' ? 'ol' : 'ul';
              tags += `<${listTag} class="content-list">`;
              inList = true;
              listType = listTag;
            }
            
            tags += '<li class="content-list-item">';
            closingTags = '</li>' + closingTags;
            
            const nextOp = delta.ops[index + 1];
            const nextListType = nextOp && nextOp.attributes && nextOp.attributes.list;
            if (!nextListType && inList) {
              closingTags = `</${listType}>${closingTags}`;
              inList = false;
            }
          }
          
          // Links
          if (op.attributes.link) {
            tags += `<a href="${escapeHtml(op.attributes.link)}" target="_blank" rel="noopener noreferrer">`;
            closingTags = '</a>' + closingTags;
          }
        }
        
        html += tags + text + closingTags;
      }
      // Handle embeds (images, formulas, etc.)
      else if (op.insert && typeof op.insert === 'object') {
        // Images
        if (op.insert.image) {
          const imgUrl = escapeHtml(op.insert.image);
          const alt = op.attributes?.alt || '';
          html += `<img src="${imgUrl}" alt="${alt}" class="content-image">`;
        }
        
        // Formulas
        else if (op.insert.formula) {
          const formula = escapeHtml(op.insert.formula);
          html += `<span class="math-formula">${formula}</span>`;
        }
      }
    });
    
    return html;
  };

  /**
   * Process mathematical formulas in HTML
   */
  const processMathFormulas = (html) => {
    // Handle KaTeX formulas (if KaTeX is available)
    if (typeof katex !== 'undefined') {
      // Process elements with class 'formula' or 'katex'
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Process formulas that might be wrapped in specific classes
      const formulaElements = tempDiv.querySelectorAll('.formula, .katex, .math, [data-formula]');
      formulaElements.forEach(el => {
        try {
          const formula = el.textContent || el.getAttribute('data-formula') || '';
          if (formula) {
            katex.render(formula, el, {
              throwOnError: false,
              displayMode: el.tagName === 'DIV' || el.classList.contains('display')
            });
          }
        } catch (e) {
          console.warn('Failed to render formula:', e);
        }
      });
      
      return tempDiv.innerHTML;
    }
    
    return html;
  };

  /**
   * Enhance tables with proper styling
   */
  const enhanceTables = (html) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Find all tables
    const tables = tempDiv.querySelectorAll('table');
    
    tables.forEach((table, index) => {
      // Add wrapper for responsiveness
      const wrapper = document.createElement('div');
      wrapper.className = 'table-responsive';
      wrapper.style.cssText = 'overflow-x: auto; margin: 20px 0;';
      
      // Add styling to table
      table.style.cssText = 'width: 100%; border-collapse: collapse; margin: 0;';
      table.classList.add('content-table');
      
      // Style table headers
      const headers = table.querySelectorAll('th');
      headers.forEach(th => {
        th.style.cssText = 'background-color: #f5f5f5; border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: 600;';
      });
      
      // Style table cells
      const cells = table.querySelectorAll('td');
      cells.forEach(td => {
        td.style.cssText = 'border: 1px solid #ddd; padding: 10px 12px;';
      });
      
      // Add alternating row colors
      const rows = table.querySelectorAll('tr');
      rows.forEach((row, rowIndex) => {
        if (rowIndex % 2 === 0) {
          row.style.backgroundColor = '#f9f9f9';
        }
      });
      
      // Wrap table
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
    
    return tempDiv.innerHTML;
  };

  /**
   * Add consistent styling to all content elements
   */
  const addContentStyling = (html) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Style headers
    const headers = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headers.forEach(header => {
      if (!header.className.includes('content-header')) {
        header.className = 'content-header';
      }
      if (!header.style.marginTop) {
        header.style.marginTop = header.tagName === 'H1' ? '40px' : 
                                header.tagName === 'H2' ? '35px' : 
                                header.tagName === 'H3' ? '30px' : '25px';
      }
      if (!header.style.marginBottom) {
        header.style.marginBottom = header.tagName === 'H1' ? '20px' : 
                                   header.tagName === 'H2' ? '18px' : 
                                   header.tagName === 'H3' ? '16px' : '14px';
      }
      if (!header.style.color) {
        header.style.color = '#2c3e50';
      }
    });
    
    // Style paragraphs
    const paragraphs = tempDiv.querySelectorAll('p');
    paragraphs.forEach(p => {
      if (!p.className.includes('content-paragraph')) {
        p.className = 'content-paragraph';
      }
      if (!p.style.marginBottom) {
        p.style.marginBottom = '16px';
      }
      if (!p.style.lineHeight) {
        p.style.lineHeight = '1.6';
      }
    });
    
    // Style blockquotes
    const blockquotes = tempDiv.querySelectorAll('blockquote');
    blockquotes.forEach(blockquote => {
      if (!blockquote.className.includes('content-blockquote')) {
        blockquote.className = 'content-blockquote';
      }
      if (!blockquote.style.cssText) {
        blockquote.style.cssText = 'border-left: 4px solid #3498db; padding-left: 20px; margin: 25px 0; color: #555; font-style: italic; background-color: #f8f9fa; padding: 15px;';
      }
    });
    
    // Style code blocks
    const preElements = tempDiv.querySelectorAll('pre');
    preElements.forEach(pre => {
      if (!pre.className.includes('content-pre')) {
        pre.className = 'content-pre';
      }
      if (!pre.style.cssText) {
        pre.style.cssText = 'background-color: #f5f5f5; padding: 20px; border-radius: 4px; overflow-x: auto; margin: 20px 0; font-family: "Courier New", monospace;';
      }
    });
    
    // Style inline code
    const codeElements = tempDiv.querySelectorAll('code:not(pre code)');
    codeElements.forEach(code => {
      if (!code.className.includes('inline-code')) {
        code.className = 'inline-code';
      }
      if (!code.style.cssText) {
        code.style.cssText = 'background-color: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-family: "Courier New", monospace; font-size: 0.9em;';
      }
    });
    
    // Style lists
    const lists = tempDiv.querySelectorAll('ul, ol');
    lists.forEach(list => {
      if (!list.className.includes('content-list')) {
        list.className = 'content-list';
      }
      if (!list.style.margin) {
        list.style.margin = '20px 0 20px 30px';
      }
    });
    
    // Style list items
    const listItems = tempDiv.querySelectorAll('li');
    listItems.forEach(li => {
      if (!li.className.includes('content-list-item')) {
        li.className = 'content-list-item';
      }
      if (!li.style.marginBottom) {
        li.style.marginBottom = '8px';
      }
    });
    
    // Style images
    const images = tempDiv.querySelectorAll('img');
    images.forEach(img => {
      if (!img.className.includes('content-image')) {
        img.className = 'content-image';
      }
      if (!img.style.maxWidth) {
        img.style.maxWidth = '100%';
      }
      if (!img.style.height) {
        img.style.height = 'auto';
      }
      if (!img.style.margin) {
        img.style.margin = '20px 0';
      }
      if (!img.style.display) {
        img.style.display = 'block';
      }
      if (!img.style.borderRadius) {
        img.style.borderRadius = '4px';
      }
    });
    
    // Ensure all links open in new tab
    const links = tempDiv.querySelectorAll('a');
    links.forEach(link => {
      if (link.href && !link.href.startsWith('#')) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
    });
    
    return tempDiv.innerHTML;
  };

  /**
   * Utility Functions
   */
  const escapeHtml = (str) => {
    if (str == null) return '';
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

  const getApiBaseUrl = () => {
    if (window.DashboardApp && window.DashboardApp.config && window.DashboardApp.config.apiBaseUrl) {
      return window.DashboardApp.config.apiBaseUrl;
    }
    if (window.config && window.config.apiBaseUrl) {
      return window.config.apiBaseUrl;
    }
    const protocol = window.location.protocol;
    const host = window.location.host;
    return `${protocol}//${host}`;
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

  /**
   * Main Initialization
   */
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
        console.log('[BlogDetailLoader] Fetching from:', url);
        
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

        const post = await response.json();
        console.log('[BlogDetailLoader] Post loaded');
        return post;
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
        let image = post.featured_image || post.thumbnail;
        
        if (image && !image.startsWith('http')) {
          const baseUrl = apiBaseUrl.replace('/api', '');
          image = baseUrl + (image.startsWith('/') ? image : '/' + image);
        }
        
        if (image) {
          imageEl.src = image;
          imageEl.onerror = function() {
            console.warn('[BlogDetailLoader] Failed to load image:', image);
            this.style.display = 'none';
          };
        }
        
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
          try {
            console.log('[BlogDetailLoader] Processing post content');
            const htmlContent = processQuillContent(post.content);
            contentEl.innerHTML = htmlContent;
            
            // Apply syntax highlighting if available
            if (typeof Prism !== 'undefined' && contentEl.querySelector('pre code')) {
              Prism.highlightAllUnder(contentEl);
            }
            
          } catch (error) {
            console.error('[BlogDetailLoader] Error processing content:', error);
            contentEl.innerHTML = `<div class="error-message">
              <p>Error rendering content. Displaying raw text:</p>
              <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto;">${escapeHtml(post.content)}</pre>
            </div>`;
          }
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
          <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
            <h6 style="margin-bottom: 8px; font-size: 16px;">
              <a href="${detailUrl}" style="color: #333; text-decoration: none; transition: color 0.2s;" 
                 onmouseover="this.style.color='#ff6600'" onmouseout="this.style.color='#333'">
                ${title}
              </a>
            </h6>
            <p style="margin: 0; font-size: 14px; color: #666;">${excerpt}...</p>
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
        const postCount = cat.post_count || '';
        
        return `
          <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
            <a href="blog.html?category=${encodeURIComponent(name)}" 
               style="color: #333; text-decoration: none; transition: color 0.2s; font-size: 15px;"
               onmouseover="this.style.color='#ff6600'" onmouseout="this.style.color='#333'">
              ${escapeHtml(name)}
              ${postCount ? `<span style="float: right; color: #999; font-size: 13px;">${postCount}</span>` : ''}
            </a>
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

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();