from django.db import models, transaction
from django.utils import timezone
from django.utils.text import slugify
from django.core.files.storage import default_storage
from django.core.exceptions import ObjectDoesNotExist


class Banner(models.Model):
    title = models.CharField(max_length=200, blank=True)
    subtitle = models.CharField(max_length=400, blank=True)
    video = models.FileField(upload_to="banners/videos/", null=True, blank=True)
    video_poster = models.ImageField(upload_to="banners/posters/", null=True, blank=True)
    video_autoplay = models.BooleanField(default=True)
    video_muted = models.BooleanField(default=True)
    video_loop = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "-updated_at"]
        verbose_name = "Banner"
        verbose_name_plural = "Banners"

    def __str__(self):
        return self.title or f"Banner #{self.pk}"


class About(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    image = models.ImageField(upload_to="about/images/", null=True, blank=True)

    # Mission, Vision, Goals, Achievements
    mission_title = models.CharField(max_length=200, default="Our Mission", blank=True)
    mission_content = models.TextField(blank=True)
    mission_image = models.ImageField(upload_to="about/mission/", null=True, blank=True)

    vision_title = models.CharField(max_length=200, default="Our Vision", blank=True)
    vision_content = models.TextField(blank=True)
    vision_image = models.ImageField(upload_to="about/vision/", null=True, blank=True)

    goals_title = models.CharField(max_length=200, default="Our Goals", blank=True)
    goals_content = models.TextField(blank=True)
    goals_image = models.ImageField(upload_to="about/goals/", null=True, blank=True)

    achievements_title = models.CharField(max_length=200, default="Our Achievements", blank=True)
    achievements_content = models.TextField(blank=True)
    achievements_image = models.ImageField(upload_to="about/achievements/", null=True, blank=True)

    is_published = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "About Page Content"
        verbose_name_plural = "About Page Contents"

    def __str__(self):
        return self.title


class ProjectCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Project Category"
        verbose_name_plural = "Project Categories"
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Project(models.Model):
    STATUS_CHOICES = [
        ("ongoing", "Ongoing"),
        ("completed", "Completed"),
        ("planned", "Planned"),
    ]

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=300, unique=True, blank=True)
    short_description = models.CharField(max_length=500, blank=True)
    long_description = models.TextField(blank=True)
    cover_image = models.ImageField(upload_to="projects/covers/", null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="planned")
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    is_featured = models.BooleanField(default=False)
    category = models.ForeignKey(
        ProjectCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name="projects"
    )
    is_deleted = models.BooleanField(default=False, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_featured", "-created_at"]
        verbose_name = "Project"
        verbose_name_plural = "Projects"

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            while Project.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)


class ProjectImage(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="projects/gallery/")
    caption = models.CharField(max_length=255, blank=True)
    alt_text = models.CharField(max_length=255, blank=True)
    order = models.PositiveSmallIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Project Image"
        verbose_name_plural = "Project Images"

    def __str__(self):
        return f"Image for {self.project.title}"


class Lead(models.Model):
    STATUS_CHOICES = [
        ("new", "New"),
        ("contacted", "Contacted"),
        ("qualified", "Qualified"),
        ("lost", "Lost"),
    ]

    name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=50, blank=True)
    message = models.TextField()
    attached_file = models.FileField(upload_to="leads/files/", null=True, blank=True)
    source = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="new")
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Lead"
        verbose_name_plural = "Leads"

    def __str__(self):
        return f"{self.name} <{self.email}>"


class TeamMember(models.Model):
    name = models.CharField(max_length=150)
    position = models.CharField(max_length=150)
    bio = models.TextField(blank=True)
    photo = models.ImageField(upload_to="team/photos/", null=True, blank=True)
    linkedin_url = models.URLField(blank=True)
    facebook_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "name"]


class Client(models.Model):
    name = models.CharField(max_length=255, unique=True)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    about = models.TextField(blank=True)
    website = models.URLField(blank=True)
    logo = models.ImageField(upload_to="clients/logos/", null=True, blank=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "name"]


class BlogCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Blog Category"
        verbose_name_plural = "Blog Categories"
        ordering = ["order", "name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class BlogPost(models.Model):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("published", "Published"),
        ("archived", "Archived"),
    ]

    ROBOTS_CHOICES = [
        ("index, follow", "Index & Follow"),
        ("noindex, follow", "No Index, Follow"),
        ("index, nofollow", "Index, No Follow"),
        ("noindex, nofollow", "No Index, No Follow"),
    ]

    title = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=300, unique=True, blank=True)
    author = models.CharField(max_length=150, blank=True)
    featured_image = models.ImageField(upload_to="blog/featured/", null=True, blank=True)
    featured_image_alt = models.CharField(max_length=255, blank=True)
    thumbnail = models.ImageField(upload_to="blog/thumbnails/", null=True, blank=True)
    excerpt = models.CharField(max_length=500, blank=True)
    content = models.TextField()  # Markdown
    reading_time_minutes = models.PositiveSmallIntegerField(null=True, blank=True, editable=False)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    tags = models.CharField(max_length=255, blank=True)
    category = models.ForeignKey(BlogCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name="posts")

    meta_description = models.CharField(max_length=160, blank=True)
    meta_keywords = models.CharField(max_length=255, blank=True)
    focus_keyword = models.CharField(max_length=100, blank=True)
    og_title = models.CharField(max_length=100, blank=True)
    og_description = models.CharField(max_length=160, blank=True)
    canonical_url = models.URLField(blank=True)
    robots_meta = models.CharField(max_length=50, choices=ROBOTS_CHOICES, default="index, follow")

    view_count = models.PositiveIntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-published_at", "-created_at"]
        indexes = [
            models.Index(fields=["-published_at"]),
            models.Index(fields=["slug"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            while BlogPost.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug

        # Auto reading time (rough estimate: ~200 words per minute)
        if self.content:
            words = len(self.content.split())
            self.reading_time_minutes = max(1, round(words / 200))

        # Published timestamp logic
        if self.status == "published" and not self.published_at:
            self.published_at = timezone.now()
        elif self.status != "published":
            self.published_at = None

        super().save(*args, **kwargs)


class ServiceCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Service(models.Model):
    STATUS_CHOICES = BlogPost.STATUS_CHOICES  # Reuse same choices
    ROBOTS_CHOICES = BlogPost.ROBOTS_CHOICES

    title = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=300, unique=True, blank=True)
    excerpt = models.CharField(max_length=500, blank=True)
    featured_image = models.ImageField(upload_to="services/featured/", null=True, blank=True)
    featured_image_alt = models.CharField(max_length=255, blank=True)
    content = models.TextField()  # Markdown
    reading_time_minutes = models.PositiveSmallIntegerField(null=True, blank=True, editable=False)

    category = models.ForeignKey(
        ServiceCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name="services"
    )

    meta_description = models.CharField(max_length=160, blank=True)
    meta_keywords = models.CharField(max_length=255, blank=True)
    focus_keyword = models.CharField(max_length=100, blank=True)
    og_title = models.CharField(max_length=100, blank=True)
    og_description = models.CharField(max_length=160, blank=True)
    canonical_url = models.URLField(blank=True)
    robots_meta = models.CharField(max_length=50, choices=ROBOTS_CHOICES, default="index, follow")

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    is_featured = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    view_count = models.PositiveIntegerField(default=0)
    is_deleted = models.BooleanField(default=False, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-is_featured", "order", "-created_at"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            while Service.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug

        if self.content:
            words = len(self.content.split())
            self.reading_time_minutes = max(1, round(words / 200))

        if self.status == "published" and not self.published_at:
            self.published_at = timezone.now()
        elif self.status != "published":
            self.published_at = None

        super().save(*args, **kwargs)


class SiteLogo(models.Model):
    """Singleton model for site logo - only one logo is maintained"""
    logo = models.ImageField(upload_to="site_logos/")
    alt_text = models.CharField(max_length=255, default="Site Logo")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Site Logo"
        verbose_name_plural = "Site Logo"

    def save(self, *args, **kwargs):
        # Ensure only one instance exists
        if self.pk:
            try:
                old = SiteLogo.objects.get(pk=self.pk)
                if old.logo and old.logo != self.logo and default_storage.exists(old.logo.name):
                    default_storage.delete(old.logo.name)
            except ObjectDoesNotExist:
                pass
        else:
            # Delete existing logo if adding new one
            SiteLogo.objects.all().delete()
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.logo and default_storage.exists(self.logo.name):
            default_storage.delete(self.logo.name)
        super().delete(*args, **kwargs)

    @classmethod
    def get_logo(cls):
        """Get the single site logo"""
        return cls.objects.first()

    def __str__(self):
        return "Site Logo"


class SiteConfig(models.Model):
    """Singleton model for site configuration - only one config is active"""
    company_name = models.CharField(max_length=255)
    about_excerpt = models.TextField(blank=True)
    address = models.TextField()
    phone = models.CharField(max_length=50)
    email = models.EmailField()
    website = models.URLField(blank=True)
    business_hours = models.CharField(max_length=200, blank=True, help_text="e.g., Monday - Friday 08:00am ~ 05:00pm")

    # Direct logo image field (no ForeignKey needed)
    logo = models.ImageField(upload_to="site_logos/", null=True, blank=True)
    logo_alt_text = models.CharField(max_length=255, default="Site Logo", blank=True)

    facebook_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)
    youtube_url = models.URLField(blank=True)
    x_url = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True)

    custom_link_url = models.URLField(blank=True)
    custom_link_text = models.CharField(max_length=255, blank=True)

    # Analytics & Tracking
    google_analytics_id = models.CharField(max_length=100, blank=True, help_text="Google Analytics ID (GA4)")
    google_tag_manager_id = models.CharField(max_length=100, blank=True, help_text="Google Tag Manager ID (GTM)")
    facebook_pixel_id = models.CharField(max_length=100, blank=True, help_text="Facebook Pixel ID")
    hotjar_id = models.CharField(max_length=100, blank=True, help_text="Hotjar Site ID")
    clarity_id = models.CharField(max_length=100, blank=True, help_text="Microsoft Clarity Project ID")
    custom_tracking_code = models.TextField(blank=True, help_text="Custom tracking/analytics code snippet")
    
    # Performance & SEO
    enable_analytics = models.BooleanField(default=True)
    enable_tracking = models.BooleanField(default=True)
    recaptcha_site_key = models.CharField(max_length=255, blank=True, help_text="Google reCAPTCHA v3 Site Key")
    recaptcha_secret_key = models.CharField(max_length=255, blank=True, help_text="Google reCAPTCHA v3 Secret Key")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Site Configuration"
        verbose_name_plural = "Site Configuration"

    def __str__(self):
        return f"{self.company_name} Configuration"

    def save(self, *args, **kwargs):
        """Ensure only one config instance exists"""
        # Delete old logo file if being replaced
        if self.pk:
            try:
                old = SiteConfig.objects.get(pk=self.pk)
                if old.logo and old.logo != self.logo and default_storage.exists(old.logo.name):
                    default_storage.delete(old.logo.name)
            except ObjectDoesNotExist:
                pass
        else:
            # Delete existing config when creating new one (singleton pattern)
            SiteConfig.objects.all().delete()
        
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """Delete logo file when config is deleted"""
        if self.logo and default_storage.exists(self.logo.name):
            default_storage.delete(self.logo.name)
        super().delete(*args, **kwargs)

    @classmethod
    def get_config(cls):
        """Get or create the single site configuration"""
        config, created = cls.objects.get_or_create(pk=1)
        return config


class Career(models.Model):
    """Career/Job opportunities model"""
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("active", "Active"),
        ("closed", "Closed"),
    ]

    JOB_TYPE_CHOICES = [
        ("full_time", "Full Time"),
        ("part_time", "Part Time"),
        ("contract", "Contract"),
        ("internship", "Internship"),
    ]

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=300, unique=True, blank=True)
    location = models.CharField(max_length=200)
    job_type = models.CharField(max_length=20, choices=JOB_TYPE_CHOICES, default="full_time")
    department = models.CharField(max_length=100, blank=True)
    experience_required = models.CharField(max_length=100, blank=True, help_text="e.g., 3-5 years")
    salary_range = models.CharField(max_length=100, blank=True, help_text="Optional salary range")

    short_description = models.CharField(max_length=500, blank=True)
    requirements = models.TextField(help_text="Job requirements (one per line or markdown)")
    responsibilities = models.TextField(blank=True, help_text="Job responsibilities (one per line or markdown)")
    qualifications = models.TextField(blank=True, help_text="Required qualifications")
    benefits = models.TextField(blank=True, help_text="Job benefits")

    application_email = models.EmailField(blank=True, help_text="Email to receive applications")
    application_url = models.URLField(blank=True, help_text="External application URL")
    application_deadline = models.DateField(null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    is_featured = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    view_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-is_featured", "order", "-created_at"]
        verbose_name = "Career"
        verbose_name_plural = "Careers"
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            while Career.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug

        if self.status == "active" and not self.published_at:
            self.published_at = timezone.now()
        elif self.status != "active":
            self.published_at = None

        super().save(*args, **kwargs)


class Notice(models.Model):
    """Notice/Announcement model"""
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("published", "Published"),
        ("archived", "Archived"),
    ]

    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("normal", "Normal"),
        ("high", "High"),
        ("urgent", "Urgent"),
    ]

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=300, unique=True, blank=True)
    content = models.TextField(help_text="Notice content (supports markdown)")
    excerpt = models.CharField(max_length=500, blank=True, help_text="Short summary")

    attachment = models.FileField(upload_to="notices/attachments/", null=True, blank=True, help_text="PDF or document attachment")
    featured_image = models.ImageField(upload_to="notices/images/", null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default="normal")

    notice_date = models.DateField(help_text="Date of the notice")
    expiry_date = models.DateField(null=True, blank=True, help_text="Optional expiry date")

    is_featured = models.BooleanField(default=False)
    is_sticky = models.BooleanField(default=False, help_text="Pin to top")
    order = models.PositiveIntegerField(default=0)
    view_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-is_sticky", "-is_featured", "-notice_date", "-created_at"]
        verbose_name = "Notice"
        verbose_name_plural = "Notices"
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["status"]),
            models.Index(fields=["-notice_date"]),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            while Notice.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug

        if self.status == "published" and not self.published_at:
            self.published_at = timezone.now()
        elif self.status != "published":
            self.published_at = None

        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        """Check if notice has expired"""
        if self.expiry_date:
            return timezone.now().date() > self.expiry_date
        return False


