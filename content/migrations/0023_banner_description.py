from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0022_alter_banner_options_remove_banner_is_active_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="banner",
            name="description",
            field=models.TextField(blank=True),
        ),
    ]

