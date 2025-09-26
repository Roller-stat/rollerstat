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
