// Site Configuration Loader
// This script fetches site configuration from the API and updates header/footer with dynamic content

document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = getApiBaseUrl();

    /**
     * Get the API base URL dynamically
     */
    function getApiBaseUrl() {
        const protocol = window.location.protocol;
        const host = window.location.host;
        return `${protocol}//${host}/api`;
    }

    /**
     * Fetch site configuration from API
     */
    async function fetchSiteConfig() {
        try {
            const response = await fetch(`${API_BASE_URL}/site-config/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            // Handle both single object and list response
            let config = await response.json();
            if (Array.isArray(config) && config.length > 0) {
                config = config[0];
            }
            
            if (config && typeof config === 'object') {
                updatePageWithConfig(config);
            }
        } catch (error) {
            console.error('Error fetching site configuration:', error);
            // Fallback: use hardcoded values if API fails
        }
    }

    /**
     * Update page elements with site configuration
     */
    function updatePageWithConfig(config) {
        // Update Header Elements
        updateHeaderConfig(config);
        
        // Update Footer Elements
        updateFooterConfig(config);
        
        // Update Site Logo
        updateSiteLogo(config);
    }

    /**
     * Update header with site configuration
     */
    function updateHeaderConfig(config) {
        // Update location in header
        const headerLocation = document.getElementById('header-location');
        if (headerLocation && config.address) {
            headerLocation.innerHTML = `<span class="ti-location-pin"></span>${escapeHtml(config.address)}`;
        }

        // Update phone in header
        const headerPhone = document.getElementById('header-phone');
        if (headerPhone && config.phone) {
            headerPhone.href = `tel:${escapeHtml(config.phone)}`;
            headerPhone.innerHTML = `<span class="ti-mobile"></span>${escapeHtml(config.phone)}`;
        }

        // Update business hours in header
        const headerHours = document.getElementById('header-hours');
        if (headerHours && config.business_hours) {
            headerHours.innerHTML = `<span class="ti-time"></span>${escapeHtml(config.business_hours)}`;
        }

        // Update social media links in header
        const headerSocialContainer = document.querySelector('.subnav .col-md-4 .social-icons-subnav');
        if (headerSocialContainer) {
            updateSocialLinks(headerSocialContainer, config);
        }
    }

    /**
     * Update footer with site configuration
     */
    function updateFooterConfig(config) {
        // Update company description in footer
        const aboutColumn = document.querySelector('.subfooter .col-md-3:first-child p');
        if (aboutColumn && config.about_excerpt) {
            aboutColumn.textContent = config.about_excerpt;
        }

        // Update address in footer
        const addressContainer = document.querySelector('.subfooter address');
        if (addressContainer && config.address) {
            const addressSpans = addressContainer.querySelectorAll('span');
            if (addressSpans.length > 0) {
                addressSpans[0].textContent = config.address;
            }
        }

        // Update phone in footer
        const footerPhone = document.querySelector('.subfooter address span:nth-child(2)');
        if (footerPhone && config.phone) {
            footerPhone.innerHTML = `<strong>PHONE:</strong> <a href="tel:${escapeHtml(config.phone)}">${escapeHtml(config.phone)}</a>`;
        }

        // Update email in footer
        const footerEmail = document.querySelector('.subfooter address span:nth-child(3)');
        if (footerEmail && config.email) {
            footerEmail.innerHTML = `<strong>EMAIL:</strong> <a href="mailto:${escapeHtml(config.email)}">${escapeHtml(config.email)}</a>`;
        }

        // Update website in footer
        const footerWebsite = document.querySelector('.subfooter address span:nth-child(4)');
        if (footerWebsite && config.website) {
            const websiteUrl = config.website.replace(/^https?:\/\//, '');
            footerWebsite.innerHTML = `<strong>SITE:</strong> <a href="${escapeHtml(config.website)}" target="_blank">${escapeHtml(websiteUrl)}</a>`;
        }

        // Update footer social media links
        const footerSocialContainer = document.querySelector('footer .social-icons');
        if (footerSocialContainer) {
            updateFooterSocialLinks(footerSocialContainer, config);
        }

        // Update copyright year
        const copyrightText = document.querySelector('footer p');
        if (copyrightText && config.company_name) {
            const currentYear = new Date().getFullYear();
            copyrightText.textContent = `© Copyright ${currentYear} by ${escapeHtml(config.company_name)}. All rights reserved.`;
        }
    }

    /**
     * Update site logo in header and footer
     */
    function updateSiteLogo(config) {
        const headerLogo = document.getElementById('site-logo');
        const footerLogo = document.getElementById('footer-logo') || document.querySelector('.subfooter .logo img');
        const applyLogo = (el) => {
            if (!el) return;
            const fallback = el.getAttribute('data-default-logo');
            if (config.logo) {
                el.src = config.logo;
                el.alt = config.logo_alt_text || 'Site Logo';
            } else if (fallback) {
                el.src = fallback;
                el.alt = 'Site Logo';
            }
        };
        applyLogo(headerLogo);
        applyLogo(footerLogo);
    }

    /**
     * Update social media links in header
     */
    function updateSocialLinks(container, config) {
        // Only update if we have social URLs
        if (!config.facebook_url && !config.instagram_url && !config.youtube_url && !config.x_url && !config.linkedin_url) {
            return;
        }

        // Clear existing social links but keep the contact info
        const existingLinks = container.querySelectorAll('a:not([href^="tel:"]):not([href^="mailto:"])');
        existingLinks.forEach(link => link.remove());

        // Add updated social links
        if (config.facebook_url) {
            const link = document.createElement('a');
            link.href = config.facebook_url;
            link.title = 'Facebook';
            link.target = '_blank';
            link.innerHTML = '<span class="ti-facebook"></span>';
            container.appendChild(link);
        }

        if (config.instagram_url) {
            const link = document.createElement('a');
            link.href = config.instagram_url;
            link.title = 'Instagram';
            link.target = '_blank';
            link.innerHTML = '<span class="ti-instagram"></span>';
            container.appendChild(link);
        }

        if (config.youtube_url) {
            const link = document.createElement('a');
            link.href = config.youtube_url;
            link.title = 'YouTube';
            link.target = '_blank';
            link.innerHTML = '<span class="ti-youtube"></span>';
            container.appendChild(link);
        }

        if (config.x_url) {
            const link = document.createElement('a');
            link.href = config.x_url;
            link.title = 'X (Twitter)';
            link.target = '_blank';
            link.innerHTML = '<span class="ti-twitter"></span>';
            container.appendChild(link);
        }

        if (config.linkedin_url) {
            const link = document.createElement('a');
            link.href = config.linkedin_url;
            link.title = 'LinkedIn';
            link.target = '_blank';
            link.innerHTML = '<span class="ti-linkedin"></span>';
            container.appendChild(link);
        }
    }

    /**
     * Update social media links in footer
     */
    function updateFooterSocialLinks(container, config) {
        // Clear existing links
        container.innerHTML = '';

        // Add updated social links
        if (config.facebook_url) {
            const link = document.createElement('a');
            link.href = config.facebook_url;
            link.title = 'Facebook';
            link.target = '_blank';
            link.innerHTML = '<span class="ti-facebook"></span>';
            container.appendChild(link);
        }

        if (config.instagram_url) {
            const link = document.createElement('a');
            link.href = config.instagram_url;
            link.title = 'Instagram';
            link.target = '_blank';
            link.innerHTML = '<span class="ti-instagram"></span>';
            container.appendChild(link);
        }

        if (config.youtube_url) {
            const link = document.createElement('a');
            link.href = config.youtube_url;
            link.title = 'YouTube';
            link.target = '_blank';
            link.innerHTML = '<span class="ti-youtube"></span>';
            container.appendChild(link);
        }

        if (config.x_url) {
            const link = document.createElement('a');
            link.href = config.x_url;
            link.title = 'X (Twitter)';
            link.target = '_blank';
            link.innerHTML = '<span class="ti-twitter"></span>';
            container.appendChild(link);
        }

        if (config.linkedin_url) {
            const link = document.createElement('a');
            link.href = config.linkedin_url;
            link.title = 'LinkedIn';
            link.target = '_blank';
            link.innerHTML = '<span class="ti-linkedin"></span>';
            container.appendChild(link);
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

    // Fetch and apply site configuration on page load
    fetchSiteConfig();
});
