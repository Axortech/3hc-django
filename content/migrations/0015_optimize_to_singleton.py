# Generated migration: Optimize SiteLogo and SiteConfig to singleton pattern

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('content', '0014_blogcategory_alter_blogpost_category'),
    ]

    operations = [
        # Remove title from SiteLogo
        migrations.RemoveField(
            model_name='sitelogo',
            name='uploaded_at',
        ),
        migrations.RemoveField(
            model_name='sitelogo',
            name='title',
        ),
        
        # Add alt_text to SiteLogo
        migrations.AddField(
            model_name='sitelogo',
            name='alt_text',
            field=models.CharField(default='Site Logo', max_length=255),
        ),
        
        # Add updated_at to SiteLogo
        migrations.AddField(
            model_name='sitelogo',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        
        # Update SiteConfig: Remove is_active, add logo fields directly
        migrations.RemoveField(
            model_name='siteconfig',
            name='logo',
        ),
        migrations.RemoveField(
            model_name='siteconfig',
            name='is_active',
        ),
        
        # Add direct logo fields to SiteConfig
        migrations.AddField(
            model_name='siteconfig',
            name='logo',
            field=models.ImageField(blank=True, null=True, upload_to='site_logos/'),
        ),
        migrations.AddField(
            model_name='siteconfig',
            name='logo_alt_text',
            field=models.CharField(blank=True, default='Site Logo', max_length=255),
        ),
        
        # Update SiteConfig Meta
        migrations.AlterModelOptions(
            name='siteconfig',
            options={'verbose_name': 'Site Configuration', 'verbose_name_plural': 'Site Configuration'},
        ),
    ]
