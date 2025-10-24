Rollerstat - Landing website for sports newsletter + blog.

Context of the project: "Not to be implemented right away."
This project is about a newsletter + blog website for the roller skating hockey sports: Refer to this for sports clarity - "https://en.wikipedia.org/wiki/Roller_hockey_(quad)"

This website should serve as the source of news and blogs for this particular sports.

The website should be compatible with every device's screen size.
Target audience: Players, coaches, scouts, fans, etc across Spain, Portugal, France, Germany, Italy, Switzerland, etc mainly in Europe. Note: I live in USA.

Features for the website:

Client features:

- The user should be able to view the news posts, blogs.
- The users should be able to like the news posts and blogs without login
- The users should be able to comment on the news posts and blogs with login only.
- The users should be able to sign up to comment.
- The users should be prompted to sign up when they land on the website.
- The users should be able to toggle the theme. (Light and dark mode)

Developer feature:

- The developer should be able to see the analytics of the users across the news post and blogs.
- The developer should save the comments.
- The media files (images/videos) should not be stored locally in repo but in the appropriate services.
- The developer should be able to sent email to the signed-up users for a new news post or blog.

Tech stack:
Next.js (App Router) + TypeScript + Tailwind CSS + Shadcn
MDX + contentlayer2 / next-contentlayer2
Supabase (Postgres + Auth + Storage) with @supabase/ssr
Brevo (email),
Google Analytics 4,
Cloudinary,
next-sitemap + JSON-LD

Note: Packages already installed so far: Refer to the package.json file.
Assumption: I already have account for the different services. Only account not configuration or set up.
**NOTE: DO not make any other assumptions of any other kind. STOP and ask me for any clrification or any options you come across for the implementation or feature functionality**

**Important: Always organize folder structure based on the Feature-Sliced Design (FSD) throughout the project after that already folder structure you see. : Know my current folder structure does not have src folder so do not create one first look at my structure and then for any additionalfuture folder follow the FSD okay.Refer to "https://feature-sliced.github.io/documentation/docs/get-started/overview".**

**Important: I have installed packages for UI, so use the appropriate packages for UI development. DO NOT start from scratch to create component: Refer to "https://ui.shadcn.com/docs/components". Note how shadcn organises the compoenent in it documentation. Use "npx shadcn add" command for adding any component.**

**IMPORTANT: After implementing anything or any phase. Please give a detailed summary of what you changed in the chat and in which files you changes.**

Phase 1 — Create a home page/landing page for the rollerstat newsletter/blog website.

Functionality and nppearance:
**Before you implement or make the changes always leave the room for changing or flexibility to change the appearance, colors and components. Make sure you design or structure this page such that it is very robust.**
**Always maintain the folder structure based on the Feature-Sliced Design (FSD) and makes sure this page is equally compatible with other device screen sizes.**
**For other small devices compatibility use the appropriate additonal components form the attached UI libraries and packages.**
Navbar: Far left:Leave space for the logo. Home, News, Blogs, Contact - positioned towards the left.
Footer: Social media icons, contact, license and privacy policy.
A background animated view under the Navbar covering the entire width. This shall have more overlapping images later or maybe sliding videos/images. This can also have dynamic component like subscribe section. Just make sure you make this in such a way it can cater any sort of input within that space.
Under this leave left side (75% of the width) of the panel for the latest blog or news (It can be any) with heading "Latest Edition". And right side (25% of the width) for the other blogs or news (like snippets of them) with heading "Top stories"
Under this and just above the footer would be the a small component section which slides automatically and displays quotes.

**Phase 2** - Content & i18n - The overall purpose of phase 2 is to implement the functionality of adding the content for the news and blogs dynamically. By dynamically I mean when ever the new news is added it appears on the home page apart from the news page which has all previous and new news posts. This goes same for the blogs. The news post is the big one towards the left and blogs are the right ones to the right.

**Content Behavior Clarification:**

- **Latest Edition (75% viewport space)**: Shows the most recent post of ANY type (news or blog) that was added
- **Top Stories (25% viewport space)**: Shows recent blog posts in chronological order
- **Content Types**: News = game results/current events, Blogs = analysis/opinion/insights
- **Homepage Logic**: Latest post becomes "Latest Edition", recent blogs fill "Top Stories"

