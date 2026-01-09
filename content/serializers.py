from rest_framework import serializers
from django.contrib.auth.models import User
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        return user
from drf_spectacular.utils import OpenApiExample, extend_schema_serializer, extend_schema_field, OpenApiTypes
from .models import (
    Banner, About, Project, Lead, ProjectCategory, TeamMember,
    BlogPost, BlogCategory, SiteConfig, Service, ServiceCategory, Client, ProjectImage,
    Career, Notice, JobApplication
)

@extend_schema_serializer(
    examples=[
        OpenApiExample(
            "Banner example",
            summary="Example banner entry",
            value={
                "id": 1,
                "title": "Welcome",
                "subtitle": "We build stuff",
                "description": "Optional banner description",
                "video": "http://127.0.0.1:8000/media/banners/videos/banner-video.mp4",
                "video_poster": "http://127.0.0.1:8000/media/banners/posters/poster.jpg",
                "video_autoplay": True,
                "video_muted": True,
                "video_loop": True
            },
        )
    ]
)
class BannerSerializer(serializers.ModelSerializer):
    # Accept uploaded files while still returning absolute URLs in responses
    video = serializers.FileField(required=False, allow_null=True)
    video_poster = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Banner
        fields = [
            "id", "title", "subtitle", "description",
            "video", "video_poster", "video_autoplay", "video_muted", "video_loop",
            "created_at", "updated_at"
        ]
        read_only_fields = ("id", "created_at", "updated_at")

    def _build_url(self, file_field):
        """Return absolute URL for a file field if available."""
        request = self.context.get('request')
        if file_field and hasattr(file_field, 'url'):
            try:
                url = file_field.url
                return request.build_absolute_uri(url) if request else url
            except Exception:
                return None
        return None

    def to_representation(self, instance):
        """Return absolute URLs; banner is video-focused."""
        data = super().to_representation(instance)
        data['video'] = self._build_url(instance.video)
        data['video_poster'] = self._build_url(instance.video_poster)
        return data

    def validate(self, attrs):
        """Ensure video file is present for banner."""
        # Check if video is provided in this request or already exists
        video = attrs.get('video') or (self.instance.video if self.instance else None)
        
        # Video is required for banners
        if not video:
            raise serializers.ValidationError({"video": "Video file is required for banners."})
        
        return attrs

@extend_schema_serializer(
    examples=[
        OpenApiExample(
            "About example",
            summary="Example about page with Mission, Vision, Goals, Achievements",
            value={
                "title": "About 3HC Construction",
                "content": "Founded in 2000, we are a leading construction company...",
                "image": "/media/about/images/company-photo.jpg",
                "mission_title": "Our Mission",
                "mission_content": "To deliver exceptional construction solutions...",
                "vision_title": "Our Vision",
                "vision_content": "To be the most trusted construction partner...",
                "goals_title": "Our Goals",
                "goals_content": "1. Deliver quality projects\n2. Maintain safety standards\n3. Innovate continuously",
                "achievements_title": "Our Achievements",
                "achievements_content": "• 500+ completed projects\n• ISO 9001 certified\n• Award-winning designs",
                "is_published": True
            }
        )
    ]
)
class AboutSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)
    mission_image = serializers.ImageField(required=False, allow_null=True)
    vision_image = serializers.ImageField(required=False, allow_null=True)
    goals_image = serializers.ImageField(required=False, allow_null=True)
    achievements_image = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = About
        fields = [
            "id", "title", "content", "image", "mission_title", "mission_content", "mission_image",
            "vision_title", "vision_content", "vision_image", "goals_title", "goals_content", "goals_image",
            "achievements_title", "achievements_content", "achievements_image", "is_published", "updated_at"
        ]
        read_only_fields = ("id", "updated_at")
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        
        # Convert all image fields to absolute URLs
        image_fields = ['image', 'mission_image', 'vision_image', 'goals_image', 'achievements_image']
        for field in image_fields:
            image = getattr(instance, field, None)
            if image and hasattr(image, 'url'):
                try:
                    url = image.url
                    data[field] = request.build_absolute_uri(url) if request else url
                except Exception:
                    data[field] = None
            else:
                data[field] = None
        
        return data

