This directory exists for purgecss.


WHY
We use these sample structure components to avoid loading the huge elections_*.css in the homepage.
Ideally, purgecss would load something like localhost:8000 but it won't. It will load the various templates,
but that doesn't account for JavaScript-powered components.

These files won't be served to users so their filesize doesn't really matter—they're only used by purgecss
during the build process.


HOW
Rather than include all of elections-*.css for the homepage,
home.scss is a direct copy of elections.scss.

Then the Gulp process purgecss takes home-*.css, looks at these files,
removes the unused styles from home-*.css, and re-saves it.


WHAT
- full.html is a standard page that also includes everything above

As a fallback:
- navs.html has everything before #main plus the footer nav, including an open menu and populated search suggestions
- banners.html is for the red banners on the homepage but also has the skip nav link, IE banner, and dev banner
- hero.html is for the #hero section
- commissioners.html is for the section for the commissioners
- toggled.html file has the components that are common but toggled, like feedback, glossary, and toc



TO UPDATE
To update these files (and the css loaded into the homepage),
1. Load the homepage, go into the inspector's Elements tab, and copy the <html> tag.
   NOTE: it's important to copy the compiled code and not the source code directly
   as the source won't have elements that have been changed/added by JavaScript
2. Paste the <html> tag in full.html. 
3. Remove the <head> and everything in it (no visible elements there).
4. Remove any <script> or <style> tags.
5. Remove any text content that is the lowest level of its structure (e.g. remove the text inside a <p> but leave
    the <p> and leave any elements inside the <p>.
    Having something like <div></div><div><p><a><i><em></em></i></a></p><p></p></div> is totally fine.)
6. Feel free to remove any inline style rules.
7. Add any elements/structures that aren't already here.
    e.g. dev banner, announcement banners, features that are off but may be activated
8. Safe to remove non-unique <li> from lists
    (as long as we keep a first, a last, an even, an odd, an nth, and we don't lose otherwise-unique descendents)

Safe to remove:
    <head>
    <script>
    <style>
      
    rel=""
    width=""
    height=""
    for=""
    on*=""
    repeated elements
    blank lines
    line breaks
    comments

Preserve:
    elements
    aria*=""
    class=""
    id=""
    name=""
    role=""