class JobApplication(models.Model):
    """Job Application model for career opportunities"""
    STATUS_CHOICES = [
        ("pending", "Pending Review"),
        ("reviewing", "Under Review"),
        ("shortlisted", "Shortlisted"),
        ("rejected", "Rejected"),
        ("accepted", "Accepted"),
    ]

    career = models.ForeignKey(Career, on_delete=models.CASCADE, related_name="applications")

    # Applicant Information
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=50)
    address = models.TextField(blank=True)

    # Professional Information
    current_position = models.CharField(max_length=255, blank=True)
    current_company = models.CharField(max_length=255, blank=True)
    total_experience = models.CharField(max_length=100, blank=True, help_text="e.g., 5 years")
    education = models.TextField(blank=True, help_text="Educational qualifications")

    # Application Content
    cover_letter = models.TextField(help_text="Cover letter (supports HTML from Quill editor)")
    resume = models.FileField(upload_to="applications/resumes/", help_text="Upload resume (PDF, DOC, DOCX)")
    portfolio_url = models.URLField(blank=True, help_text="Link to portfolio/LinkedIn")

    # Additional Information
    expected_salary = models.CharField(max_length=100, blank=True)
    availability = models.CharField(max_length=100, blank=True, help_text="e.g., Immediate, 2 weeks notice")

    # Status and Metadata
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    admin_notes = models.TextField(blank=True, help_text="Internal notes (not visible to applicant)")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Job Application"
        verbose_name_plural = "Job Applications"
        indexes = [
            models.Index(fields=["career", "status"]),
            models.Index(fields=["-created_at"]),
            models.Index(fields=["email"]),
        ]

    def __str__(self):
        return f"{self.full_name} - {self.career.title}"

    def save(self, *args, **kwargs):
        # Set reviewed_at when status changes from pending
        if self.pk:
            old_instance = JobApplication.objects.get(pk=self.pk)
            if old_instance.status == "pending" and self.status != "pending" and not self.reviewed_at:
                self.reviewed_at = timezone.now()
        super().save(*args, **kwargs)