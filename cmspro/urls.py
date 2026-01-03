# website_backend/urls.py

from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from django.conf import settings
from django.conf.urls.static import static
from content.views import (
    BannerViewSet,
    AboutViewSet,
    ProjectViewSet,
    LeadViewSet,
    ProjectCategoryViewSet,
    BlogCategoryViewSet,
    TeamMemberViewSet,
    SiteLogoViewSet,
    BlogPostViewSet,
    SiteConfigViewSet,
    ServiceViewSet,
    ServiceCategoryViewSet,
    ClientViewSet,
    CareerViewSet,
    NoticeViewSet,
    JobApplicationViewSet,
    UserRegistrationView,
    CsrfView,
    DashboardView,
    CustomLoginView,
    CustomLogoutView,
)

from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from content.views import CsrfView
from django.views.generic import TemplateView
from django.shortcuts import render
from django.http import Http404
from django.template import TemplateDoesNotExist

router = routers.DefaultRouter()
router.register(r"banners", BannerViewSet, basename="banner")
router.register(r"about", AboutViewSet, basename="about")
router.register(r"projects", ProjectViewSet, basename="project")
router.register(r"leads", LeadViewSet, basename="lead")
router.register(r"project-categories", ProjectCategoryViewSet, basename="projectcategory")
router.register(r"blog-categories", BlogCategoryViewSet, basename="blogcategory")
router.register(r"team-members", TeamMemberViewSet, basename="teammember")
router.register(r"site-logo", SiteLogoViewSet, basename="site-logo")
router.register(r"blog-posts", BlogPostViewSet, basename="blogpost")
router.register(r"site-config", SiteConfigViewSet, basename="site-config")
router.register(r"services", ServiceViewSet, basename="service")
router.register(r"service-categories", ServiceCategoryViewSet, basename="servicecategory")
router.register(r"clients", ClientViewSet, basename="client")
router.register(r"careers", CareerViewSet, basename="career")
router.register(r"notices", NoticeViewSet, basename="notice")
router.register(r"job-applications", JobApplicationViewSet, basename="jobapplication")

urlpatterns = [
    path("admin/", admin.site.urls),
    # Authentication views
    path("login/", CustomLoginView.as_view(), name="login"),
    path("logout/", CustomLogoutView.as_view(), name="logout"),
    # Frontend static pages served as templates (keep API under /api/)
    path("", TemplateView.as_view(template_name="index.html"), name="home"),
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("api/", include((router.urls, "api"))),
    path("api/csrf/", CsrfView.as_view(), name="csrf-token"),
    path("api/register/", UserRegistrationView.as_view(), name="user-register"),
    
    # JWT endpoints
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/token/verify/", TokenVerifyView.as_view(), name="token_verify"),
    path("api/csrf/", CsrfView.as_view(), name="api-csrf"),

    
    # Spectacular schema + UI
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/swagger/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/docs/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]


def flatpage(request, page):
    """Serve simple static HTML pages from the templates directory.

    Safeguard against path traversal and missing templates.
    Example URL: /about.html -> serves templates/about.html
    """
    # disallow traversal
    if ".." in page or page.startswith("/"):
        raise Http404()

    # strip trailing slash and optional .html
    page = page.rstrip("/")
    if page.endswith(".html"):
        page = page[:-5]

    template_name = f"{page}.html"
    try:
        return render(request, template_name)
    except TemplateDoesNotExist:
        raise Http404()

# Serve media files in development (must be before catch-all routes)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# catch-all for other frontend pages (must come after other routes)
# Match both with and without trailing slash so original links like `about.html` still work.
urlpatterns += [
    path("<path:page>", flatpage, name="flatpage_no_slash"),
    path("<path:page>/", flatpage, name="flatpage"),
]