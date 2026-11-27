"""Search and social-preview metadata.

The app is a single-page React app, but link previews (Instagram, Facebook, Slack, iMessage, ...)
and many crawlers read only the HTML the server sends and never run JavaScript.  So the server
puts each page's title, description, canonical link, Open Graph / Twitter tags and structured
data into the ``<head>`` of ``index.html`` itself, per route.  It also answers /robots.txt and
/sitemap.xml.

The public address comes from ``SITE_URL`` (default https://3bld.xyz).  It is used instead of
the request's Host header, so every page has one canonical address (no www / http duplicates)
and a forged Host header cannot end up in the page.
"""
import html
import json
import os

SITE_URL = os.environ.get("SITE_URL", "https://3bld.xyz").rstrip("/")
# Google Search Console "HTML tag" verification: set this to the token it shows (the content="..." value).
# The "HTML file" method needs no setting: put the file it gives you in web/public/.
GOOGLE_VERIFICATION = os.environ.get("GOOGLE_SITE_VERIFICATION", "")
NAME = "Blindfold Trainer"
OG_IMAGE = "/og.png"                      # web/public/og.png, 1200x630
OG_IMAGE_SIZE = (1200, 630)
OG_IMAGE_ALT = ("Blindfold Trainer: solve the cube without looking. Free 3x3 blindfold tutorial with "
                "M2 edges and Old Pochmann corners, next to the unfolded net of a scrambled cube.")

# route -> (title, description).  Titles stay under about 60 characters, descriptions under about 160.
PAGES = {
    "/": (
        "Blindfold Trainer: learn to solve the 3x3 blindfolded",
        "Learn 3x3 blindfolded solving with M2 edges and Old Pochmann corners. Free tutorial, "
        "scramble memo and solution, 3D replay, letter drill, pair words and a timer.",
    ),
    "/tutorial": (
        "Blindfold tutorial: M2 and Old Pochmann in 10 lessons",
        "A free step-by-step blindfold cubing tutorial: Speffz lettering, tracing the memo, "
        "M2 edges, Old Pochmann corners and parity, with live examples.",
    ),
    "/solve": (
        "Blindfold solve trainer: memo, solution and 3D replay",
        "Paste or generate a 3x3 scramble and get its blindfold memo, the full M2 and Old Pochmann "
        "solution, a 3D replay and a recall check to test your memory.",
    ),
    "/letter-drill": (
        "Speffz letter drill for blindfold cubing",
        "Practise Speffz letters: a sticker blinks on the cube and you type its letter. "
        "Choose the faces, edges or corners you want to drill.",
    ),
    "/algorithms": (
        "M2 and Old Pochmann algorithm list",
        "Every M2 edge and Old Pochmann corner algorithm with setup, swap and undo, plus the "
        "parity algorithms. Filter by letter, sticker or move.",
    ),
    "/pairs": (
        "Blindfold letter pairs: a 576-word dictionary",
        "All 576 letter pairs from AA to XX with a word for each. Edit the words to build your "
        "own blindfold memory system.",
    ),
    "/timer": (
        "Blindfold cube timer with averages",
        "A cube timer with scramble, hint, DNF and +2 penalties, Ao5 to Ao100 averages and a list "
        "of all your solves. Hold anywhere to start.",
    ),
}

# Pages worth listing for search engines (all of them).
SITEMAP_ROUTES = tuple(PAGES)


def route_of(url_path):
    """The page a URL path belongs to ("/solve/" -> "/solve"; the index file itself -> "/")."""
    route = "/" + url_path.strip("/")
    return route if route in PAGES else "/"


def absolute(route):
    return SITE_URL + route


