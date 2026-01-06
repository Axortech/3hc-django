# Banner Management - Quick Start Guide

## Accessing the Banner Management Tab

1. Log in to the Admin Dashboard
2. Look for the **"Banners"** tab in the main navigation (has a picture frame icon 🖼️)
3. Click the tab to load the banner management interface

## Managing Banners

### Adding a New Banner

1. Click **"Add Banner"** button
2. Fill in the form:
   - **Title**: Main headline (optional)
   - **Subtitle**: Secondary text (optional)
   - **Video File**: Upload your video (MP4, WebM, OGV format)
   - **Video Poster**: Upload a thumbnail image shown before video plays
   - **Display Order**: Lower numbers appear first
   - **Video Settings**:
     - ✓ Autoplay (plays automatically when page loads)
     - ✓ Muted (starts without sound)
     - ✓ Loop (repeats continuously)
   - **Active**: Toggle to show/hide this banner on the website
3. Click **"Save Banner"**
4. You'll see a success message, and the banner appears in the table

### Editing a Banner

1. Find the banner in the table
2. Click the **"Edit"** button
3. Modify any fields you want to change
4. Click **"Save Banner"**

### Deleting a Banner

1. Find the banner in the table
2. Click the **"Delete"** button
3. Confirm the deletion in the popup
4. Banner is removed from the table

## Understanding the Banner Table

The table shows all banners with:

| Column | Description |
|--------|-------------|
| **Order** | Position in carousel (0 = first) |
| **Title** | Banner heading text |
| **Subtitle** | Secondary banner text |
| **Active** | Green badge = visible, Gray badge = hidden |
| **Actions** | Edit and Delete buttons |

## Video Settings Explained

- **Autoplay**: Video starts playing automatically
  - Best for: Background videos with subtle movement
  - Consider: Some browsers require muted=true for autoplay
  
- **Muted**: Video plays without sound
  - Recommended: Yes (for autoplay compatibility)
  - Users can unmute with video controls
  
- **Loop**: Video repeats continuously
  - Recommended: Yes (for seamless background video effect)

## Tips for Best Results

1. **Video Poster**: Choose a representative frame from your video
   - This shows while video is loading or if browser doesn't support autoplay
   - Should be high quality JPG or PNG
   - Recommended: 1920x1080px or similar 16:9 aspect ratio

2. **Video File**: Use optimized video formats
   - **MP4** (H.264) - Best browser compatibility
   - **WebM** - Smaller file size, good quality
   - File size: Keep under 100MB for faster loading

3. **Display Order**:
   - Order: 0, 1, 2, etc.
   - Multiple banners with same order will show alphabetically by ID
   - Use increments of 10 (0, 10, 20...) to allow inserting new ones easily

4. **Active Status**:
   - Only **Active** banners show on your homepage
   - Use this to schedule banners or keep drafts

## API Endpoints (For Frontend Developers)

### Get Active Banners (Public)
```
GET /api/banners/active/
```
Returns only active banners ordered by `order` field.

**Response Example**:
```json
[
  {
    "id": 1,
    "title": "Welcome to Our Company",
    "subtitle": "Building Excellence Since 2020",
    "video": "https://yoursite.com/media/banners/videos/main-banner.mp4",
    "video_poster": "https://yoursite.com/media/banners/posters/main-poster.jpg",
    "video_autoplay": true,
    "video_muted": true,
    "video_loop": true,
    "is_active": true,
    "order": 0,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T14:45:00Z"
  }
]
```

## Troubleshooting

### Banner not showing on homepage?
- ✓ Check if banner is **Active** (green badge in dashboard)
- ✓ Check if you're using the correct API: `/api/banners/active/`
- ✓ Verify video file exists and is accessible

### Video not playing?
- ✓ Ensure video format is supported (MP4 recommended)
- ✓ Check if video file is corrupted - try re-uploading
- ✓ Check browser console for errors
- ✓ If autoplay not working: Browser may require `muted=true`

### Upload fails?
- ✓ Check file size (max 100MB recommended)
- ✓ Ensure file format is correct (MP4 for video, JPG/PNG for poster)
- ✓ Check disk space on server
- ✓ Verify user permissions

### Changes not showing?
- ✓ Clear browser cache (Ctrl+Shift+Del)
- ✓ Hard refresh page (Ctrl+F5)
- ✓ Check network tab in browser developer tools

## Security & Privacy

- ✓ Banner management requires admin login
- ✓ Only admin users can add/edit/delete banners
- ✓ Public API endpoint (`/api/banners/active/`) is safe - no sensitive data
- ✓ All file uploads validated server-side

## Related Features

- **Clients Tab**: Manage company clients with logos
- **Team Members Tab**: Display staff with photos
- **Projects Tab**: Showcase completed projects
- **Services Tab**: List your service offerings

For more information, see [BANNER_FEATURE_SUMMARY.md](BANNER_FEATURE_SUMMARY.md)
