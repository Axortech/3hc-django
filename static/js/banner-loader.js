// Banner Loader
// This script fetches active banners from the API and dynamically renders them

document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = getApiBaseUrl();
    const HOME_SECTION_ID = 'home';

    /**
     * Get the API base URL dynamically
     */
    function getApiBaseUrl() {
        const protocol = window.location.protocol;
        const host = window.location.host;
        return `${protocol}//${host}/api`;
    }

    /**
     * Fetch active banners from API
     */
    async function fetchBanners() {
        try {
            const response = await fetch(`${API_BASE_URL}/banners/active/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const banners = await response.json();
            
            if (Array.isArray(banners) && banners.length > 0) {
                renderBanners(banners);
            } else {
                console.warn('No active banners found', banners);
            }
        } catch (error) {
            console.error('Error fetching banners:', error);
            // Fallback: keep hardcoded banners if API fails
        }
    }

    /**
     * Render banners dynamically
     */
    function renderBanners(banners) {
        const homeSection = document.querySelector(`section#${HOME_SECTION_ID}`);
        
        if (!homeSection) {
            console.warn(`Home section with id "${HOME_SECTION_ID}" not found`);
            return;
        }

        // Create a container for banners if it doesn't exist
        let bannerContainer = homeSection.querySelector('.banner-carousel');
        
        if (!bannerContainer) {
            // Find the intro div and create carousel after it
            const introDiv = homeSection.querySelector('.container .row');
            if (!introDiv) {
                console.warn('Intro container not found');
                return;
            }
            
            // Create banner carousel container
            bannerContainer = document.createElement('div');
            bannerContainer.className = 'banner-carousel';
            bannerContainer.style.position = 'absolute';
            bannerContainer.style.top = '0';
            bannerContainer.style.left = '0';
            bannerContainer.style.width = '100%';
            bannerContainer.style.height = '100%';
            bannerContainer.style.zIndex = '-1';
            
            homeSection.insertBefore(bannerContainer, introDiv);
        } else {
            // Clear existing banners
            bannerContainer.innerHTML = '';
        }

        // Render each banner
        banners.forEach((banner, index) => {
            const bannerHTML = createBannerHTML(banner);
            bannerContainer.innerHTML += bannerHTML;
        });

        // Initialize carousel if jQuery and owl carousel are available
        if (typeof jQuery !== 'undefined' && jQuery.fn.owlCarousel) {
            initializeBannerCarousel();
        }
    }

    /**
     * Create HTML for a single banner
     */
    function createBannerHTML(banner) {
        const title = escapeHtml(banner.title || '');
        const subtitle = escapeHtml(banner.subtitle || '');
        
        let mediaContent = '';

        // Check if banner has video
        if (banner.video) {
            const videoUrl = escapeHtml(banner.video);
            const posterUrl = banner.video_poster ? escapeHtml(banner.video_poster) : '';
            
            mediaContent = `
                <video 
                    class="banner-video" 
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
                    ${banner.video_autoplay ? 'autoplay' : ''}
                    ${banner.video_muted ? 'muted' : ''}
                    ${banner.video_loop ? 'loop' : ''}
                    ${posterUrl ? `poster="${posterUrl}"` : ''}
                >
                    <source src="${videoUrl}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            `;
        } else if (banner.video_poster) {
            // Use poster image as fallback if only poster is available
            const posterUrl = escapeHtml(banner.video_poster);
            mediaContent = `
                <img 
                    class="banner-image" 
                    src="${posterUrl}"
                    alt="${title}"
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
                />
            `;
        }

        return `
            <div class="banner-item" style="position: relative; width: 100%; height: 100%;">
                ${mediaContent}
            </div>
        `;
    }

    /**
     * Initialize Owl Carousel for banners (if available)
     */
    function initializeBannerCarousel() {
        try {
            const bannerCarousel = jQuery('.banner-carousel');
            
            if (bannerCarousel.length > 0) {
                // Configure carousel
                bannerCarousel.owlCarousel({
                    items: 1,
                    loop: true,
                    autoplay: true,
                    autoplayTimeout: 5000,
                    autoplayHoverPause: true,
                    dots: true,
                    nav: false,
                    animateOut: 'fadeOut',
                    animateIn: 'fadeIn',
                    smartSpeed: 1000
                });
            }
        } catch (error) {
            console.warn('Could not initialize owl carousel for banners:', error);
        }
    }

    /**
     * Escape HTML special characters
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Fetch and render banners on page load
    fetchBanners();
});