@extend_schema_serializer(
    examples=[
        OpenApiExample(
            "Project Category Example", 
            value={
                "name": "Residential", 
                "slug": "residential",
                "description": "Houses and apartments",
                "is_active": True
            }
        )
    ]
)
class ProjectCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectCategory
        fields = [
            "id", "name", "slug", "description", "is_active", "created_at"
        ]
        read_only_fields = ("id", "slug", "created_at")


@extend_schema_serializer(
    examples=[
        OpenApiExample(
            "Blog Category Example", 
            value={
                "name": "Technology", 
                "slug": "technology",
                "description": "Articles about technology and innovation",
                "is_active": True
            }
        )
    ]
)
class BlogCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogCategory
        fields = [
            "id", "name", "slug", "description", "is_active", "order", "created_at"
        ]
        read_only_fields = ("id", "slug", "created_at")


class ProjectImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectImage
        fields = [
            "id", "project", "image", "caption", "alt_text", "order", "created_at"
        ]
        read_only_fields = ("id", "created_at")

@extend_schema_serializer(
    examples=[
        OpenApiExample(
            "Project example",
            summary="Example project output",
            value={
                "title": "Office Building",
                "slug": "office-building",
                "short_description": "Commercial building",
                "status": "completed",
                "is_featured": True,
                "is_deleted": False
            },
        )
    ]
)
class ProjectSerializer(serializers.ModelSerializer):
    category = ProjectCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=ProjectCategory.objects.all(), source="category", write_only=True, required=False, allow_null=True
    )
    images = ProjectImageSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            "id", "title", "slug", "short_description", "long_description", "cover_image",
            "status", "start_date", "end_date", "is_featured", "category", "category_id",
            "is_deleted", "created_at", "updated_at", "images"
        ]
        read_only_fields = ("id", "slug", "created_at", "updated_at")

@extend_schema_serializer(
    examples=[
        OpenApiExample(
            "Client Example",
            value={
                "id": 1,
                "name": "ABC Construction Ltd.",
                "address": "123 Business Plaza, City, State 12345",
                "phone": "+1 (555) 123-4567",
                "about": "Leading construction company with 20+ years of experience",
                "website": "https://www.abcconstruction.com",
                "logo": "/media/clients/logos/abc-logo.png",
                "is_active": True,
                "order": 1
            }
        )
    ]
)
class ClientSerializer(serializers.ModelSerializer):
    logo = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = Client
        fields = [
            "id", "name", "address", "phone", "about", "website", "logo",
            "is_active", "order", "created_at", "updated_at"
        ]
        read_only_fields = ("id", "created_at", "updated_at")
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if instance.logo and hasattr(instance.logo, 'url'):
            try:
                url = instance.logo.url
                data['logo'] = request.build_absolute_uri(url) if request else url
            except Exception:
                data['logo'] = None
        else:
            data['logo'] = None
        return data

@extend_schema_serializer(
    examples=[
        OpenApiExample(
            "Team Member Example",
            value={
                "name": "John Doe",
                "position": "Civil Engineer",
                "bio": "10 years of experience in structural design.",
                "linkedin_url": "https://linkedin.com/in/john",
                "is_active": True
            }
        )
    ]
)
class TeamMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeamMember
        fields = [
            "id", "name", "position", "bio", "photo", "linkedin_url", "facebook_url",
            "instagram_url", "is_active", "order", "created_at", "updated_at"
        ]
        read_only_fields = ("id", "created_at", "updated_at")

@extend_schema_serializer(
    examples=[
        OpenApiExample(
            "Lead Example",
            value={
                "name": "Jane Smith",
                "email": "jane@example.com",
                "phone": "+1 (555) 987-6543",
                "message": "Interested in your services",
                "source": "website",
                "status": "new",
                "is_read": False
            }
        )
    ]
)
class LeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = [
            "id", "name", "email", "phone", "message", "attached_file",
            "source", "status", "is_read", "created_at"
        ]
        read_only_fields = ("id", "created_at")

