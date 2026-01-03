from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample, OpenApiResponse, OpenApiTypes
from django.middleware.csrf import get_token
from .models import Banner, About, Project, Lead, ProjectCategory, BlogCategory, TeamMember, SiteLogo, BlogPost, SiteConfig, Service, ServiceCategory, Client, Career, Notice, JobApplication
from .serializers import BannerSerializer, AboutSerializer, ProjectSerializer, LeadSerializer, ProjectCategorySerializer, BlogCategorySerializer, TeamMemberSerializer, SiteLogoSerializer, BlogPostSerializer, SiteConfigSerializer, ServiceSerializer, ServiceCategorySerializer, ClientSerializer, UserRegistrationSerializer, CareerSerializer, NoticeSerializer, JobApplicationSerializer
from rest_framework.views import APIView
from rest_framework import generics
from django.contrib.auth.models import User
from rest_framework.permissions import AllowAny
from django.contrib.auth.decorators import login_required
from django.views.generic import TemplateView
from django.utils.decorators import method_decorator
from django.shortcuts import redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.views import LoginView, LogoutView
from django import forms
from django.http import HttpResponseRedirect
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_http_methods

# User Registration API - Authenticated Users Only
class UserRegistrationView(generics.CreateAPIView):
    """User registration endpoint - only authenticated users can create new users."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserRegistrationSerializer
    queryset = User.objects.all()


# Dashboard View - Admin Only
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_http_methods

# Dashboard View - Authenticated Users Only
@method_decorator(never_cache, name='dispatch')
@method_decorator(login_required(login_url='login'), name='dispatch')
class DashboardView(TemplateView):
    """Dashboard view - restricted to authenticated users"""
    template_name = 'dashboard.html'
    
    def dispatch(self, request, *args, **kwargs):
        # Ensure user is authenticated
        if not request.user.is_authenticated:
            return redirect('login')
        return super().dispatch(request, *args, **kwargs)
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Add dashboard context data
        context['user'] = self.request.user
        context['total_posts'] = BlogPost.objects.count()
        context['total_projects'] = Project.objects.count()
        context['total_services'] = Service.objects.count()
        context['total_team_members'] = TeamMember.objects.count()
        context['published_posts'] = BlogPost.objects.filter(status='published').count()
        context['draft_posts'] = BlogPost.objects.filter(status='draft').count()
        return context


# Custom Django Login View
class CustomLoginView(LoginView):
    """Django's built-in login view with custom template"""
    template_name = 'login.html'
    redirect_authenticated_user = True
    
    def get_success_url(self):
        """Redirect to dashboard after successful login"""
        next_url = self.request.GET.get('next', None)
        if next_url:
            return next_url
        return '/dashboard/'
    
    def form_valid(self, form):
        """Log the user in and redirect"""
        login(self.request, form.get_user())
        return super().form_valid(form)


# Django Registration View
class CustomRegisterView(TemplateView):
    """Custom registration view using API endpoint"""
    template_name = 'register.html'
    
    def get(self, request, *args, **kwargs):
        # Redirect logged-in users to dashboard
        if request.user.is_authenticated:
            return redirect('/dashboard/')
        return super().get(request, *args, **kwargs)


# Logout View
class CustomLogoutView(LogoutView):
    """Django's built-in logout view - handles both GET and POST"""
    next_page = '/'
    
    def dispatch(self, request, *args, **kwargs):
        """Handle logout and clear session"""
        # Log out the user (this calls Django's logout which clears the session)
        if request.user.is_authenticated:
            logout(request)
        
        # Get the response
        response = super().dispatch(request, *args, **kwargs)
        
        # Ensure session is completely cleared
        if hasattr(request, 'session'):
            try:
                request.session.flush()
            except:
                pass
        
        # Clear session cookie
        response.delete_cookie('sessionid')
        
        # Add cache control headers to prevent caching
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate, private'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        
        return response
    
    def get(self, request, *args, **kwargs):
        """Allow GET requests for logout"""
        return self.post(request, *args, **kwargs)


