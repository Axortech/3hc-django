from django.contrib import admin
from .models import Banner, About, Project, Lead, BlogPost, SiteLogo, SiteConfig, Service, ServiceCategory, Client, TeamMember, Career, Notice, JobApplication

@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "slug", "is_active", "order", "created_at")
    list_editable = ("is_active", "order")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "description")
    readonly_fields = ("created_at",)

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "phone", "is_active", "order", "created_at")
    list_editable = ("is_active", "order")
    search_fields = ("name", "address", "phone")
    readonly_fields = ("created_at", "updated_at")
    
    fieldsets = (
        ("Company Information", {
            "fields": ("name", "logo")
        }),
        ("Contact Details", {
            "fields": ("address", "phone", "website")
        }),
        ("About", {
            "fields": ("about",)
        }),
        ("Status & Display", {
            "fields": ("is_active", "order"),
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "status", "category", "is_featured", "order", "view_count", "published_at", "created_at")
    list_filter = ("status", "is_featured", "category", "created_at")
    search_fields = ("title", "content")
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ("created_at", "updated_at", "published_at", "view_count")
    
    fieldsets = (
        ("Basic Information", {
            "fields": ("title", "slug", "status")
        }),
        ("Content", {
            "fields": ("featured_image", "featured_image_alt", "excerpt", "content")
        }),
        ("Organization", {
            "fields": ("category", "is_featured", "order"),
        }),
        ("SEO & Search Optimization", {
            "fields": (
                "meta_description",
                "meta_keywords",
                "focus_keyword",
                "og_title",
                "og_description",
                "canonical_url",
                "robots_meta"
            ),
            "description": "Configure search engine visibility and social media sharing"
        }),
        ("Statistics", {
            "fields": ("view_count", "created_at", "updated_at", "published_at"),
            "classes": ("collapse",)
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # Editing an existing object
            return self.readonly_fields + ("slug",)
        return self.readonly_fields

@admin.register(SiteLogo)
class SiteLogoAdmin(admin.ModelAdmin):
    list_display = ("id", "alt_text", "updated_at")
    search_fields = ("alt_text",)
    readonly_fields = ("updated_at",)
    
    fieldsets = (
        ("Logo Information", {
            "fields": ("logo", "alt_text")
        }),
        ("Metadata", {
            "fields": ("updated_at",),
            "classes": ("collapse",)
        }),
    )

@admin.register(SiteConfig)
class SiteConfigAdmin(admin.ModelAdmin):
    list_display = ("id", "company_name", "email", "phone", "updated_at")
    list_filter = ("created_at",)
    search_fields = ("company_name", "email", "address")
    readonly_fields = ("created_at", "updated_at")
    
    fieldsets = (
        ("Company Information", {
            "fields": ("company_name", "address", "phone", "email", "website", "about_excerpt")
        }),
        ("Logo", {
            "fields": ("logo", "logo_alt_text")
        }),
        ("Social Media Links", {
            "fields": ("facebook_url", "instagram_url", "youtube_url", "x_url", "linkedin_url"),
            "classes": ("collapse",)
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )

@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "subtitle", "media_type", "updated_at")
    search_fields = ("title", "subtitle")
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        ("Banner Content", {
            "fields": ("title", "subtitle", "media_type")
        }),
        ("Video Settings", {
            "fields": ("video", "video_poster", "video_autoplay", "video_muted", "video_loop"),
            "description": "Upload a video file for the banner background. Poster image is shown before video loads.",
            "classes": ("collapse",)
        }),
        ("Photo Settings", {
            "fields": ("photo",),
            "description": "Upload a photo/image for the banner.",
            "classes": ("collapse",)
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )

@admin.register(About)
class AboutAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "is_published", "updated_at")
    search_fields = ("title", "content")
    readonly_fields = ("updated_at",)
    
    fieldsets = (
        ("Main Content", {
            "fields": ("title", "content", "image", "is_published")
        }),
        ("Our Mission", {
            "fields": ("mission_title", "mission_content", "mission_image"),
            "classes": ("collapse",)
        }),
        ("Our Vision", {
            "fields": ("vision_title", "vision_content", "vision_image"),
            "classes": ("collapse",)
        }),
        ("Our Goals", {
            "fields": ("goals_title", "goals_content", "goals_image"),
            "classes": ("collapse",)
        }),
        ("Our Achievements", {
            "fields": ("achievements_title", "achievements_content", "achievements_image"),
            "classes": ("collapse",)
        }),
        ("Metadata", {
            "fields": ("updated_at",),
            "classes": ("collapse",)
        }),
    )

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "status", "is_featured", "start_date", "end_date")
    list_filter = ("status", "is_featured")
    search_fields = ("title", "short_description")

@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "email", "phone", "is_read", "created_at")
    list_editable = ("is_read",)
    search_fields = ("name", "email", "phone", "message")

@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "author", "status", "is_featured", "view_count", "published_at", "created_at")
    list_filter = ("status", "is_featured", "category", "created_at")
    search_fields = ("title", "author", "content", "tags")
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ("created_at", "updated_at", "published_at", "view_count")
    
    fieldsets = (
        ("Basic Information", {
            "fields": ("title", "slug", "author", "status")
        }),
        ("Content", {
            "fields": ("featured_image", "featured_image_alt", "thumbnail", "excerpt", "content")
        }),
        ("Organization", {
            "fields": ("category", "tags"),
        }),
        ("SEO & Search Optimization", {
            "fields": (
                "meta_description", 
                "meta_keywords", 
                "focus_keyword",
                "og_title",
                "og_description",
                "canonical_url",
                "robots_meta"
            ),
            "description": "Configure search engine visibility and social media sharing"
        }),
        ("Settings", {
            "fields": ("is_featured",)
        }),
        ("Statistics", {
            "fields": ("view_count", "created_at", "updated_at", "published_at"),
            "classes": ("collapse",)
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # Editing an existing object
            return self.readonly_fields + ("slug",)
        return self.readonly_fields



admin.site.register(TeamMember)


@admin.register(Career)
class CareerAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "location", "job_type", "status", "is_featured", "application_deadline", "view_count", "published_at", "created_at")
    list_filter = ("status", "job_type", "is_featured", "created_at")
    search_fields = ("title", "location", "department", "requirements")
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ("created_at", "updated_at", "published_at", "view_count")
    list_editable = ("is_featured", "status")

    fieldsets = (
        ("Basic Information", {
            "fields": ("title", "slug", "status")
        }),
        ("Job Details", {
            "fields": ("location", "job_type", "department", "experience_required", "salary_range", "short_description")
        }),
        ("Job Description", {
            "fields": ("requirements", "responsibilities", "qualifications", "benefits")
        }),
        ("Application Information", {
            "fields": ("application_email", "application_url", "application_deadline"),
            "description": "Configure how candidates can apply for this position"
        }),
        ("Display Settings", {
            "fields": ("is_featured", "order"),
        }),
        ("Statistics", {
            "fields": ("view_count", "created_at", "updated_at", "published_at"),
            "classes": ("collapse",)
        }),
    )

    def get_readonly_fields(self, request, obj=None):
        if obj:  # Editing an existing object
            return self.readonly_fields + ("slug",)
        return self.readonly_fields


@admin.register(Notice)
class NoticeAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "status", "priority", "notice_date", "expiry_date", "is_sticky", "is_featured", "view_count", "published_at", "created_at")
    list_filter = ("status", "priority", "is_sticky", "is_featured", "created_at")
    search_fields = ("title", "content", "excerpt")
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ("created_at", "updated_at", "published_at", "view_count")
    list_editable = ("is_sticky", "is_featured", "status", "priority")

    fieldsets = (
        ("Basic Information", {
            "fields": ("title", "slug", "status", "priority")
        }),
        ("Content", {
            "fields": ("excerpt", "content", "featured_image", "attachment")
        }),
        ("Dates", {
            "fields": ("notice_date", "expiry_date"),
            "description": "Set the notice date and optional expiry date"
        }),
        ("Display Settings", {
            "fields": ("is_sticky", "is_featured", "order"),
            "description": "Control how this notice appears on the website"
        }),
        ("Statistics", {
            "fields": ("view_count", "created_at", "updated_at", "published_at"),
            "classes": ("collapse",)
        }),
    )

    def get_readonly_fields(self, request, obj=None):
        if obj:  # Editing an existing object
            return self.readonly_fields + ("slug",)
        return self.readonly_fields

@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ("id", "full_name", "email", "career", "status", "created_at", "reviewed_at")
    list_filter = ("status", "career", "created_at", "reviewed_at")
    search_fields = ("full_name", "email", "phone", "career__title")
    readonly_fields = ("created_at", "updated_at", "reviewed_at")
    list_editable = ("status",)

    fieldsets = (
        ("Career Position", {
            "fields": ("career",)
        }),
        ("Applicant Information", {
            "fields": ("full_name", "email", "phone", "address")
        }),
        ("Professional Background", {
            "fields": ("current_position", "current_company", "total_experience", "education")
        }),
        ("Application Materials", {
            "fields": ("cover_letter", "resume", "portfolio_url")
        }),
        ("Additional Details", {
            "fields": ("expected_salary", "availability")
        }),
        ("Application Status", {
            "fields": ("status", "admin_notes"),
            "description": "Update application status and add internal notes"
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at", "reviewed_at"),
            "classes": ("collapse",)
        }),
    )