def _structured_data(route, title, description):
    app = {"@type": "WebApplication", "@id": SITE_URL + "/#app", "name": NAME, "url": SITE_URL + "/",
           "description": PAGES["/"][1], "applicationCategory": "EducationalApplication",
           "operatingSystem": "Any", "inLanguage": "en", "image": SITE_URL + OG_IMAGE,
           "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"}}
    if route == "/":
        graph = [app]
    elif route == "/tutorial":
        graph = [{"@type": "LearningResource", "name": title, "description": description,
                  "url": absolute(route), "inLanguage": "en", "learningResourceType": "tutorial",
                  "teaches": "Solving the 3x3 Rubik's Cube blindfolded with M2 edges and Old Pochmann corners",
                  "isAccessibleForFree": True, "isPartOf": {"@id": SITE_URL + "/#app"}}, app]
    else:
        graph = [{"@type": "WebPage", "name": title, "description": description, "url": absolute(route),
                  "inLanguage": "en", "isPartOf": {"@id": SITE_URL + "/#app"}}, app]
    # "<" as \u003c: nothing inside the data can close or open a tag
    return json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False).replace("<", "\\u003c")


def head_tags(route):
    """The tags for one page, ready to put in <head>."""
    title, description = PAGES[route]
    url, image = absolute(route), SITE_URL + OG_IMAGE
    q = html.escape
    tags = ([f'<meta name="google-site-verification" content="{q(GOOGLE_VERIFICATION)}">'] if GOOGLE_VERIFICATION and route == "/" else []) + [
        f"<title>{q(title)}</title>",
        f'<meta name="description" content="{q(description)}">',
        f'<link rel="canonical" href="{q(url)}">',
        '<meta name="robots" content="index, follow, max-image-preview:large">',
        '<meta name="theme-color" content="#0c0d0e">',
        '<meta name="color-scheme" content="dark">',
        '<meta property="og:type" content="website">',
        f'<meta property="og:site_name" content="{q(NAME)}">',
        f'<meta property="og:title" content="{q(title)}">',
        f'<meta property="og:description" content="{q(description)}">',
        f'<meta property="og:url" content="{q(url)}">',
        '<meta property="og:locale" content="en_US">',
        f'<meta property="og:image" content="{q(image)}">',
        f'<meta property="og:image:secure_url" content="{q(image)}">',
        '<meta property="og:image:type" content="image/png">',
        f'<meta property="og:image:width" content="{OG_IMAGE_SIZE[0]}">',
        f'<meta property="og:image:height" content="{OG_IMAGE_SIZE[1]}">',
        f'<meta property="og:image:alt" content="{q(OG_IMAGE_ALT)}">',
        '<meta name="twitter:card" content="summary_large_image">',
        f'<meta name="twitter:title" content="{q(title)}">',
        f'<meta name="twitter:description" content="{q(description)}">',
        f'<meta name="twitter:image" content="{q(image)}">',
        f'<meta name="twitter:image:alt" content="{q(OG_IMAGE_ALT)}">',
        f'<script type="application/ld+json">{_structured_data(route, title, description)}</script>',
    ]
    return "\n".join(tags)


def noscript(route):
    """Plain text for crawlers and readers without JavaScript: the page's heading, summary and links."""
    title, description = PAGES[route]
    q = html.escape
    links = "".join(f'<li><a href="{q(r)}">{q(PAGES[r][0])}</a></li>' for r in PAGES)
    return (f"<noscript><main><h1>{q(title)}</h1><p>{q(description)}</p>"
            f"<p>This app needs JavaScript.</p><nav><ul>{links}</ul></nav></main></noscript>")


def render_index(page, url_path):
    """``index.html`` with this route's metadata in the head and a plain-text fallback in the body."""
    route = route_of(url_path)
    start = page.find("<title>")
    end = page.find("</title>") + len("</title>")
    if start != -1 and end > start:
        page = page[:start] + head_tags(route) + page[end:]
    else:
        page = page.replace("</head>", head_tags(route) + "\n</head>", 1)
    return page.replace('<div id="root"></div>', '<div id="root"></div>\n' + noscript(route), 1)


def robots_txt():
    return f"User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: {SITE_URL}/sitemap.xml\n"


def sitemap_xml(lastmod=None):
    """All pages; ``lastmod`` (YYYY-MM-DD) is when the app was last built."""
    stamp = f"<lastmod>{lastmod}</lastmod>" if lastmod else ""
    urls = "".join(f"  <url><loc>{html.escape(absolute(r))}</loc>{stamp}</url>\n" for r in SITEMAP_ROUTES)
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            f'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n')