class CsrfView(generics.GenericAPIView):
    """Simple endpoint to ensure a CSRF cookie is set for frontend clients."""
    permission_classes = [AllowAny]
    serializer_class = None
    queryset = None

    @extend_schema(
        summary="Get CSRF token",
        description="Returns/sets a CSRF token cookie for use by clients",
        responses={200: OpenApiResponse(description='Returns csrf token')}
    )
    def get(self, request):
        token = get_token(request)
        resp = Response({'csrftoken': token})
        # Ensure cookie is set explicitly for clients
        resp.set_cookie('csrftoken', token, httponly=False)
        return resp

# Permission class for authenticated dashboard users
class IsAdmin(permissions.BasePermission):
    """Allow access only to authenticated users"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

# Permission class for authenticated users (read/write)
class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        # Allow authenticated users to create/update
        return request.user and request.user.is_authenticated

# BlogPost ViewSet
@extend_schema_view(
    list=extend_schema(
        summary="List blog posts",
        description="Returns a list of blog posts. Supports filtering by status, category, and tags.",
        parameters=[
            OpenApiParameter(name="status", description="Filter by status (draft, published, archived)", required=False, type=str),
            OpenApiParameter(name="category", description="Filter by category", required=False, type=str),
            OpenApiParameter(name="tags", description="Filter by tags (comma-separated)", required=False, type=str),
            OpenApiParameter(
                name="created_date",
                description="Filter by created date (YYYY-MM-DD)",
                required=False,
                type=OpenApiTypes.DATE,
            ),
            OpenApiParameter(
                name="last_edited_date",
                description="Filter by last edited date (YYYY-MM-DD)",
                required=False,
                type=OpenApiTypes.DATE,
            ),
        ],
        responses={200: BlogPostSerializer(many=True)}
    ),
    retrieve=extend_schema(summary="Retrieve a blog post", responses={200: BlogPostSerializer}),
    create=extend_schema(summary="Create a blog post", request=BlogPostSerializer, responses={201: BlogPostSerializer}),
    update=extend_schema(summary="Update a blog post", request=BlogPostSerializer, responses={200: BlogPostSerializer}),
    partial_update=extend_schema(summary="Partially update a blog post", request=BlogPostSerializer, responses={200: BlogPostSerializer}),
    destroy=extend_schema(summary="Delete a blog post"),
)
class BlogPostViewSet(viewsets.ModelViewSet):
    queryset = BlogPost.objects.all()
    serializer_class = BlogPostSerializer
    
    def get_permissions(self):
        """Allow public GET requests, require auth for write operations"""
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAdmin()]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "content", "tags", "category", "author"]
    ordering_fields = ["published_at", "created_at", "view_count"]
    # Allow ordering by the date-only fields too
    ordering_fields += ["created_date", "last_edited_date"]
    ordering = ["-published_at", "-created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get("status")
        category = self.request.query_params.get("category")
        tags = self.request.query_params.get("tags")
        if status_param:
            qs = qs.filter(status=status_param)
        if category:
            qs = qs.filter(category__iexact=category)
        if tags:
            tag_list = [t.strip() for t in tags.split(",") if t.strip()]
            for tag in tag_list:
                qs = qs.filter(tags__icontains=tag)
        return qs

    @action(detail=False, methods=['get'], url_path='published', permission_classes=[AllowAny])
    @extend_schema(
        summary="Get published blog posts",
        description="Retrieve all published blog posts. Public endpoint.",
        tags=['Blog Posts'],
        responses={200: BlogPostSerializer(many=True)}
    )
    def published(self, request):
        """Get all published blog posts"""
        posts = BlogPost.objects.filter(status='published')
        serializer = BlogPostSerializer(posts, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='slug/(?P<slug>[-\\w]+)', permission_classes=[AllowAny])
    @extend_schema(
        summary="Get blog post by slug",
        description="Retrieve a single blog post by its slug. Public endpoint.",
        tags=['Blog Posts'],
        responses={200: BlogPostSerializer, 404: OpenApiResponse(description='Not found')}
    )
    def by_slug(self, request, slug=None):
        """Get blog post by slug"""
        try:
            post = BlogPost.objects.get(slug=slug, status='published')
            post.view_count += 1
            post.save(update_fields=['view_count'])
            serializer = BlogPostSerializer(post)
            return Response(serializer.data)
        except BlogPost.DoesNotExist:
            return Response({'error': 'Blog post not found'}, status=status.HTTP_404_NOT_FOUND)

@extend_schema_view(
    list=extend_schema(
        summary="List banners",
        description="Returns list of banners. Supports ordering by 'order' and 'updated_at'.",
        tags=['Banners']
    ),
    retrieve=extend_schema(summary="Retrieve single banner", tags=['Banners']),
    create=extend_schema(summary="Create a banner", tags=['Banners']),
    update=extend_schema(summary="Update banner", tags=['Banners']),
    partial_update=extend_schema(summary="Partially update banner", tags=['Banners']),
    destroy=extend_schema(summary="Delete banner", tags=['Banners']),
)
class BannerViewSet(viewsets.ModelViewSet):
    queryset = Banner.objects.all()
    serializer_class = BannerSerializer
    permission_classes = [IsAdmin]  # Admin dashboard only
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["order", "updated_at"]
    ordering = ["order"]

    @action(detail=False, methods=['get'], url_path='active', permission_classes=[AllowAny])
    @extend_schema(
        summary="Get active banners",
        description="Returns only active banners ordered by 'order' field. Public endpoint.",
        tags=['Banners'],
        responses={200: BannerSerializer(many=True)}
    )
    def active(self, request):
        """Public endpoint to get active banners for the homepage"""
        banners = Banner.objects.filter(is_active=True).order_by('order')
        serializer = BannerSerializer(banners, many=True, context={'request': request})
        return Response(serializer.data)

@extend_schema_view(
    list=extend_schema(summary="Get about page contents", description="Multiple 'about' entries supported, but you can use one."),
    retrieve=extend_schema(summary="Get a single about entry"),
)
class AboutViewSet(viewsets.ModelViewSet):
    queryset = About.objects.all()
    serializer_class = AboutSerializer
    permission_classes = [IsAdmin]

@extend_schema_view(
    list=extend_schema(
        summary="List projects",
        parameters=[
            OpenApiParameter(name="status", description="Filter by status", required=False, type=str),
            OpenApiParameter(name="is_featured", description="Filter featured projects", required=False, type=bool),
        ],
    ),
    retrieve=extend_schema(summary="Retrieve a project"),
)
class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    
    def get_permissions(self):
        """Allow public GET requests, require auth for write operations"""
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAdmin()]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "short_description", "long_description"]
    ordering_fields = ["start_date", "end_date", "created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        status = self.request.query_params.get("status")
        is_featured = self.request.query_params.get("is_featured")
        if status:
            qs = qs.filter(status=status)
        if is_featured in ("true", "True", "1"):
            qs = qs.filter(is_featured=True)
        return qs

    @action(detail=False, methods=['get'], url_path='completed', permission_classes=[AllowAny])
    @extend_schema(
        summary="Get completed projects",
        description="Retrieve all completed projects. Public endpoint.",
        tags=['Projects'],
        responses={200: ProjectSerializer(many=True)}
    )
    def completed(self, request):
        """Get all completed projects"""
        projects = Project.objects.filter(status='completed')
        serializer = ProjectSerializer(projects, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='slug/(?P<slug>[-\\w]+)', permission_classes=[AllowAny])
    @extend_schema(
        summary="Get project by slug",
        description="Retrieve a single project by its slug. Public endpoint.",
        tags=['Projects'],
        responses={200: ProjectSerializer, 404: OpenApiResponse(description='Not found')}
    )
    def by_slug(self, request, slug=None):
        """Get project by slug"""
        try:
            project = Project.objects.get(slug=slug)
            serializer = ProjectSerializer(project)
            return Response(serializer.data)
        except Project.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

@extend_schema_view(
    list=extend_schema(summary="List leads (contact form submissions)"),
    create=extend_schema(
        summary="Create a lead",
        description="Public endpoint for contact form submissions. No authentication required.",
        examples=[
            OpenApiExample(
                "Create lead example",
                value={"name": "Jane", "email": "jane@example.com", "message": "Hi!"}
            )
        ],
    ),
    retrieve=extend_schema(summary="Retrieve a lead (admin only)"),
    destroy=extend_schema(summary="Delete a lead (admin only)"),
)
class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    
    def get_permissions(self):
        """Allow public create (contact form); admin-only for list/retrieve/delete"""
        if self.action in ("create",):
            return [permissions.AllowAny()]
        return [IsAdmin()]

    @action(detail=False, methods=["post"], url_path="mark-read", permission_classes=[permissions.IsAdminUser])
    def mark_all_read(self, request):
        Lead.objects.filter(is_read=False).update(is_read=True)
        return Response({"status": "ok"}, status=status.HTTP_200_OK)


@extend_schema_view(
    list=extend_schema(summary="List Project Categories", description="Public endpoint listing project categories."),
    retrieve=extend_schema(summary="Get Project Category Details"),
)
class ProjectCategoryViewSet(viewsets.ModelViewSet):
    queryset = ProjectCategory.objects.all()
    serializer_class = ProjectCategorySerializer
    
    def get_permissions(self):
        """Allow public GET requests, require auth for write operations"""
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAdmin()]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "created_at"]


@extend_schema_view(
    list=extend_schema(summary="List Blog Categories", description="Get all blog categories"),
    create=extend_schema(summary="Create Blog Category (admin only)"),
    retrieve=extend_schema(summary="Get Blog Category Details"),
)
class BlogCategoryViewSet(viewsets.ModelViewSet):
    queryset = BlogCategory.objects.all()
    serializer_class = BlogCategorySerializer
    
    def get_permissions(self):
        """Allow public GET requests, require auth for write operations"""
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAdmin()]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "created_at"]


@extend_schema_view(
    list=extend_schema(summary="List Team Members", description="Publicly visible team member info."),
    retrieve=extend_schema(summary="Get single team member details"),
    create=extend_schema(summary="Add new team member (admin only)"),
)
class TeamMemberViewSet(viewsets.ModelViewSet):
    queryset = TeamMember.objects.filter(is_active=True)
    serializer_class = TeamMemberSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "position"]
    ordering_fields = ["order", "name"]

    def get_queryset(self):
        # allow admins to see inactive members as well
        if self.request.user and self.request.user.is_staff:
            return TeamMember.objects.all()
        return super().get_queryset()

@extend_schema_view(
    list=extend_schema(summary="List clients", description="Public endpoint for clients/companies."),
    retrieve=extend_schema(summary="Get client details"),
)
class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.filter(is_active=True)
    serializer_class = ClientSerializer
    
    def get_permissions(self):
        """Allow public GET requests, require auth for write operations"""
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAdmin()]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "about"]
    ordering_fields = ["order", "name", "created_at"]

    def get_queryset(self):
        # allow admins to see inactive clients as well
        if self.request.user and self.request.user.is_staff:
            return Client.objects.all()
        return super().get_queryset()

@extend_schema_view(
    list=extend_schema(summary="List service categories", description="Public endpoint for service categories."),
    retrieve=extend_schema(summary="Get service category details"),
)
class ServiceCategoryViewSet(viewsets.ModelViewSet):
    queryset = ServiceCategory.objects.filter(is_active=True)
    serializer_class = ServiceCategorySerializer
    
    def get_permissions(self):
        """Allow public GET requests, require auth for write operations"""
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAdmin()]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "order", "created_at"]

    def get_queryset(self):
        # allow admins to see inactive categories as well
        if self.request.user and self.request.user.is_staff:
            return ServiceCategory.objects.all()
        return super().get_queryset()

@extend_schema_view(
    list=extend_schema(
        summary="List services",
        description="Returns a list of published services. Supports filtering by status, category, and featured.",
        parameters=[
            OpenApiParameter(name="status", description="Filter by status (draft, published, archived)", required=False, type=str),
            OpenApiParameter(name="category", description="Filter by category ID", required=False, type=int),
            OpenApiParameter(name="is_featured", description="Filter featured services", required=False, type=bool),
        ],
        responses={200: ServiceSerializer(many=True)}
    ),
    retrieve=extend_schema(summary="Retrieve a service", responses={200: ServiceSerializer}),
    create=extend_schema(summary="Create a service (admin only)", request=ServiceSerializer, responses={201: ServiceSerializer}),
    update=extend_schema(summary="Update a service (admin only)", request=ServiceSerializer, responses={200: ServiceSerializer}),
    partial_update=extend_schema(summary="Partially update a service (admin only)", request=ServiceSerializer, responses={200: ServiceSerializer}),
    destroy=extend_schema(summary="Delete a service (admin only)"),
)
class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    
    def get_permissions(self):
        """Allow public GET requests, require auth for write operations"""
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAdmin()]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "content", "category__name"]
    ordering_fields = ["published_at", "created_at", "order", "is_featured"]
    ordering = ["-is_featured", "order", "-created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get("status")
        category_id = self.request.query_params.get("category")
        is_featured = self.request.query_params.get("is_featured")
        
        if status_param:
            qs = qs.filter(status=status_param)
        if category_id:
            qs = qs.filter(category_id=category_id)
        if is_featured in ("true", "True", "1"):
            qs = qs.filter(is_featured=True)
        
        return qs


@extend_schema_view(
    list=extend_schema(
        summary='Get site logo',
        description='Retrieve the site logo. Singleton resource - returns single logo if exists.',
        tags=['Site Logo'],
        responses={200: SiteLogoSerializer}
    ),
    create=extend_schema(
        summary='Upload or update site logo',
        description='Upload a new logo or update the existing one. Only one logo is maintained.',
        tags=['Site Logo'],
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'logo': {'type': 'string', 'format': 'binary', 'description': 'Logo image file'},
                    'alt_text': {'type': 'string', 'description': 'Alt text for the logo'}
                },
                'required': ['logo']
            }
        },
        responses={201: SiteLogoSerializer},
    ),
    destroy=extend_schema(
        summary='Delete site logo',
        description='Remove the site logo and its file.',
        tags=['Site Logo'],
        responses={204: OpenApiResponse(description='Logo deleted successfully')}
    ),
)
class SiteLogoViewSet(viewsets.ViewSet):
    """Singleton resource for site logo - only one logo is maintained"""
    # Provide a queryset so drf-spectacular can infer path parameter types
    queryset = SiteLogo.objects.all()
    serializer_class = SiteLogoSerializer
    
    def get_permissions(self):
        """Allow public GET requests, require auth for write operations"""
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAdmin()]

    def list(self, request):
        """Get the current site logo"""
        logo = SiteLogo.get_logo()
        if logo:
            serializer = SiteLogoSerializer(logo, context={'request': request})
            return Response(serializer.data)
        return Response(
            {"detail": "No logo found"},
            status=status.HTTP_404_NOT_FOUND
        )

    def create(self, request):
        """Upload or update the site logo"""
        logo_instance = SiteLogo.get_logo() or SiteLogo()
        serializer = SiteLogoSerializer(logo_instance, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        """Retrieve a specific logo by ID (supports router detail route)."""
        try:
            obj = SiteLogo.objects.get(pk=pk)
        except SiteLogo.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.serializer_class(obj, context={"request": request})
        return Response(serializer.data)

    def destroy(self, request):
        """Delete the site logo"""
        logo = SiteLogo.get_logo()
        if not logo:
            return Response(
                {"detail": "No logo found"},
                status=status.HTTP_404_NOT_FOUND
            )
        logo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



@extend_schema_view(
    list=extend_schema(
        summary="Get site configuration",
        description="Retrieve the site configuration (singleton resource).",
        tags=['Site Configuration'],
        responses={200: SiteConfigSerializer}
    ),
    create=extend_schema(
        summary="Create or update site configuration",
        description="Create or update the site configuration. Only one configuration is maintained.",
        tags=['Site Configuration'],
        request=SiteConfigSerializer,
        responses={201: SiteConfigSerializer}
    ),
    update=extend_schema(
        summary="Update site configuration",
        description="Update the site configuration completely.",
        tags=['Site Configuration'],
        request=SiteConfigSerializer,
        responses={200: SiteConfigSerializer}
    ),
    partial_update=extend_schema(
        summary="Partially update site configuration",
        description="Partially update site configuration fields.",
        tags=['Site Configuration'],
        request=SiteConfigSerializer,
        responses={200: SiteConfigSerializer}
    ),
)
class SiteConfigViewSet(viewsets.ViewSet):
    """Singleton resource for site configuration - only one config is maintained"""
    serializer_class = SiteConfigSerializer
    # Provide queryset so drf-spectacular can infer path parameter types for detail routes
    queryset = SiteConfig.objects.all()
    
    def get_permissions(self):
        """Allow public GET requests, require auth for write operations"""
        if self.action in ('list', 'retrieve', 'active'):
            return [AllowAny()]
        return [IsAdmin()]

    def list(self, request):
        """Get the current site configuration"""
        config = SiteConfig.get_config()
        serializer = SiteConfigSerializer(config, context={'request': request})
        return Response(serializer.data)

    def create(self, request):
        """Create or update the site configuration"""
        config = SiteConfig.get_config()
        serializer = SiteConfigSerializer(config, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, pk=None):
        """Update the site configuration completely"""
        config = SiteConfig.get_config()
        serializer = SiteConfigSerializer(config, data=request.data)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        """Retrieve the site configuration (support detail route)"""
        config = SiteConfig.get_config()
        serializer = self.serializer_class(config, context={"request": request})
        return Response(serializer.data)

    def partial_update(self, request, pk=None):
        """Partially update the site configuration"""
        config = SiteConfig.get_config()
        serializer = SiteConfigSerializer(config, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='active', permission_classes=[AllowAny])
    @extend_schema(
        summary="Get active site configuration",
        description="Retrieve the site configuration. Public endpoint.",
        tags=['Site Configuration'],
        responses={200: SiteConfigSerializer}
    )
    def active(self, request):
        """Get the site configuration (always returns the single config)"""
        config = SiteConfig.get_config()
        serializer = SiteConfigSerializer(config, context={'request': request})
        return Response(serializer.data)


# Career ViewSet
@extend_schema_view(
    list=extend_schema(
        summary="List career opportunities",
        description="Returns a list of career/job openings. Supports filtering by status and job type.",
        tags=['Careers'],
        parameters=[
            OpenApiParameter(name="status", description="Filter by status (draft, active, closed)", required=False, type=str),
            OpenApiParameter(name="job_type", description="Filter by job type (full_time, part_time, contract, internship)", required=False, type=str),
            OpenApiParameter(name="location", description="Filter by location", required=False, type=str),
        ],
        responses={200: CareerSerializer(many=True)}
    ),
    retrieve=extend_schema(summary="Retrieve a career", tags=['Careers'], responses={200: CareerSerializer}),
    create=extend_schema(summary="Create a career", tags=['Careers'], request=CareerSerializer, responses={201: CareerSerializer}),
    update=extend_schema(summary="Update a career", tags=['Careers'], request=CareerSerializer, responses={200: CareerSerializer}),
    partial_update=extend_schema(summary="Partially update a career", tags=['Careers'], request=CareerSerializer, responses={200: CareerSerializer}),
    destroy=extend_schema(summary="Delete a career", tags=['Careers']),
)
class CareerViewSet(viewsets.ModelViewSet):
    queryset = Career.objects.all()
    serializer_class = CareerSerializer
    permission_classes = [IsAdmin]  # Admin dashboard only
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "location", "department", "requirements"]
    ordering_fields = ["created_at", "updated_at", "published_at", "order"]
    ordering = ["-is_featured", "order", "-created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get("status")
        job_type = self.request.query_params.get("job_type")
        location = self.request.query_params.get("location")

        if status_param:
            qs = qs.filter(status=status_param)
        if job_type:
            qs = qs.filter(job_type=job_type)
        if location:
            qs = qs.filter(location__icontains=location)

        return qs

    @action(detail=False, methods=['get'], url_path='active', permission_classes=[AllowAny])
    @extend_schema(
        summary="Get active career opportunities",
        description="Retrieve all active job openings with pagination. Public endpoint.",
        tags=['Careers'],
        responses={200: CareerSerializer(many=True)}
    )
    def active(self, request):
        """Get all active career opportunities with pagination"""
        careers = Career.objects.filter(status='active').order_by('-is_featured', 'order', '-created_at')
        
        # Apply pagination
        page = self.paginate_queryset(careers)
        if page is not None:
            serializer = CareerSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = CareerSerializer(careers, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='slug/(?P<slug>[-\\w]+)', permission_classes=[AllowAny])
    @extend_schema(
        summary="Get career by slug",
        description="Retrieve a single career by its slug. Public endpoint.",
        tags=['Careers'],
        responses={200: CareerSerializer, 404: OpenApiResponse(description='Not found')}
    )
    def by_slug(self, request, slug=None):
        """Get career by slug"""
        try:
            career = Career.objects.get(slug=slug, status='active')
            career.view_count += 1
            career.save(update_fields=['view_count'])
            serializer = CareerSerializer(career)
            return Response(serializer.data)
        except Career.DoesNotExist:
            return Response({'error': 'Career not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], url_path='increment-view')
    @extend_schema(
        summary="Increment career view count",
        description="Increment the view count for a career",
        tags=['Careers'],
        responses={200: OpenApiResponse(description='View count incremented')}
    )
    def increment_view(self, request, pk=None):
        """Increment view count for career"""
        career = self.get_object()
        career.view_count += 1
        career.save(update_fields=['view_count'])
        return Response({'view_count': career.view_count})


# Notice ViewSet
@extend_schema_view(
    list=extend_schema(
        summary="List notices",
        description="Returns a list of notices/announcements. Supports filtering by status and priority.",
        tags=['Notices'],
        parameters=[
            OpenApiParameter(name="status", description="Filter by status (draft, published, archived)", required=False, type=str),
            OpenApiParameter(name="priority", description="Filter by priority (low, normal, high, urgent)", required=False, type=str),
        ],
        responses={200: NoticeSerializer(many=True)}
    ),
    retrieve=extend_schema(summary="Retrieve a notice", tags=['Notices'], responses={200: NoticeSerializer}),
    create=extend_schema(summary="Create a notice", tags=['Notices'], request=NoticeSerializer, responses={201: NoticeSerializer}),
    update=extend_schema(summary="Update a notice", tags=['Notices'], request=NoticeSerializer, responses={200: NoticeSerializer}),
    partial_update=extend_schema(summary="Partially update a notice", tags=['Notices'], request=NoticeSerializer, responses={200: NoticeSerializer}),
    destroy=extend_schema(summary="Delete a notice", tags=['Notices']),
)
class NoticeViewSet(viewsets.ModelViewSet):
    queryset = Notice.objects.all()
    serializer_class = NoticeSerializer
    permission_classes = [IsAdmin]  # Admin dashboard only
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "content", "excerpt"]
    ordering_fields = ["notice_date", "created_at", "updated_at", "order"]
    ordering = ["-is_sticky", "-is_featured", "-notice_date", "-created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get("status")
        priority = self.request.query_params.get("priority")

        if status_param:
            qs = qs.filter(status=status_param)
        if priority:
            qs = qs.filter(priority=priority)

        return qs

    @action(detail=False, methods=['get'], url_path='published', permission_classes=[AllowAny])
    @extend_schema(
        summary="Get published notices",
        description="Retrieve all published notices with pagination. Public endpoint.",
        tags=['Notices'],
        responses={200: NoticeSerializer(many=True)}
    )
    def published(self, request):
        """Get all published notices with pagination"""
        notices = Notice.objects.filter(status='published').order_by('-is_sticky', '-is_featured', '-notice_date', '-created_at')
        
        # Apply pagination
        page = self.paginate_queryset(notices)
        if page is not None:
            serializer = NoticeSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = NoticeSerializer(notices, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='increment-view')
    @extend_schema(
        summary="Increment notice view count",
        description="Increment the view count for a notice",
        tags=['Notices'],
        responses={200: OpenApiResponse(description='View count incremented')}
    )
    def increment_view(self, request, pk=None):
        """Increment view count for notice"""
        notice = self.get_object()
        notice.view_count += 1
        notice.save(update_fields=['view_count'])
        return Response({'view_count': notice.view_count})


# Job Application ViewSet
@extend_schema_view(
    list=extend_schema(
        summary="List job applications",
        description="Returns list of job applications. Supports filtering by career, status, and email. Admin only for list/detail operations.",
        tags=['Job Applications'],
        parameters=[
            OpenApiParameter(name="career", description="Filter by career ID", required=False, type=int),
            OpenApiParameter(name="status", description="Filter by status (pending, reviewing, shortlisted, rejected, accepted)", required=False, type=str),
            OpenApiParameter(name="email", description="Filter by applicant email", required=False, type=str),
        ],
        responses={200: JobApplicationSerializer(many=True)}
    ),
    retrieve=extend_schema(summary="Retrieve a job application", tags=['Job Applications'], responses={200: JobApplicationSerializer}),
    create=extend_schema(
        summary="Submit a job application",
        description="Public endpoint for submitting job applications. Requires resume file upload.",
        tags=['Job Applications'],
        request=JobApplicationSerializer,
        responses={201: JobApplicationSerializer}
    ),
    update=extend_schema(summary="Update application (Admin only)", tags=['Job Applications'], request=JobApplicationSerializer, responses={200: JobApplicationSerializer}),
    partial_update=extend_schema(summary="Partially update application (Admin only)", tags=['Job Applications'], request=JobApplicationSerializer, responses={200: JobApplicationSerializer}),
    destroy=extend_schema(summary="Delete application (Admin only)", tags=['Job Applications']),
)
class JobApplicationViewSet(viewsets.ModelViewSet):
    queryset = JobApplication.objects.all()
    serializer_class = JobApplicationSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["full_name", "email", "phone", "current_position", "current_company"]
    ordering_fields = ["created_at", "updated_at", "reviewed_at", "status"]
    ordering = ["-created_at"]

    def get_permissions(self):
        """Allow public POST (create), require admin for everything else"""
        if self.action == 'create':
            return [AllowAny()]
        return [IsAdmin()]

    def get_queryset(self):
        qs = super().get_queryset()
        career_id = self.request.query_params.get("career")
        status_param = self.request.query_params.get("status")
        email = self.request.query_params.get("email")

        if career_id:
            qs = qs.filter(career_id=career_id)
        if status_param:
            qs = qs.filter(status=status_param)
        if email:
            qs = qs.filter(email__icontains=email)

        return qs

    @action(detail=False, methods=['get'], url_path='by-career/(?P<career_id>[^/.]+)', permission_classes=[IsAdmin])
    @extend_schema(
        summary="Get applications by career",
        description="Retrieve all applications for a specific career posting. Admin only.",
        tags=['Job Applications'],
        responses={200: JobApplicationSerializer(many=True)}
    )
    def by_career(self, request, career_id=None):
        """Get all applications for a specific career"""
        applications = JobApplication.objects.filter(career_id=career_id)
        serializer = JobApplicationSerializer(applications, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], url_path='update-status', permission_classes=[IsAdmin])
    @extend_schema(
        summary="Update application status",
        description="Update the status of a job application. Admin only.",
        tags=['Job Applications'],
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string', 'enum': ['pending', 'reviewing', 'shortlisted', 'rejected', 'accepted']},
                    'admin_notes': {'type': 'string'}
                }
            }
        },
        responses={200: JobApplicationSerializer}
    )
    def update_status(self, request, pk=None):
        """Update application status with admin notes"""
        application = self.get_object()
        new_status = request.data.get('status')
        admin_notes = request.data.get('admin_notes')

        if new_status:
            application.status = new_status
        if admin_notes is not None:
            application.admin_notes = admin_notes

        application.save()
        serializer = JobApplicationSerializer(application)
        return Response(serializer.data)
