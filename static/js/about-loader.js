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
   * Fetch team members from API
   */
  const fetchTeamMembers = async () => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/team-members/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        console.warn('[AboutLoader] Failed to fetch team members:', response.status);
        return [];
      }

      const data = await response.json();
      // Handle paginated response structure
      let teamMembers = [];
      if (data.results && Array.isArray(data.results)) {
        teamMembers = data.results;
      } else if (Array.isArray(data)) {
        teamMembers = data;
      } else if (data && Array.isArray(data)) {
        teamMembers = data;
      }

      console.log('[AboutLoader] Fetched team members:', teamMembers);
      return teamMembers;
    } catch (error) {
      console.error('[AboutLoader] Error fetching team members:', error);
      return [];
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
      }
    }

    const aboutContent = document.querySelector('[data-about-content]');
    if (aboutContent) {
      if (aboutData.content) {
        // Format content with proper paragraphs
        const formattedContent = aboutData.content
          .split('\n')
          .filter(line => line.trim())
          .map(line => `<p>${line.trim()}</p>`)
          .join('');
        aboutContent.innerHTML = formattedContent || aboutData.content;
        console.log('[AboutLoader] Updated content');
      }
    }

    // Update main about image
    const aboutImage = document.querySelector('[data-about-image]');
    const aboutImageContainer = document.querySelector('[data-about-image-container]');
    if (aboutImage && aboutData.image) {
      aboutImage.src = aboutData.image;
      aboutImage.style.display = 'block';
      if (aboutData.title) {
        aboutImage.alt = aboutData.title;
      }
      if (aboutImageContainer) {
        aboutImageContainer.style.display = 'block';
      }
      console.log('[AboutLoader] Updated main image:', aboutData.image);
    } else if (!aboutData.image && aboutImageContainer) {
      aboutImageContainer.style.display = 'none';
    }

    // Update mission section
    const missionTitle = document.querySelector('[data-mission-title]');
    if (missionTitle && aboutData.mission_title) {
      missionTitle.textContent = aboutData.mission_title;
    }

    const missionContent = document.querySelector('[data-mission-content]');
    if (missionContent && aboutData.mission_content) {
      // Format mission content with proper line breaks
      const formattedMission = aboutData.mission_content
        .split('\n')
        .filter(line => line.trim())
        .map(line => `<p>${line.trim()}</p>`)
        .join('');
      missionContent.innerHTML = formattedMission || aboutData.mission_content;
    }

    // Update vision section
    const visionTitle = document.querySelector('[data-vision-title]');
    if (visionTitle && aboutData.vision_title) {
      visionTitle.textContent = aboutData.vision_title;
    }

    const visionContent = document.querySelector('[data-vision-content]');
    if (visionContent && aboutData.vision_content) {
      // Format vision content with proper line breaks
      const formattedVision = aboutData.vision_content
        .split('\n')
        .filter(line => line.trim())
        .map(line => `<p>${line.trim()}</p>`)
        .join('');
      visionContent.innerHTML = formattedVision || aboutData.vision_content;
    }

    // Update goals section
    const goalsTitle = document.querySelector('[data-goals-title]');
    if (goalsTitle && aboutData.goals_title) {
      goalsTitle.textContent = aboutData.goals_title;
    }

    const goalsContent = document.querySelector('[data-goals-content]');
    if (goalsContent && aboutData.goals_content) {
      // Format goals content - handle lists better
      let formattedGoals = aboutData.goals_content;
      
      // Check if it's a numbered or bulleted list
      if (aboutData.goals_content.includes('\n')) {
        const lines = aboutData.goals_content.split('\n').filter(line => line.trim());
        
        // Check if it looks like a list (starts with numbers or bullets)
        const isList = lines.some(line => /^[\d•\-\*]/.test(line.trim()));
        
        if (isList) {
          formattedGoals = '<ul style="list-style: none; padding-left: 0; text-align: left; display: inline-block;">';
          lines.forEach(line => {
            const cleanLine = line.trim().replace(/^[\d\.\)•\-\*]\s*/, '');
            if (cleanLine) {
              formattedGoals += `<li style="margin-bottom: 10px; padding-left: 25px; position: relative;">
                <i class="fa fa-check" style="position: absolute; left: 0; top: 3px; color: #ff6600;"></i>
                ${cleanLine}
              </li>`;
            }
          });
          formattedGoals += '</ul>';
        } else {
          formattedGoals = lines.map(line => `<p>${line.trim()}</p>`).join('');
        }
      }
      
      goalsContent.innerHTML = formattedGoals;
    }

    // Update achievements section
    const achievementsSection = document.querySelector('[data-achievements-section]');
    const achievementsTitle = document.querySelector('[data-achievements-title]');
    const achievementsContent = document.querySelector('[data-achievements-content]');
    
    if (aboutData.achievements_content && achievementsContent) {
      // Show achievements section
      if (achievementsSection) {
        achievementsSection.style.display = 'block';
      }
      
      if (achievementsTitle && aboutData.achievements_title) {
        achievementsTitle.textContent = aboutData.achievements_title;
      }
      
      // Format achievements content - handle lists better
      let formattedAchievements = aboutData.achievements_content;
      
      if (aboutData.achievements_content.includes('\n')) {
        const lines = aboutData.achievements_content.split('\n').filter(line => line.trim());
        
        // Check if it looks like a list
        const isList = lines.some(line => /^[\d•\-\*]/.test(line.trim()));
        
        if (isList) {
          formattedAchievements = '<div class="row" style="margin-top: 20px;">';
          lines.forEach((line, index) => {
            const cleanLine = line.trim().replace(/^[\d\.\)•\-\*]\s*/, '');
            if (cleanLine) {
              formattedAchievements += `
                <div class="col-md-4 col-sm-6" style="margin-bottom: 20px;">
                  <div style="text-align: center; padding: 20px; background: #fff; border-radius: 8px; box-shadow: 0 3px 10px rgba(0,0,0,0.05);">
                    <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #ff6600 0%, #ff8533 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                      <i class="fa fa-trophy" style="font-size: 24px; color: #fff;"></i>
                    </div>
                    <p style="margin: 0; font-size: 15px; font-weight: 600; color: #172434;">${cleanLine}</p>
                  </div>
                </div>
              `;
            }
          });
          formattedAchievements += '</div>';
        } else {
          formattedAchievements = lines.map(line => `<p style="margin-bottom: 15px;">${line.trim()}</p>`).join('');
        }
      }
      
      achievementsContent.innerHTML = formattedAchievements;
      console.log('[AboutLoader] Updated achievements');
    } else if (achievementsSection) {
      // Hide achievements section if no content
      achievementsSection.style.display = 'none';
    }

    // Add hover effects to cards
    document.querySelectorAll('.about-card').forEach(card => {
      card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px)';
        this.style.boxShadow = '0 15px 40px rgba(0,0,0,0.15)';
      });
      card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 5px 20px rgba(0,0,0,0.08)';
      });
    });

    console.log('[AboutLoader] About content update completed');
  };

  /**
   * Update team members section on the page
   */
  const updateTeamMembers = (teamMembers) => {
    const container = document.getElementById('team-members-container');
    const loading = document.getElementById('team-loading');

    if (!container) {
      console.warn('[AboutLoader] Team members container not found');
      return;
    }

    // Remove loading indicator
    if (loading) {
      loading.remove();
    }

    if (!teamMembers || teamMembers.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center">
          <p>No team members found.</p>
        </div>
      `;
      console.warn('[AboutLoader] No team members to display');
      return;
    }

    console.log('[AboutLoader] Updating team members with:', teamMembers);

    // Generate HTML for team members
    const teamHtml = teamMembers.map((member, index) => {
      const animationDelay = 200 + (index * 200); // Stagger animations

      // Build social media links
      let socialLinks = '';
      if (member.linkedin_url) {
        socialLinks += `<a href="${member.linkedin_url}" target="_blank" title="LinkedIn Profile"><span class="ti-linkedin"></span></a> `;
      }
      if (member.facebook_url) {
        socialLinks += `<a href="${member.facebook_url}" target="_blank" title="Facebook Profile"><span class="ti-facebook"></span></a> `;
      }
      if (member.instagram_url) {
        socialLinks += `<a href="${member.instagram_url}" target="_blank" title="Instagram Profile"><span class="ti-instagram"></span></a> `;
      }
      // Default social links if none provided
      if (!socialLinks.trim()) {
        socialLinks = `<a href="#" title="Social Media"><span class="ti-facebook"></span></a> <a href="#" title="Social Media"><span class="ti-twitter"></span></a> <a href="#" title="Social Media"><span class="ti-linkedin"></span></a>`;
      }

      return `
        <div class="col-md-3 col-sm-6">
          <div class="team-wrapper">
            <img alt="${member.name}" class="img-responsive" src="${member.photo}" onerror="this.src='/static/img/avatar.jpg'">
            <div class="team-des">
              <h3>${member.name}</h3>
              <span>${member.position}</span>
              ${socialLinks}
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = teamHtml;
    console.log('[AboutLoader] Team members section updated');
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
    console.log('[AboutLoader] DOM ready, fetching about content and team members...');

    // Fetch about content and team members in parallel
    const [aboutData, teamMembers] = await Promise.all([
      fetchAboutContent(),
      fetchTeamMembers()
    ]);

    // Update both sections
    updateAboutContent(aboutData);
    updateTeamMembers(teamMembers);
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