**Critical** - A special functionality to add is i18n for the Target audience since it will have different languages.

## Phase 2A: Content Infrastructure

1. **Update Next.js Configuration**

   - Wrap the exported config with next-contentlayer2's wrapper
   - Allow remote images from Cloudinary and YouTube domains
   - Keep TypeScript config intact

2. **Contentlayer Configuration**

   - Create `contentlayer.config.ts` that:
     - Scans content directory for 'news' and 'blogs' posts in MDX
     - Defines Post document with fields: title, slug, summary, date, updated (optional), locale (en, es, fr, de, it), tags (string list), coverImage (optional), heroVideo (optional), author, translation_key, type ('news' | 'blog'), featured (boolean), published (boolean)
     - Computes readingTime (minutes rounded up) and url as /{locale}/{type}/{slug}
     - Uses the new 'contentlayer2/source-files' import

3. **Content Structure**

   - Create folders: `content/en/news/`, `content/en/blogs/`, `content/es/news/`, `content/es/blogs/`
   - Add one starter MDX file in English and Spanish with real frontmatter values for all fields
   - Include translation_key for cross-locale content linking

4. **i18n Helper**

   - Create `lib/i18n.ts` that exports: locales array [en, es, fr, de, it], Locale type, and defaultLocale as 'en'

5. **Message Catalogs**

   - Add `messages/en.json` and `messages/es.json`
   - Include keys for nav.news, nav.blogs, nav.about, cta.subscribe, cta.signin, like, comments
   - Keep simple translations for now

6. **Locale Layout**
   - Create `app/[locale]/layout.tsx` that:
     - Accepts locale param, validates against allowed locales
     - Loads corresponding messages file or falls back to defaultLocale
     - Wraps children in NextIntlClientProvider with locale and messages
     - Sets html lang to current locale and basic body class

## Phase 2B: Dynamic Homepage Integration

7. **Update Homepage Components**
   - Modify `LatestEdition` component to pull the most recent post of any type
   - Modify `TopStories` component to pull recent blog posts in chronological order
   - Ensure components work with locale routing

## Phase 2C: Content Pages

8. **News List Page**

   - Create `app/[locale]/news/page.tsx` that:
     - Filters posts by current locale and type='news' from Contentlayer data
     - Sorts by date descending
     - Renders list linking to each post's computed url with summary

9. **Blog List Page**

   - Create `app/[locale]/blogs/page.tsx` that:
     - Filters posts by current locale and type='blog' from Contentlayer data
     - Sorts by date descending
     - Renders list linking to each post's computed url with summary

10. **Detail Pages**
    - Create `app/[locale]/news/[slug]/page.tsx` and `app/[locale]/blogs/[slug]/page.tsx` that:
      - Find post by locale, type, and slug from generated data
      - Render MDX body
      - Leave placeholders for Like button and Comment box (Phase 3)
      - Inject Article JSON-LD using post fields: headline, datePublished, inLanguage, author name, mainEntityOfPage as siteUrl + post url

## Phase 2D: SEO & Performance

11. **JSON-LD Implementation**

    - Add Article schema for news and blog posts
    - Include proper meta tags and Open Graph data

12. **Navigation Updates**
    - Update navbar to include News and Blogs links with proper locale routing
    - Ensure navigation works across all locales

=====================================================

## Phase 3: Admin Panel Implementation

**Objective:** Create a non-technical user interface for content management that allows easy creation and editing of news posts and blog posts.

### Phase 3A: Project Setup & Dependencies

1. **Install Required Dependencies**

   - Install NextAuth for authentication
   - Install TipTap for rich text editor
   - Install file system utilities
   - Install form validation libraries

2. **Environment Configuration**
   - Set up environment variables for admin credentials
   - Configure NextAuth settings
   - Update Next.js config for file operations

### Phase 3B: Authentication System

3. **Create Authentication Configuration**

   - Set up NextAuth providers (credentials)
   - Configure admin login credentials
   - Create session management

4. **Build Auth Components**
   - Create **AuthGuard** component using shadcn **Alert** for unauthorized access
   - Build login page with shadcn **Form**, **Input**, and **Button**
   - Add session provider wrapper

