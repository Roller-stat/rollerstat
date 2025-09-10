Rollerstat - Landing website for sports newsletter + blog.

Context of the project: "Not to be implemented right away."
This project is about a newsletter + blog website for the roller skating hockey sports: Refer to this for sports clarity - "https://en.wikipedia.org/wiki/Roller_hockey_(quad)"
This website should serve as the source of news and blogs for this particular sports.
The website should be compatible with every device's screen size.
Target audience: Players, coaches, scouts, fans, etc across Spain, Portugal, France, Germany, Italy, Switzerland, etc mainly in Europe. Note: I live in USA.
Features for the website:
Client features:
The user should be able to view the news posts, blogs.
The users should be able to like the news posts and blogs without login
The users should be able to comment on the news posts and blogs with login only.
The users should be able to sign up to comment.
The users should be prompted to sign up when they land on the website.
The users should be able to toggle the theme. (Light and dark mode)
Developer feature:
The developer should be able to see the analytics of the users across the news post and blogs.
The developer should save the comments.
The media files (images/videos) should not be stored locally in repo but in the appropriate services.
The developer should be able to sent email to the signed-up users for a new news post or blog.

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

Phase 2 - I will give you this later so do not get confused or assume anything.
