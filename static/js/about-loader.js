/**
 * About Page Content Loader
 * Fetches about information from API and updates the website
 */
(function() {
  'use strict';

  // Get API base URL
  const getApiBaseUrl = () => {
    // Try to get from window.config if available (dashboard)
    if (window.DashboardApp && window.DashboardApp.config && window.DashboardApp.config.apiBaseUrl) {
      return window.DashboardApp.config.apiBaseUrl;
    }
    // Try to get from global config
    if (window.config && window.config.apiBaseUrl) {
      return window.config.apiBaseUrl;
    }
    // Default to same origin (empty string means current domain)
    return '';
  };

  /**
   * Fetch about content from API
   */
  const fetchAboutContent = async () => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/about/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        console.warn('[AboutLoader] Failed to fetch about content:', response.status);
        return null;
      }

      const data = await response.json();
      // Handle paginated response structure
      let aboutData = null;
      if (data.results && Array.isArray(data.results)) {
        // Paginated response - get first entry
        aboutData = data.results.length > 0 ? data.results[0] : null;
      } else if (Array.isArray(data)) {
        // Direct array response
        aboutData = data.length > 0 ? data[0] : null;
      } else {
        // Single object response
        aboutData = data;
      }
      console.log('[AboutLoader] Fetched about data:', aboutData);
      return aboutData;
    } catch (error) {
      console.error('[AboutLoader] Error fetching about content:', error);
      return null;
    }
  };

  /**
   * Update about content on the page
   */
  const updateAboutContent = (aboutData) => {
    if (!aboutData) {
      console.warn('[AboutLoader] No about data to update');
      return;
    }

    console.log('[AboutLoader] Updating about content with:', aboutData);

    // Update main about section
    const aboutTitle = document.querySelector('[data-about-title]');
    if (aboutTitle) {
      if (aboutData.title) {
        aboutTitle.textContent = aboutData.title;
        console.log('[AboutLoader] Updated title:', aboutData.title);
      } else {
        console.warn('[AboutLoader] Title element found but no title data');
      }
    } else {
      console.warn('[AboutLoader] Title element [data-about-title] not found');
    }

    const aboutContent = document.querySelector('[data-about-content]');
    if (aboutContent) {
      if (aboutData.content) {
        aboutContent.innerHTML = aboutData.content;
        console.log('[AboutLoader] Updated content');
      } else {
        console.warn('[AboutLoader] Content element found but no content data');
      }
    } else {
      console.warn('[AboutLoader] Content element [data-about-content] not found');
    }

    // Update main about image
    const aboutImage = document.querySelector('[data-about-image]');
    if (aboutImage) {
      if (aboutData.image) {
        aboutImage.src = aboutData.image;
        aboutImage.style.display = '';
        if (aboutData.title) {
          aboutImage.alt = aboutData.title;
        }
        console.log('[AboutLoader] Updated main image:', aboutData.image);
      } else {
        console.warn('[AboutLoader] No main image data available');
      }
    } else {
      console.warn('[AboutLoader] Main image element [data-about-image] not found');
    }

    // Update mission section
    const missionTitle = document.querySelector('[data-mission-title]');
    if (missionTitle && aboutData.mission_title) {
      missionTitle.textContent = aboutData.mission_title;
    }

    const missionContent = document.querySelector('[data-mission-content]');
    if (missionContent && aboutData.mission_content) {
      missionContent.innerHTML = aboutData.mission_content;
    }

    const missionImage = document.querySelector('[data-mission-image]');
    if (missionImage) {
      if (aboutData.mission_image) {
        // Force reload by clearing src first
        missionImage.src = '';
        missionImage.src = aboutData.mission_image;
        missionImage.style.display = '';
        missionImage.onerror = function() {
          console.error('[AboutLoader] Failed to load mission image:', aboutData.mission_image);
        };
        missionImage.onload = function() {
          console.log('[AboutLoader] Mission image loaded successfully:', aboutData.mission_image);
        };
        if (aboutData.mission_title) {
          missionImage.alt = aboutData.mission_title;
        }
        console.log('[AboutLoader] Updated mission image:', aboutData.mission_image);
      } else {
        console.warn('[AboutLoader] No mission image data available');
      }
    } else {
      console.warn('[AboutLoader] Mission image element [data-mission-image] not found');
    }

    // Update vision section
    const visionTitle = document.querySelector('[data-vision-title]');
    if (visionTitle && aboutData.vision_title) {
      visionTitle.textContent = aboutData.vision_title;
    }

    const visionContent = document.querySelector('[data-vision-content]');
    if (visionContent && aboutData.vision_content) {
      visionContent.innerHTML = aboutData.vision_content;
    }

    const visionImage = document.querySelector('[data-vision-image]');
    if (visionImage) {
      if (aboutData.vision_image) {
        // Force reload by clearing src first
        visionImage.src = '';
        visionImage.src = aboutData.vision_image;
        visionImage.style.display = '';
        visionImage.onerror = function() {
          console.error('[AboutLoader] Failed to load vision image:', aboutData.vision_image);
        };
        visionImage.onload = function() {
          console.log('[AboutLoader] Vision image loaded successfully:', aboutData.vision_image);
        };
        if (aboutData.vision_title) {
          visionImage.alt = aboutData.vision_title;
        }
        console.log('[AboutLoader] Updated vision image:', aboutData.vision_image);
      } else {
        console.warn('[AboutLoader] No vision image data available');
      }
    } else {
      console.warn('[AboutLoader] Vision image element [data-vision-image] not found');
    }

    // Update goals section
    const goalsTitle = document.querySelector('[data-goals-title]');
    if (goalsTitle && aboutData.goals_title) {
      goalsTitle.textContent = aboutData.goals_title;
    }

    const goalsContent = document.querySelector('[data-goals-content]');
    if (goalsContent && aboutData.goals_content) {
      goalsContent.innerHTML = aboutData.goals_content;
    }

    const goalsImage = document.querySelector('[data-goals-image]');
    if (goalsImage) {
      if (aboutData.goals_image) {
        // Force reload by clearing src first
        goalsImage.src = '';
        goalsImage.src = aboutData.goals_image;
        goalsImage.style.display = '';
        goalsImage.onerror = function() {
          console.error('[AboutLoader] Failed to load goals image:', aboutData.goals_image);
        };
        goalsImage.onload = function() {
          console.log('[AboutLoader] Goals image loaded successfully:', aboutData.goals_image);
        };
        if (aboutData.goals_title) {
          goalsImage.alt = aboutData.goals_title;
        }
        console.log('[AboutLoader] Updated goals image:', aboutData.goals_image);
      } else {
        console.warn('[AboutLoader] No goals image data available');
      }
    } else {
      console.warn('[AboutLoader] Goals image element [data-goals-image] not found');
    }

    // Update achievements section
    const achievementsTitle = document.querySelector('[data-achievements-title]');
    if (achievementsTitle && aboutData.achievements_title) {
      achievementsTitle.textContent = aboutData.achievements_title;
    }

    const achievementsContent = document.querySelector('[data-achievements-content]');
    if (achievementsContent && aboutData.achievements_content) {
      achievementsContent.innerHTML = aboutData.achievements_content;
    }

    const achievementsImage = document.querySelector('[data-achievements-image]');
    if (achievementsImage) {
      if (aboutData.achievements_image) {
        achievementsImage.src = aboutData.achievements_image;
        achievementsImage.style.display = '';
        if (aboutData.achievements_title) {
          achievementsImage.alt = aboutData.achievements_title;
        }
        console.log('[AboutLoader] Updated achievements image:', aboutData.achievements_image);
      } else {
        console.warn('[AboutLoader] No achievements image data available');
      }
    } else {
      console.warn('[AboutLoader] Achievements image element [data-achievements-image] not found');
    }

    console.log('[AboutLoader] About content update completed');
  };

  /**
   * Initialize about content loader
   */
  const init = async () => {
    // Wait for DOM to be fully ready
    const waitForDOM = () => {
      return new Promise((resolve) => {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
          // DOM is ready, but wait a bit more for all elements to be rendered
          setTimeout(resolve, 100);
        } else {
          document.addEventListener('DOMContentLoaded', () => {
            setTimeout(resolve, 100);
          });
        }
      });
    };

    await waitForDOM();
    console.log('[AboutLoader] DOM ready, fetching about content...');
    const aboutData = await fetchAboutContent();
    updateAboutContent(aboutData);
  };

  // Auto-initialize
  init();

  // Export for manual use if needed
  window.AboutLoader = {
    fetch: fetchAboutContent,
    update: updateAboutContent,
    init: init
  };
})();