### Phase 3C: Core Admin Components

5. **Post Form Component**

   - Build main form using shadcn **Card**, **CardHeader**, **CardContent**
   - Add **Input** fields for title, author, image URL
   - Add **Textarea** for summary
   - Add **Select** dropdowns for content type and language
   - Implement tag system with **Badge** components
   - Integrate TipTap rich text editor
   - Add **Button** for form submission

6. **Post List Component**

   - Create **Table** to display all posts
   - Add **Badge** for content type indicators
   - Add action buttons with **Button** components
   - Implement **Dialog** for delete confirmations
   - Add **Skeleton** for loading states

7. **Image Upload Component**
   - Build image upload interface with **Card** wrapper
   - Add **Input** for URL input
   - Add **Button** for upload actions
   - Show preview with **Alert** for validation

### Phase 3D: API Development

8. **File Operations Library**

   - Create MDX content generator
   - Build file system operations (create, update, delete)
   - Add slug generation utilities
   - Implement error handling

9. **API Routes**
   - Create POST endpoint for new posts
   - Create PUT endpoint for post updates
   - Create DELETE endpoint for post removal
   - Add proper error responses

### Phase 3E: Admin Pages

10. **Admin Layout**

    - Build main layout with **Navigation Menu**
    - Add **Breadcrumb** for navigation
    - Create responsive sidebar with **Sheet** for mobile
    - Add logout functionality

11. **Dashboard Page**

    - Create overview cards with **Card** components
    - Display post statistics
    - Add quick action buttons
    - Show recent posts in **Table**

12. **Post Management Pages**

    - Create new post page with **Form** component
    - Build edit post page with pre-filled **Form**
    - Add post list page with **Table** and **Pagination**
    - Implement search and filter functionality

13. **Navigation & UX**
    - Add **Toast** notifications for success/error messages
    - Implement **Alert** components for validation errors
    - Add **Skeleton** loading states
    - Create **Dialog** for confirmations

### Phase 3F: UI/UX Enhancement

14. **Form Validation**

    - Add **Form** wrapper with validation
    - Implement **Alert** for error messages
    - Add **Label** components for accessibility
    - Create **Toast** notifications

15. **Responsive Design**

    - Make forms responsive with **Card** layouts
    - Add **Sheet** for mobile navigation
    - Implement **Tabs** for different views
    - Add **Separator** for visual organization

16. **User Experience**
    - Add **Skeleton** for loading states
    - Implement **Toast** for feedback
    - Add **Dialog** for confirmations
    - Create **Alert** for important messages

### Phase 3G: Integration & Testing

17. **Content Integration**

    - Test MDX file generation
    - Verify file system operations
    - Test with existing content structure
    - Ensure proper slug generation

18. **Authentication Testing**

    - Test login/logout functionality
    - Verify protected routes
    - Test session management
    - Check unauthorized access handling

19. **Form Testing**
    - Test all form fields
    - Verify validation
    - Test file uploads
    - Check error handling

### Phase 3H: Deployment Preparation

20. **Production Considerations**

    - Plan for file system limitations on hosting platforms
    - Consider database integration for production
    - Set up proper environment variables
    - Configure build process

21. **Documentation**
    - Create user guide for non-technical users
    - Document admin panel features
    - Add troubleshooting guide
    - Create backup procedures

**shadcn/ui Components Used:**

- **Layout:** Card, CardHeader, CardContent, CardTitle, Separator
- **Forms:** Form, Input, Textarea, Select, Label, Button
- **Navigation:** Navigation Menu, Breadcrumb, Sheet, Tabs
- **Data:** Table, Badge, Dialog, Pagination
- **Feedback:** Toast, Alert, Skeleton
- **Actions:** Button, Dialog (confirmations)

**Total Components:** 15+ shadcn/ui components for complete admin interface

**Final Result:**

- Complete admin panel with modern UI
- Non-technical user-friendly interface
- Seamless integration with existing site
- Professional design using shadcn/ui components
- Full CRUD operations for posts
- Responsive and accessible design
- Automatic "latest post" detection using existing sorting logic