@extend_schema_serializer(
    examples=[
        OpenApiExample(
            "Blog Post Example",
            summary="Example blog post with markdown content and robust SEO",
            value={
                "title": "Getting Started with Django",
                "slug": "getting-started-with-django",
                "author": "John Doe",
                "excerpt": "Learn the basics of Django framework",
                "content": "# Django Basics\n\nDjango is a powerful web framework...",
                "featured_image": "/media/blog/featured/django-guide.jpg",
                "featured_image_alt": "Django logo and code snippet",
                "thumbnail": "/media/blog/thumbnails/django-guide-thumb.jpg",
                "reading_time_minutes": 5,
                "status": "published",
                "category": "Web Development",
                "tags": "django,python,web",
                "is_featured": True,
                "is_deleted": False,
                "meta_description": "Complete guide to getting started with Django framework for Python developers",
                "meta_keywords": "django,python,web development,framework",
                "focus_keyword": "django tutorial",
                "og_title": "Getting Started with Django - Complete Guide",
                "og_description": "Learn Django fundamentals with this step-by-step tutorial",
                "robots_meta": "index, follow",
                "view_count": 150
            }
        )
    ]
)
class BlogPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogPost
        fields = [
            "id", "title", "slug", "author", "featured_image", "featured_image_alt",
            "thumbnail", "excerpt", "content", "reading_time_minutes", "status",
            "tags", "category", "meta_description", "meta_keywords", "focus_keyword",
            "og_title", "og_description", "canonical_url", "robots_meta", "view_count",
            "is_featured", "is_deleted", "created_at", "updated_at", "published_at"
        ]
        read_only_fields = (
            "id", "slug", "reading_time_minutes", "view_count",
            "created_at", "updated_at", "published_at"
        )

    def validate_title(self, value):
        """Validate title uniqueness, excluding current instance on updates"""
        instance = self.instance
        queryset = BlogPost.objects.filter(title=value)
        
        # If updating, exclude the current instance
        if instance:
            queryset = queryset.exclude(pk=instance.pk)
        
        if queryset.exists():
            raise serializers.ValidationError("A blog post with this title already exists.")
        
        return value

@extend_schema_serializer(
    examples=[
        OpenApiExample(
            "Service Category Example",
            value={
                "id": 1, 
                "name": "Design Services", 
                "slug": "design-services", 
                "description": "Professional design solutions",
                "icon": "fas fa-building",
                "is_active": True,
                "order": 0
            }
        )
    ]
)
class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = [
            "id", "name", "slug", "description", "icon", "is_active", "order", "created_at"
        ]
        read_only_fields = ("id", "slug", "created_at")

@extend_schema_serializer(
    examples=[
        OpenApiExample(
            "Service Example",
            summary="Complete service page with SEO",
            value={
                "title": "Architectural Design Services",
                "slug": "architectural-design",
                "excerpt": "Professional architectural design for residential and commercial projects",
                "content": "# Architectural Design\n\nWe provide comprehensive architectural design services...",
                "featured_image_alt": "Modern building design",
                "reading_time_minutes": 4,
                "status": "published",
                "category_id": 1,
                "meta_description": "Professional architectural design services for residential and commercial projects",
                "meta_keywords": "architecture, design, services",
                "focus_keyword": "architectural design",
                "og_title": "Architectural Design Services",
                "og_description": "Premium architectural design solutions",
                "robots_meta": "index, follow",
                "is_featured": True,
                "is_deleted": False,
                "order": 1
            }
        )
    ]
)
class ServiceSerializer(serializers.ModelSerializer):
    category = ServiceCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=ServiceCategory.objects.all(),
        source="category",
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = Service
        fields = [
            "id", "title", "slug", "excerpt", "featured_image", "featured_image_alt",
            "content", "reading_time_minutes", "category", "category_id",
            "meta_description", "meta_keywords", "focus_keyword", "og_title",
            "og_description", "canonical_url", "robots_meta", "status",
            "is_featured", "order", "view_count", "is_deleted",
            "created_at", "updated_at", "published_at"
        ]
        read_only_fields = (
            "id", "slug", "reading_time_minutes", "view_count",
            "created_at", "updated_at", "published_at"
        )

