// Team Members Loader
// This script fetches team members from the API and dynamically renders them

document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = getApiBaseUrl();
    const TEAM_SECTION_ID = 'team';

    /**
     * Get the API base URL dynamically
     */
    function getApiBaseUrl() {
        const protocol = window.location.protocol;
        const host = window.location.host;
        return `${protocol}//${host}/api`;
    }

    /**
     * Fetch team members from API
     */
    async function fetchTeamMembers() {
        try {
            const response = await fetch(`${API_BASE_URL}/team-members/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            // Handle both paginated and non-paginated responses
            const teamMembers = data.results || data;
            
            if (Array.isArray(teamMembers)) {
                renderTeamMembers(teamMembers);
            } else {
                console.warn('Unexpected API response format', data);
            }
        } catch (error) {
            console.error('Error fetching team members:', error);
            // Fallback: keep hardcoded team members if API fails
        }
    }

    /**
     * Render team members dynamically
     */
    function renderTeamMembers(teamMembers) {
        const teamSection = document.querySelector(`section#${TEAM_SECTION_ID}`);
        
        if (!teamSection) {
            console.warn(`Team section with id "${TEAM_SECTION_ID}" not found`);
            return;
        }

        // Find the container for team members (typically a .container .row)
        const teamContainer = teamSection.querySelector('.container .row');
        
        if (!teamContainer) {
            console.warn('Team container not found within team section');
            return;
        }

        // Clear existing hardcoded team members
        teamContainer.innerHTML = '';

        // Render each team member
        teamMembers.forEach((member) => {
            const teamHTML = createTeamMemberHTML(member);
            teamContainer.innerHTML += teamHTML;
        });

        // Reinitialize animations if needed
        if (typeof onStep !== 'undefined' && onStep.AnimationEngine) {
            onStep.AnimationEngine.reset();
        }
    }

    /**
     * Create HTML for a single team member
     */
    function createTeamMemberHTML(member) {
        const photoUrl = member.photo || `${API_BASE_URL.replace('/api', '')}/static/img/team-img1.jpg`;
        const name = escapeHtml(member.name);
        const position = escapeHtml(member.position);
        
        // Build social media links
        let socialLinks = '';
        
        if (member.facebook_url) {
            socialLinks += `<a href="${escapeHtml(member.facebook_url)}" target="_blank"><span class="ti-facebook"></span></a>`;
        }
        
        if (member.instagram_url) {
            socialLinks += `<a href="${escapeHtml(member.instagram_url)}" target="_blank"><span class="ti-instagram"></span></a>`;
        }
        
        if (member.linkedin_url) {
            socialLinks += `<a href="${escapeHtml(member.linkedin_url)}" target="_blank"><span class="ti-linkedin"></span></a>`;
        }

        return `
            <div class="col-md-3 col-sm-6">
                <div class="team-wrapper">
                    <img
                        alt="team member ${name}"
                        class="img-responsive"
                        src="${escapeHtml(photoUrl)}"
                    />
                    <div class="team-des">
                        <h3>${name}</h3>
                        <span>${position}</span>
                        ${socialLinks}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Escape HTML special characters
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Fetch and render team members on page load
    fetchTeamMembers();
});
