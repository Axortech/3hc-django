// Banner Loader
// Customized for 3HC website structure
// Version: 2.1 - Optimized for existing template

document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = getApiBaseUrl();
    const HOME_SECTION_ID = 'home';
    
    // Configuration optimized for 3HC template
    const CONFIG = {
        apiEndpoint: '/api/banners/active/',
        cache: {
            enabled: false,
            ttl: 5 * 60 * 1000, // 5 minutes
            key: 'banner_cache_3hc_v1'
        },
        carousel: {
            enabled: false, // Disabled since template might have its own
        },
        video: {
            autoplay: true,
            muteRequired: true,
            retryAttempts: 2,
            intersectionThreshold: 0.3
        }
    };

    // State management
    let videoObserver = null;
    let currentBanners = [];

    /**
     * Get the API base URL dynamically
     */
    function getApiBaseUrl() {
        const protocol = window.location.protocol;
        const host = window.location.host;
        return `${protocol}//${host}`;
    }

    /**
     * Ensure CSS styles are present
     */
    function ensureSpinnerStyles() {
        if (!document.querySelector('#banner-spinner-styles')) {
            const style = document.createElement('style');
            style.id = 'banner-spinner-styles';
            style.textContent = `
                @keyframes banner-spin {
                    0% { transform: translate(-50%, -50%) rotate(0deg); }
                    100% { transform: translate(-50%, -50%) rotate(360deg); }
                }
                .banner-loader {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    z-index: 10;
                }
                .banner-loader .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    border-top-color: #ff6600;
                    animation: banner-spin 1s ease-in-out infinite;
                }
                /* Ensure banner container is properly layered */
                #home .banner-carousel {
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    z-index: 0 !important;
                    overflow: hidden !important;
                    pointer-events: none !important;
                }
                #home .banner-carousel video,
                #home .banner-carousel img {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                }
                /* Override inline background */
                #home.mainbg[style*="background:"] {
                    background: none !important;
                    background-color: transparent !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Get cached banners
     */
    function getCachedBanners() {
        if (!CONFIG.cache.enabled) return null;
        
        try {
            const cached = localStorage.getItem(CONFIG.cache.key);
            if (!cached) return null;
            
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CONFIG.cache.ttl) {
                console.log('Using cached banners');
                return data;
            }
            return null;
        } catch (error) {
            console.warn('Failed to read cache:', error);
            return null;
        }
    }

    /**
     * Save banners to cache
     */
    function saveToCache(banners) {
        if (!CONFIG.cache.enabled) return;
        
        try {
            const cacheData = {
                data: banners,
                timestamp: Date.now()
            };
            localStorage.setItem(CONFIG.cache.key, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Failed to save to cache:', error);
        }
    }

    /**
     * Fetch active banners from API
     */
    async function fetchBanners() {
        // Check cache first
        const cached = getCachedBanners();
        if (cached) {
            renderBanners(cached);
            // Update in background
            setTimeout(fetchFreshBanners, 1000);
            return;
        }
        
        await fetchFreshBanners();
    }

    /**
     * Fetch fresh banners from API
     */
    async function fetchFreshBanners() {
        try {
            const response = await fetch(`${API_BASE_URL}${CONFIG.apiEndpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'no-cache'
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const banners = await response.json();

            const list = Array.isArray(banners)
                ? banners
                : (banners && typeof banners === 'object')
                    ? [banners]
                    : [];

            currentBanners = list;
            
            if (list.length > 0) {
                saveToCache(list);
                renderBanners(list);
            } else {
                console.warn('No active banners found', banners);
                // Keep default content
            }
        } catch (error) {
            console.error('Error fetching banners:', error);
            // Silently fail - keep default content
        }
    }

    /**
     * Clean up previous banners
     */
    function cleanupPreviousBanners() {
        // Clean up Intersection Observer
        if (videoObserver) {
            videoObserver.disconnect();
            videoObserver = null;
        }
        
        // Clean up videos
        const videos = document.querySelectorAll('.banner-video');
        videos.forEach(video => {
            video.pause();
            video.src = '';
            video.load();
            video.remove();
        });
    }

    /**
     * Render banners dynamically
     */
    function renderBanners(banners) {
        cleanupPreviousBanners();
        
        const homeSection = document.querySelector(`section#${HOME_SECTION_ID}`);
        
        if (!homeSection) {
            console.warn(`Home section with id "${HOME_SECTION_ID}" not found`);
            return;
        }

        // Remove any inline background styles that might interfere
        homeSection.style.backgroundImage = 'none';
        homeSection.style.background = 'none';
        homeSection.style.backgroundColor = 'transparent';

        // Create a container for banners if it doesn't exist
        let bannerContainer = homeSection.querySelector('.banner-carousel');

        if (!bannerContainer) {
            // Create banner carousel container
            bannerContainer = document.createElement('div');
            bannerContainer.className = 'banner-carousel';
            
            // Insert at the beginning of the section, before any content
            if (homeSection.firstChild) {
                homeSection.insertBefore(bannerContainer, homeSection.firstChild);
            } else {
                homeSection.appendChild(bannerContainer);
            }
        } else {
            // Clear existing banners
            bannerContainer.innerHTML = '';
        }

        // Render each banner
        banners.forEach((banner, index) => {
            const bannerHTML = createBannerHTML(banner, index);
            bannerContainer.innerHTML += bannerHTML;
        });

        // Update hero text with the first banner
        if (banners.length > 0) {
            const first = banners[0];
            setHeroText(first);
            if (first.video) {
                homeSection.classList.add('has-banner-video');
            }
        }

        // After insertion, ensure videos start muted/inline and attempt playback
        activateBannerVideos(bannerContainer);

        // Setup Intersection Observer for videos
        setupVideoIntersectionObserver();
    }

    /**
     * Create HTML for a single banner
     */
    function createBannerHTML(banner, index) {
        const title = escapeHtml(banner.title || '');
        const subtitle = escapeHtml(banner.subtitle || '');
        const bannerId = banner.id || `banner-${index}`;
        
        let mediaContent = '';

        // Check if banner has video
        if (banner.video && isValidUrl(banner.video)) {
            const videoUrl = escapeHtml(banner.video);
            const posterUrl = banner.video_poster && isValidUrl(banner.video_poster) 
                ? escapeHtml(banner.video_poster) 
                : '';
            
            mediaContent = `
                <div class="banner-video-wrapper" style="position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;">
                    <div class="banner-spinner" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:42px;height:42px;border:4px solid rgba(255,255,255,0.35);border-top-color:#ff6600;border-radius:50%;animation:banner-spin 0.8s linear infinite;z-index:2;"></div>
                    <video 
                        class="banner-video" 
                        id="${bannerId}"
                        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
                        autoplay
                        muted
                        loop
                        playsinline
                        preload="auto"
                        ${posterUrl ? `poster="${posterUrl}"` : ''}
                    >
                        <source src="${videoUrl}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                </div>
            `;
        } else if (banner.video_poster && isValidUrl(banner.video_poster)) {
            const posterUrl = escapeHtml(banner.video_poster);
            mediaContent = `
                <img 
                    class="banner-image" 
                    src="${posterUrl}"
                    alt="${title}"
                    loading="lazy"
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
                />
            `;
        }

        return `
            <div class="banner-item" 
                 style="position: relative; width: 100%; height: 100%;"
                 data-banner-id="${bannerId}">
                ${mediaContent}
            </div>
        `;
    }

    /**
     * Update hero text block with banner title/subtitle
     */
    function setHeroText(banner) {
        const titleEl = document.getElementById('heroTitle');
        const subtitleEl = document.getElementById('heroSubtitle');
        const descEl = document.getElementById('heroDescription');

        if (titleEl) {
            titleEl.textContent = banner.title || 'BUILDSTATE CONSTRUCTION';
        }
        if (subtitleEl) {
            subtitleEl.textContent = banner.subtitle || 'We Build Your Dream';
        }
        if (descEl) {
            descEl.textContent = banner.description || 'Update this banner in the dashboard to showcase your latest story.';
        }
    }

    /**
     * Setup Intersection Observer for video playback
     */
    function setupVideoIntersectionObserver() {
        const videos = document.querySelectorAll('.banner-video');
        if (!videos.length) return;
        
        videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;
                if (entry.isIntersecting) {
                    video.play().catch(e => console.debug('Autoplay prevented:', e));
                } else {
                    video.pause();
                }
            });
        }, { threshold: CONFIG.video.intersectionThreshold });
        
        videos.forEach(video => videoObserver.observe(video));
    }

    /**
     * Ensure videos are muted/inline and attempt playback after insertion.
     */
    function activateBannerVideos(container) {
        if (!container) return;
        const videos = container.querySelectorAll('video.banner-video');
        
        videos.forEach((vid) => {
            const bannerId = vid.id;
            
            vid.muted = true;
            vid.setAttribute('muted', '');
            vid.playsInline = true;
            vid.setAttribute('playsinline', '');
            vid.autoplay = true;
            vid.loop = true;
            vid.preload = 'auto';
            vid.removeAttribute('controls');

            const spinner = vid.closest('.banner-video-wrapper')?.querySelector('.banner-spinner');
            const hideSpinner = () => { 
                if (spinner) {
                    spinner.style.display = 'none';
                }
            };

            const tryPlayWithRetry = (attempt = 0) => {
                const maxAttempts = CONFIG.video.retryAttempts;
                if (attempt >= maxAttempts) {
                    hideSpinner();
                    return;
                }
                
                const playPromise = vid.play();
                if (playPromise && typeof playPromise.catch === 'function') {
                    playPromise.catch((error) => {
                        console.debug(`Play attempt ${attempt + 1} failed:`, error);
                        if (attempt < maxAttempts - 1) {
                            setTimeout(() => tryPlayWithRetry(attempt + 1), 400 * (attempt + 1));
                        } else {
                            hideSpinner();
                        }
                    });
                }
            };

            vid.addEventListener('canplay', () => { 
                hideSpinner(); 
                tryPlayWithRetry(); 
            }, { once: true });
            
            vid.addEventListener('playing', hideSpinner, { once: true });
            
            vid.addEventListener('error', (e) => {
                console.error('Video error:', e);
                if (spinner) spinner.style.display = 'none';
            });
            
            // Timeout fallback
            setTimeout(hideSpinner, 5000);

            // Initial kick
            vid.load();
            tryPlayWithRetry();
        });
    }

    /**
     * Escape HTML special characters
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Validate URL
     */
    function isValidUrl(string) {
        if (!string || typeof string !== 'string') return false;
        
        try {
            const url = new URL(string);
            return ['http:', 'https:'].includes(url.protocol);
        } catch (_) {
            // Accept relative URLs
            return string.startsWith('/') || string.startsWith('./') || string.startsWith('../');
        }
    }

    /**
     * Public API for manual refresh
     */
    window.refreshBanners = function() {
        fetchFreshBanners();
    };

    // Initialize
    ensureSpinnerStyles();
    fetchBanners();
});
