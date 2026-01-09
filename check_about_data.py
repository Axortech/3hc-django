#!/usr/bin/env python
"""
Quick script to check if About data exists and create sample data if needed.
Run: python manage.py shell < check_about_data.py
Or: python check_about_data.py
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cmspro.settings')
sys.path.insert(0, '/c/Users/LENOVO/Desktop/3hc-django')

django.setup()

from content.models import About

# Check if About data exists
about_count = About.objects.count()
published_count = About.objects.filter(is_published=True).count()

print(f"\n=== About Data Check ===")
print(f"Total About records: {about_count}")
print(f"Published About records: {published_count}")

if about_count > 0:
    for obj in About.objects.all():
        print(f"\n- ID: {obj.id}")
        print(f"  Title: {obj.title}")
        print(f"  Published: {obj.is_published}")
        print(f"  Content: {obj.content[:100]}...")
else:
    print("\nNo About records found. Creating sample data...")
    about = About.objects.create(
        title="About 3HC",
        content="High Himalaya Hydro Construction - Your trusted partner in hydropower solutions.",
        mission_title="Our Mission",
        mission_content="To deliver world-class hydropower construction solutions that support sustainable development in the Himalayas.",
        vision_title="Our Vision",
        vision_content="To be the leading hydropower construction company recognized for innovation, quality, and environmental responsibility.",
        goals_title="Our Goals",
        goals_content="1. Deliver projects on time and within budget\n2. Maintain highest safety standards\n3. Promote sustainable development\n4. Support local communities",
        achievements_title="Our Achievements",
        achievements_content="• Successfully completed 15+ hydropower projects\n• 0 major safety incidents in 5 years\n• ISO 9001 and ISO 45001 certified\n• Member of International Water Association",
        is_published=True
    )
    print(f"✓ Created sample About record (ID: {about.id})")

print("\n✓ Check complete!")