@extend_schema_serializer(
    examples=[
        OpenApiExample(
            'Site Configuration Example',
            summary='Company details and social media links',
            description='Complete site configuration with company information, social media profiles, and assigned logo',
            value={
                'id': 1,
                'company_name': '3HC Construction',
                'address': '123 Business Street, City, State 12345',
                'phone': '+1 (555) 123-4567',
                'email': 'info@3hc.com',
                'website': 'https://www.3hc.com',
                'facebook_url': 'https://facebook.com/3hc',
                'instagram_url': 'https://instagram.com/3hc',
                'youtube_url': 'https://youtube.com/@3hc',
                'x_url': 'https://x.com/3hc',
                'linkedin_url': 'https://linkedin.com/company/3hc',
                'custom_link_url': 'https://example.com',
                'custom_link_text': 'View Portfolio',
                'logo': {
                    'id': 1,
                    'alt_text': 'Company Logo',
                    'logo': '/media/site_logos/logo.png',
                    'updated_at': '2025-01-01T10:00:00Z'
                },
                'logo_id': 1,
                'created_at': '2025-01-01T10:00:00Z',
                'updated_at': '2025-01-15T15:30:00Z'
            },
            response_only=True,
        ),
        OpenApiExample(
            'Create Site Configuration',
            summary='Create a new site configuration',
            description='Create configuration with optional logo selection',
            value={
                'company_name': '3HC Construction',
                'address': '123 Business Street, City, State 12345',
                'phone': '+1 (555) 123-4567',
                'email': 'info@3hc.com',
                'website': 'https://www.3hc.com',
                'facebook_url': 'https://facebook.com/3hc',
                'instagram_url': 'https://instagram.com/3hc',
                'youtube_url': 'https://youtube.com/@3hc',
                'x_url': 'https://x.com/3hc',
                'linkedin_url': 'https://linkedin.com/company/3hc',
                'logo_id': 1
            },
            request_only=True,
        )
    ]
)
class SiteConfigSerializer(serializers.ModelSerializer):
    # Accept direct logo upload; return absolute URL in representation
    logo = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = SiteConfig
        fields = [
            'id', 'company_name', 'about_excerpt', 'address', 'phone', 'email', 'website',
            'facebook_url', 'instagram_url', 'youtube_url', 'x_url', 'linkedin_url',
            'logo', 'logo_alt_text', 'business_hours',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')

    @extend_schema_field(OpenApiTypes.URI)
    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if instance.logo and hasattr(instance.logo, 'url'):
            try:
                url = instance.logo.url
                data['logo'] = request.build_absolute_uri(url) if request else url
            except Exception:
                data['logo'] = None
        else:
            data['logo'] = None
        return data


@extend_schema_serializer(
    examples=[
        OpenApiExample(
            "Career Example",
            summary="Job opportunity listing",
            value={
                "id": 1,
                "title": "Senior Civil Engineer",
                "slug": "senior-civil-engineer",
                "location": "Kathmandu, Nepal",
                "job_type": "full_time",
                "department": "Engineering",
                "experience_required": "5-7 years",
                "salary_range": "NPR 80,000 - 120,000",
                "short_description": "We are looking for an experienced civil engineer to join our team",
                "requirements": "- Bachelor's degree in Civil Engineering\n- 5+ years experience\n- Strong technical skills",
                "responsibilities": "- Lead project teams\n- Review designs\n- Ensure quality standards",
                "qualifications": "B.E. or equivalent in Civil Engineering",
                "benefits": "Health insurance, Paid leave, Performance bonus",
                "application_email": "careers@3hc.com",
                "application_deadline": "2025-12-31",
                "status": "active",
                "is_featured": True,
                "order": 1,
                "view_count": 150,
                "published_at": "2025-01-01T10:00:00Z"
            }
        )
    ]
)
class CareerSerializer(serializers.ModelSerializer):
    is_expired = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Career
        fields = [
            "id", "title", "slug", "location", "job_type", "department",
            "experience_required", "salary_range", "short_description",
            "requirements", "responsibilities", "qualifications", "benefits",
            "application_email", "application_url", "application_deadline",
            "status", "is_featured", "order", "view_count",
            "created_at", "updated_at", "published_at", "is_expired"
        ]
        read_only_fields = ("id", "slug", "view_count", "created_at", "updated_at", "published_at")

    @extend_schema_field(OpenApiTypes.BOOL)
    def get_is_expired(self, obj) -> bool:
        """Check if application deadline has passed"""
        if obj.application_deadline:
            from django.utils import timezone
            return timezone.now().date() > obj.application_deadline
        return False


@extend_schema_serializer(
    examples=[
        OpenApiExample(
            "Notice Example",
            summary="Company notice or announcement",
            value={
                "id": 1,
                "title": "Tender Notice for Construction Materials",
                "slug": "tender-notice-construction-materials",
                "content": "# Tender Notice\n\nWe are inviting sealed bids for the supply of construction materials...",
                "excerpt": "Tender notice for construction materials supply",
                "attachment": "/media/notices/attachments/tender-doc.pdf",
                "featured_image": "/media/notices/images/tender.jpg",
                "status": "published",
                "priority": "high",
                "notice_date": "2025-01-15",
                "expiry_date": "2025-02-15",
                "is_featured": True,
                "is_sticky": False,
                "order": 1,
                "view_count": 200,
                "published_at": "2025-01-15T09:00:00Z",
                "is_expired": False
            }
        )
    ]
)
class NoticeSerializer(serializers.ModelSerializer):
    is_expired = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Notice
        fields = [
            "id", "title", "slug", "content", "excerpt", "attachment",
            "featured_image", "status", "priority", "notice_date",
            "expiry_date", "is_featured", "is_sticky", "order",
            "view_count", "created_at", "updated_at", "published_at", "is_expired"
        ]
        read_only_fields = ("id", "slug", "view_count", "created_at", "updated_at", "published_at")

    @extend_schema_field(OpenApiTypes.BOOL)
    def get_is_expired(self, obj) -> bool:
        """Check if notice has expired"""
        return obj.is_expired


@extend_schema_serializer(
    examples=[
        OpenApiExample(
            "Job Application Example",
            summary="Job application submission",
            value={
                "id": 1,
                "career": 1,
                "career_title": "Senior Civil Engineer",
                "full_name": "John Doe",
                "email": "john.doe@example.com",
                "phone": "+977-9876543210",
                "address": "Kathmandu, Nepal",
                "current_position": "Civil Engineer",
                "current_company": "ABC Construction",
                "total_experience": "5 years",
                "education": "B.E. Civil Engineering from Tribhuvan University",
                "cover_letter": "<p>Dear Hiring Manager,</p><p>I am writing to express my interest...</p>",
                "resume": "/media/applications/resumes/john_doe_resume.pdf",
                "portfolio_url": "https://linkedin.com/in/johndoe",
                "expected_salary": "NPR 80,000 - 100,000",
                "availability": "2 weeks notice",
                "status": "pending",
                "admin_notes": "",
                "created_at": "2025-01-15T10:30:00Z",
                "updated_at": "2025-01-15T10:30:00Z",
                "reviewed_at": None
            }
        )
    ]
)
class JobApplicationSerializer(serializers.ModelSerializer):
    career_title = serializers.CharField(source='career.title', read_only=True)
    resume = serializers.FileField(required=True)

    class Meta:
        model = JobApplication
        fields = [
            "id", "career", "career_title", "full_name", "email", "phone", "address",
            "current_position", "current_company", "total_experience", "education",
            "cover_letter", "resume", "portfolio_url", "expected_salary", "availability",
            "status", "admin_notes", "created_at", "updated_at", "reviewed_at"
        ]
        read_only_fields = ("id", "career_title", "created_at", "updated_at", "reviewed_at")

    def validate_resume(self, value):
        """Validate resume file type and size"""
        # Check file extension
        allowed_extensions = ['.pdf', '.doc', '.docx']
        ext = value.name.lower()[value.name.rfind('.'):]
        if ext not in allowed_extensions:
            raise serializers.ValidationError(
                "Only PDF, DOC, and DOCX files are allowed for resume."
            )

        # Check file size (max 5MB)
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError(
                "Resume file size should not exceed 5MB."
            )

        return value
