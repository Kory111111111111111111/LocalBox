# Footrue product/feature inventory research

Observed public site in browser; inventory source is the supplied sitemap plus public page metadata. 16 categories / 316 tools. No signup/payment and no user files used; a 1x1 local test PNG was used only to trigger Background Remover model loading.

## Product overview
- SPA-style web app with persistent left category navigation on desktop, compact hamburger on narrow view; top search box (“Search 200+ tools…”, shortcut hint), theme toggle, breadcrumb, category cards, tool detail template, related-tools row, footer (All Tools/About/Privacy/Terms/Contact).
- Homepage hero: “Every tool you need, right in your browser”; claims 316+ tools, 100% private, works offline, no signup/server/ads, files never leave device. Sections: Popular Tools, Just Added, large category-filtered catalog.
- Visual clone guidance: do not copy Footrue colors/logo/branding; requested clone should use simple black/deep-navy dark minimal UI.

## Complete category list

- **PDF Tools** (`/category/pdf`): 12 tools — Create, convert, and manipulate PDF files.
- **Image Tools** (`/category/image`): 30 tools — Edit, convert, and optimize images.
- **Video & Audio** (`/category/video`): 30 tools — Convert, trim, and extract audio from video — right in your browser.
- **Text Tools** (`/category/text`): 42 tools — Analyze, transform, and format text.
- **Developer Tools** (`/category/developer`): 59 tools — Code formatters, encoders, and developer utilities.
- **Math & Numbers** (`/category/math`): 20 tools — Calculations, conversions, and number tools.
- **Converters** (`/category/converters`): 17 tools — Convert between units, formats, and types.
- **Color Tools** (`/category/color`): 14 tools — Pick, convert, and work with colors.
- **Crypto & Security** (`/category/crypto`): 12 tools — Hash, encrypt, and decode data.
- **Network Tools** (`/category/network`): 14 tools — IP, DNS, URL, and network utilities.
- **File Tools** (`/category/file`): 9 tools — File utilities, generators, and converters.
- **Generators** (`/category/generators`): 15 tools — Generate UUIDs, passwords, data, and more.
- **SEO & Web** (`/category/seo`): 8 tools — Meta tags, sitemaps, and SEO utilities.
- **Time & Date** (`/category/time`): 14 tools — Date, time, timezone, and duration tools.
- **Finance** (`/category/finance`): 14 tools — Currency, loan, investment calculators.
- **Social & Media** (`/category/social`): 6 tools — Social media tools and analytics helpers.

## Complete tool inventory (name — path — purpose)

### PDF Tools (12)

- **Merge PDF** — `/tools/pdf-merge` — Combine multiple PDF files into one.
- **Split PDF** — `/tools/pdf-split` — Split a PDF into separate pages or ranges.
- **Compress PDF** — `/tools/pdf-compress` — Reduce PDF file size without losing quality.
- **PDF to Text** — `/tools/pdf-to-text` — Extract text content from PDF files.
- **Rotate PDF** — `/tools/pdf-rotate` — Rotate pages in a PDF file.
- **Add Watermark** — `/tools/pdf-watermark` — Add text or image watermark to PDF.
- **Add Page Numbers** — `/tools/pdf-page-numbers` — Add page numbers to PDF documents.
- **PDF Metadata** — `/tools/pdf-metadata` — View and edit PDF metadata properties.
- **Unlock PDF** — `/tools/pdf-unlock` — Remove password from PDF files.
- **PDF to Grayscale** — `/tools/pdf-grayscale` — Convert color PDF to grayscale.
- **Crop PDF** — `/tools/pdf-crop` — Crop and resize PDF pages.
- **Redact PDF** — `/tools/redact-pdf` — Permanently black out sensitive text in a PDF — private, in your browser.
### Image Tools (30)

- **Compress Image** — `/tools/image-compress` — Reduce image file size while maintaining quality.
- **Resize Image** — `/tools/image-resize` — Resize images to specific dimensions.
- **Convert Image** — `/tools/image-convert` — Convert between JPG, PNG, WebP, GIF, BMP formats.
- **Crop Image** — `/tools/image-crop` — Crop images to specific dimensions or ratios.
- **Rotate & Flip** — `/tools/image-rotate` — Rotate an image by 90, 180 or 270 degrees, or mirror it, free and in your browser.
- **Image to Grayscale** — `/tools/image-grayscale` — Convert color images to black and white.
- **Adjust Brightness** — `/tools/image-brightness` — Adjust brightness, contrast, and saturation.
- **Blur Image** — `/tools/image-blur` — Apply blur effects to images.
- **Image Watermark** — `/tools/image-watermark` — Add text or logo watermark to images.
- **Image to Base64** — `/tools/image-to-base64` — Convert images to Base64 encoded string.
- **Base64 to Image** — `/tools/base64-to-image` — Convert Base64 string back to image.
- **Image Metadata** — `/tools/image-metadata` — View EXIF and metadata from images.
- **Color Picker from Image** — `/tools/image-color-picker` — Pick colors from any image.
- **Image Collage** — `/tools/image-collage` — Create a collage from multiple images.
- **Favicon Generator** — `/tools/image-favicon` — Generate favicon from any image.
- **Background Remover** — `/tools/background-remover` — Remove the background from any image automatically — free, private, in your browser.
- **HEIC to JPG** — `/tools/heic-to-jpg` — Convert HEIC (iPhone) photos to JPG — free, in your browser.
- **HEIC to PNG** — `/tools/heic-to-png` — Convert HEIC (iPhone) photos to PNG — free, in your browser.
- **WebP to PNG** — `/tools/webp-to-png` — Convert WebP images to PNG — free, private, in your browser.
- **PNG to WebP** — `/tools/png-to-webp` — Convert PNG images to smaller WebP files — free, in your browser.
- **WebP to JPG** — `/tools/webp-to-jpg` — Convert WebP images to JPG — free, private, in your browser.
- **JPG to WebP** — `/tools/jpg-to-webp` — Convert JPG photos to smaller WebP files — free, in your browser.
- **AVIF to JPG** — `/tools/avif-to-jpg` — Convert AVIF images to JPG — free, private, in your browser.
- **AVIF to PNG** — `/tools/avif-to-png` — Convert AVIF images to PNG — free, private, in your browser.
- **SVG to PNG** — `/tools/svg-to-png` — Convert SVG files to PNG images.
- **PNG to SVG** — `/tools/png-to-svg` — Convert PNG to SVG (vectorize).
- **Placeholder Image** — `/tools/image-placeholder` — Generate placeholder images with custom sizes.
- **Add Border** — `/tools/image-border` — Add decorative borders to images.
- **Image to ASCII** — `/tools/image-ascii` — Convert images to ASCII art.
- **CSS Image Filters** — `/tools/image-filters` — Apply CSS filters to images — brightness, contrast, saturation, blur with presets.
### Video & Audio (30)

- **Extract Audio from Video** — `/tools/extract-audio` — Pull the audio track from any video and save it as MP3, WAV, or M4A — in your browser.
- **Compress Video** — `/tools/compress-video` — Shrink video file size while keeping good quality, right in your browser.
- **Trim Video** — `/tools/trim-video` — Cut a clip from a video by start and end time — fast and lossless.
- **Video to GIF** — `/tools/video-to-gif` — Turn a video clip into a high-quality animated GIF.
- **Mute Video** — `/tools/mute-video` — Remove the audio track from a video, lossless and instant.
- **Transcribe Audio & Video** — `/tools/transcribe` — Turn speech in any audio or video into text with Whisper — in your browser.
- **Video Converter** — `/tools/video-converter` — Convert between MP4, WebM, MOV, MKV and AVI — free, private, in your browser.
- **Audio Converter** — `/tools/audio-converter` — Convert between MP3, WAV, M4A, OGG and FLAC — free, private, in your browser.
- **Screen Recorder** — `/tools/screen-recorder` — Record your screen, a window or a tab with audio — nothing is uploaded.
- **Subtitle Generator** — `/tools/subtitle-generator` — Generate timed SRT or VTT subtitles from any video — in your browser.
- **Resize Video** — `/tools/resize-video` — Scale a video down to 1080p, 720p, 480p and more without stretching it.
- **Crop Video** — `/tools/crop-video` — Crop a video to square, 9:16 vertical or 16:9 for any platform.
- **Merge Video** — `/tools/merge-video` — Join several videos into one, any size or format, with no upload limit.
- **Speed Up or Slow Down Video** — `/tools/speed-video` — Change playback speed from 0.25x to 4x without the audio going squeaky.
- **Reverse Video** — `/tools/reverse-video` — Play a video backwards, sound included, right in your browser.
- **Loop Video** — `/tools/loop-video` — Repeat a video several times into one longer file, lossless and instant.
- **Split Video** — `/tools/split-video` — Cut a video into equal parts with accurate cuts, and get them as a zip.
- **Add Music to Video** — `/tools/add-music-to-video` — Put a soundtrack on a video, keeping or replacing the original sound.
- **Cut Audio** — `/tools/cut-audio` — Trim an MP3 or any audio file between two exact times.
- **Merge Audio** — `/tools/merge-audio` — Join several audio files into one, even with different formats.
- **Adjust Video** — `/tools/adjust-video` — Fix brightness, contrast and colour, or make a clip black and white.
- **Slideshow Maker** — `/tools/slideshow-maker` — Turn your photos into a video with music, any sizes or formats.
- **Video for Reels, TikTok and Shorts** — `/tools/reframe-video` — Reframe any video to vertical or square with a blurred background, nothing cropped.
- **Increase Audio Volume** — `/tools/volume-booster` — Make a quiet recording louder, or level it to podcast and streaming standards.
- **Extract Frames from Video** — `/tools/extract-frames` — Save stills from a video as JPG or PNG and download them as a zip.
- **Add Watermark to Video** — `/tools/add-watermark` — Put your own logo on a video in any corner, at the size and opacity you choose.
- **Remove Silence from Audio** — `/tools/remove-silence` — Cut the long pauses out of podcasts, lectures and voice notes automatically.
- **Boomerang Video Maker** — `/tools/boomerang-video` — Make a clip play forwards then backwards on a loop, like Instagram boomerangs.
- **Green Screen Background Remover** — `/tools/green-screen` — Replace a green or blue screen with a colour or your own picture.
- **Text to Speech** — `/tools/text-to-speech` — Read any text aloud with your device's own voices — free and private.
### Text Tools (42)

- **Word Counter** — `/tools/word-count` — Count words, characters, sentences, and paragraphs.
- **Case Converter** — `/tools/text-case` — Convert text between upper, lower, title, camel case etc..
- **Text Diff** — `/tools/text-diff` — Compare two texts and see differences.
- **Sort Lines** — `/tools/text-sort` — Sort lines of text alphabetically or numerically.
- **Remove Duplicates** — `/tools/text-remove-duplicates` — Remove duplicate lines from text.
- **Reverse Text** — `/tools/text-reverse` — Reverse characters or lines in text.
- **Lorem Ipsum** — `/tools/text-lorem` — Generate Lorem Ipsum placeholder text.
- **Text to Slug** — `/tools/text-slugify` — Convert text to URL-friendly slug.
- **Remove Extra Spaces** — `/tools/text-remove-spaces` — Clean up extra whitespace from text.
- **Text to HTML** — `/tools/text-to-html` — Convert plain text to HTML entities.
- **Markdown Preview** — `/tools/markdown-preview` — Preview Markdown rendered as HTML.
- **Truncate Text** — `/tools/text-truncate` — Truncate text to a specified length.
- **Repeat Text** — `/tools/text-repeat` — Repeat text a specified number of times.
- **Extract Emails** — `/tools/text-extract-emails` — Extract all email addresses from text.
- **Extract URLs** — `/tools/text-extract-urls` — Extract all URLs from text.
- **Extract Numbers** — `/tools/text-extract-numbers` — Extract all numbers from text.
- **Roman Numerals** — `/tools/roman-numerals` — Convert between Roman numerals and Arabic numbers.
- **Morse Code** — `/tools/morse-code` — Encode and decode Morse code.
- **Binary to Text** — `/tools/binary-text` — Convert between binary and text.
- **Word Wrap** — `/tools/text-wrap` — Wrap text at specified line length.
- **Add Line Numbers** — `/tools/text-number-lines` — Add line numbers to any text or code, with your choice of separator.
- **SSML Generator** — `/tools/ssml-generator` — Generate Speech Synthesis Markup Language.
- **Palindrome Checker** — `/tools/palindrome-checker` — Check if text is a palindrome and find the longest palindromic substring.
- **ROT13 / ROT47** — `/tools/rot13` — Encode and decode text with ROT13 or ROT47 cipher.
- **Text Padding** — `/tools/text-padding` — Pad and align text lines to a fixed width with any character.
- **Unicode Inspector** — `/tools/unicode-inspector` — Inspect every character — code points, UTF-8 bytes, and Unicode categories.
- **Text Statistics** — `/tools/text-stats` — Word count, readability score, reading time, and detailed text analysis.
- **ASCII Art Text** — `/tools/ascii-art-text` — Convert text to ASCII art block letters or decorative text boxes.
- **Emoji Picker** — `/tools/emoji-picker` — Browse, search, and copy 1800+ Unicode emojis.
- **Typing Speed Test** — `/tools/speed-typing` — Test your typing speed in WPM with accuracy tracking.
- **Text Find & Replace** — `/tools/text-replacer` — Apply multiple find & replace rules with regex support.
- **Slug Generator** — `/tools/slug-generator` — Convert text to URL-friendly slugs with accent handling and bulk mode.
- **Braille Translator** — `/tools/braille-translator` — Convert text to Grade 1 Braille unicode characters and back.
- **Text Cleaner** — `/tools/text-cleaner` — Strip HTML, normalize spaces, remove control chars and junk from text.
- **Duplicate Line Remover** — `/tools/duplicate-lines` — Find, remove, or extract duplicate lines from text.
- **Word Frequency Map** — `/tools/word-frequency-map` — Analyze word frequency and find the most used words in text.
- **Lorem Ipsum Generator (Pro)** — `/tools/lorem-ipsum-advanced` — Generate placeholder text in multiple styles — classic, hipster, tech.
- **String Analyzer** — `/tools/string-analyzer` — Deep text analysis with 18+ stats, readability score, and speaking time.
- **HTML to Plain Text** — `/tools/html-to-text` — Strip HTML tags and extract clean plain text with entity decoding.
- **Text Statistics Dashboard** — `/tools/text-statistics` — Comprehensive text analytics — word frequency, reading level, character distribution.
- **Word Wrap / Line Breaker** — `/tools/word-wrapper` — Wrap long text at a fixed column width — hard wrap, soft wrap, or HTML.
- **Text Sorter** — `/tools/text-sorter` — Sort lines alphabetically, by length, numerically, or shuffle randomly.
### Developer Tools (59)

- **JSON Formatter** — `/tools/json-formatter` — Format, validate, and minify JSON.
- **JSON to Code** — `/tools/json-to-code` — Generate TypeScript, Go, Python, Java, C# or Rust types from JSON.
- **JSON to CSV** — `/tools/json-to-csv` — Convert JSON data to CSV format.
- **CSV to JSON** — `/tools/csv-to-json` — Convert CSV data to JSON format.
- **XML Formatter** — `/tools/xml-formatter` — Format and validate XML documents.
- **HTML Formatter** — `/tools/html-formatter` — Format and beautify HTML code.
- **HTML Viewer** — `/tools/html-viewer` — Paste HTML and preview it rendered live in your browser.
- **CSS Formatter** — `/tools/css-formatter` — Format and minify CSS stylesheets.
- **JS Formatter** — `/tools/js-formatter` — Format and beautify JavaScript code.
- **SQL Formatter** — `/tools/sql-formatter` — Format and beautify SQL queries.
- **Base64 Encode** — `/tools/base64-encode` — Encode text or files to Base64.
- **Base64 Decode** — `/tools/base64-decode` — Decode Base64 encoded strings.
- **URL Encode** — `/tools/url-encode` — Encode special characters in URLs.
- **URL Decode** — `/tools/url-decode` — Decode percent-encoded URLs.
- **HTML Encode** — `/tools/html-encode` — Encode special characters to HTML entities.
- **HTML Decode** — `/tools/html-decode` — Decode HTML entities back to text.
- **Regex Tester** — `/tools/regex-tester` — Test and debug regular expressions.
- **JWT Decoder** — `/tools/jwt-decoder` — Decode and verify JWT tokens.
- **YAML to JSON** — `/tools/yaml-to-json` — Convert YAML to JSON format.
- **JSON to YAML** — `/tools/json-to-yaml` — Convert JSON to YAML format.
- **CSS Units** — `/tools/css-unit-converter` — Convert between CSS units (px, rem, em, vw).
- **Minify HTML** — `/tools/minify-html` — Minify HTML to reduce file size.
- **Minify CSS** — `/tools/minify-css` — Strip comments and whitespace from CSS to make stylesheets load faster.
- **Minify JavaScript** — `/tools/minify-js` — Shrink JavaScript by removing comments and whitespace, right in your browser.
- **Code Diff Checker** — `/tools/diff-checker` — Compare code files side by side.
- **Markdown to HTML** — `/tools/markdown-to-html` — Convert Markdown to HTML code.
- **HTML to Markdown** — `/tools/html-to-markdown` — Convert HTML to Markdown syntax.
- **JSON Minify** — `/tools/json-minify` — Minify JSON to reduce file size.
- **GraphQL Formatter** — `/tools/graphql-formatter` — Format and indent GraphQL queries and schemas so they are readable again.
- **TOML to JSON** — `/tools/toml-to-json` — Convert TOML to JSON format.
- **XML to JSON** — `/tools/xml-to-json` — Convert XML documents to JSON format.
- **JSON to XML** — `/tools/json-to-xml` — Convert JSON data to well-formed XML.
- **JSON Diff Viewer** — `/tools/json-diff` — Compare two JSON objects and highlight added, removed, changed keys.
- **HTTP Status Codes** — `/tools/http-status-codes` — Complete reference of all HTTP status codes with descriptions.
- **Base32 Encoder/Decoder** — `/tools/base32` — Encode text to Base32 or decode Base32 strings (RFC 4648).
- **.gitignore Generator** — `/tools/gitignore-generator` — Generate .gitignore files for any language or framework.
- **CSS Box Shadow** — `/tools/css-box-shadow` — Visually design CSS box shadows with live preview.
- **CSS Text Shadow** — `/tools/css-text-shadow` — Create beautiful CSS text shadows with live preview.
- **CSS Border Radius** — `/tools/css-border-radius` — Visually design border-radius values with live preview.
- **CSS Triangle** — `/tools/css-triangle` — Generate pure CSS triangles using the border trick.
- **CSS Animation Generator** — `/tools/css-animation` — Pick preset animations, customize timing, copy CSS.
- **CSS Flexbox Generator** — `/tools/css-flexbox` — Visually configure flexbox properties with live preview.
- **CSS Grid Generator** — `/tools/css-grid` — Visually configure CSS Grid layouts with live preview.
- **Markdown Table Generator** — `/tools/markdown-table-generator` — Create formatted Markdown tables visually.
- **JSONPath Tester** — `/tools/json-path-tester` — Test JSONPath expressions against JSON data.
- **Regex Library** — `/tools/regex-library` — Curated library of 25+ useful regular expressions with live tester.
- **CSS Variable Generator** — `/tools/css-variables` — Build and manage CSS custom properties with live preview and preset themes.
- **HTML Entities Reference** — `/tools/html-entities` — Browse all HTML entities and encode/decode special characters.
- **CSS Specificity Calculator** — `/tools/css-specificity` — Calculate and compare CSS selector specificity.
- **Flexbox Cheatsheet** — `/tools/flexbox-cheatsheet` — Quick reference for all CSS Flexbox properties with copy-to-clipboard.
- **Base64 Encoder/Decoder (Advanced)** — `/tools/base64-advanced` — Encode/decode text or files to Base64 with URL-safe mode and line wrapping.
- **Git Commit Generator** — `/tools/git-commit` — Create conventional commit messages (feat/fix/docs) with emoji and scope.
- **JSON Beautifier & Minifier** — `/tools/json-beautifier` — Format, validate, minify, sort keys and analyze JSON with stats.
- **Markdown Table Builder** — `/tools/markdown-table-gen2` — Visually build Markdown tables with alignment, CSV import, and live preview.
- **JSON Schema Validator** — `/tools/json-schema-validator` — Validate JSON data against a JSON Schema — types, required, enums, patterns.
- **SVG Optimizer** — `/tools/svg-optimizer` — Optimize SVG files by removing comments, metadata, empty groups.
- **CSS Gradient Generator** — `/tools/css-gradient-gen` — Build linear, radial, and conic CSS gradients visually with multi-stop and presets.
- **CSS clip-path Generator** — `/tools/css-clip-path` — Generate CSS clip-path polygon, circle, and ellipse shapes with live preview.
- **Cron Expression Parser** — `/tools/cron-parser` — Parse cron expressions into plain English and see next scheduled run times.
### Math & Numbers (20)

- **Percentage Calculator** — `/tools/percentage-calc` — Calculate percentages, increases, decreases.
- **Scientific Calculator** — `/tools/scientific-calc` — Advanced scientific calculator.
- **Number Base Converter** — `/tools/number-base` — Convert between binary, octal, decimal, hex.
- **Prime Number Checker** — `/tools/prime-checker` — Check if a number is prime.
- **Prime Factorization** — `/tools/prime-factorization` — Find prime factors of any number.
- **GCD & LCM** — `/tools/gcd-lcm` — Find Greatest Common Divisor and Least Common Multiple.
- **Fibonacci Sequence** — `/tools/fibonacci` — Generate Fibonacci numbers.
- **Random Number Generator** — `/tools/random-number` — Generate random numbers in a range.
- **Statistics Calculator** — `/tools/statistics-calc` — Mean, median, mode, standard deviation.
- **Matrix Calculator** — `/tools/matrix-calc` — Perform matrix operations.
- **Ratio Calculator** — `/tools/ratio-calc` — Simplify and calculate ratios.
- **Bitwise Calculator** — `/tools/bitwise-calc` — Perform bitwise operations.
- **Fraction Calculator** — `/tools/fraction-calc` — Add, subtract, multiply fractions.
- **Quadratic Solver** — `/tools/quadratic-solver` — Solve quadratic equations.
- **Logarithm Calculator** — `/tools/logarithm-calc` — Calculate logarithms in any base.
- **Factorial & Combinatorics** — `/tools/factorial-calc` — Calculate factorials, combinations C(n,r), and permutations P(n,r).
- **Triangle Calculator** — `/tools/triangle-calc` — Solve any triangle with SSS or SAS methods.
- **Circle Calculator** — `/tools/circle-calc` — Calculate radius, diameter, circumference, and area of a circle.
- **Number to Words** — `/tools/number-to-words` — Convert any number to English words — cardinal and ordinal.
- **Percentage Change** — `/tools/percentage-change` — Calculate percentage increase/decrease and find what percent of a number.
### Converters (17)

- **Length Converter** — `/tools/length-converter` — Convert between metric and imperial lengths.
- **Weight Converter** — `/tools/weight-converter` — Convert between kg, lbs, oz, and more.
- **Temperature Converter** — `/tools/temperature-converter` — Convert Celsius, Fahrenheit, Kelvin.
- **Speed Converter** — `/tools/speed-converter` — Convert between mph, km/h, m/s, knots.
- **Area Converter** — `/tools/area-converter` — Convert between square meters, acres, hectares.
- **Volume Converter** — `/tools/volume-converter` — Convert between liters, gallons, cups, etc..
- **Data Storage Converter** — `/tools/data-storage-converter` — Convert between bytes, KB, MB, GB, TB.
- **Pressure Converter** — `/tools/pressure-converter` — Convert between PSI, bar, pascal, atm.
- **Energy Converter** — `/tools/energy-converter` — Convert between joules, calories, BTU.
- **Power Converter** — `/tools/power-converter` — Convert between watts, horsepower, BTU/hr.
- **Angle Converter** — `/tools/angle-converter` — Convert degrees, radians, gradians.
- **Fuel Efficiency** — `/tools/fuel-converter` — Convert between mpg, L/100km, km/L.
- **Currency Converter** — `/tools/currency-converter` — Convert between world currencies (offline rates).
- **Time Duration Converter** — `/tools/time-duration-converter` — Convert seconds, minutes, hours, days.
- **Image Resolution Converter** — `/tools/resolution-converter` — Convert DPI, PPI, and resolution.
- **Byte / Bit Converter** — `/tools/byte-converter` — Convert between bits, bytes, KB, MB, GB, TB and more.
- **Aspect Ratio Calculator** — `/tools/aspect-ratio-calc` — Calculate aspect ratios and scale dimensions proportionally.
### Color Tools (14)

- **Color Converter** — `/tools/color-converter` — Convert HEX, RGB, HSL, HSV, CMYK colors.
- **Color Picker** — `/tools/color-picker` — Interactive color picker and palette builder.
- **Gradient Generator** — `/tools/gradient-generator` — Create CSS gradients visually.
- **Color Palette Generator** — `/tools/color-palette` — Generate harmonious color palettes.
- **Contrast Checker** — `/tools/color-contrast` — Check color contrast ratio for accessibility.
- **Color Shades** — `/tools/color-shades` — Generate tints and shades of any color.
- **Color Blindness Simulator** — `/tools/color-blindness` — Simulate how colors look to color blind people.
- **HEX to RGB** — `/tools/hex-to-rgb` — Convert HEX color to RGB values.
- **RGB to HEX** — `/tools/rgb-to-hex` — Convert RGB values to HEX color.
- **Color Mixer** — `/tools/color-mixer` — Blend two colors and see every step between them, with hex and RGB values.
- **Color Name Finder** — `/tools/color-name` — Find the name of any color.
- **CSS Color Names** — `/tools/css-color-names` — Browse all CSS named colors.
- **Color Harmonies** — `/tools/color-harmonies` — Generate complementary, analogous, triadic color harmonies.
- **Color Picker & History** — `/tools/hex-color-picker` — Pick colors visually, adjust RGB channels, copy in HEX/RGB/HSL with history.
### Crypto & Security (12)

- **Hash Generator** — `/tools/hash-generator` — Generate MD5, SHA-1, SHA-256, SHA-512 hashes.
- **Bcrypt Generator** — `/tools/bcrypt-generator` — Hash passwords with bcrypt.
- **Password Generator** — `/tools/password-generator` — Generate strong, secure passwords.
- **Password Strength** — `/tools/password-strength` — Check password strength and security.
- **HMAC Generator** — `/tools/hmac-generator` — Generate HMAC with various algorithms.
- **AES Encrypt/Decrypt** — `/tools/aes-cipher` — Encrypt and decrypt text with AES.
- **JWT Generator** — `/tools/jwt-generator` — Generate and sign JWT tokens.
- **OTP Generator** — `/tools/otp-generator` — Generate Time-based One-Time Passwords.
- **Checksum Calculator** — `/tools/checksum-calc` — Calculate file and text checksums.
- **Caesar Cipher** — `/tools/caesar-cipher` — Encrypt/decrypt with Caesar cipher.
- **Vigenere Cipher** — `/tools/vigenere-cipher` — Encode/decode with Vigenere cipher.
- **RSA Key Generator** — `/tools/rsa-keygen` — Generate RSA public/private key pairs.
### Network Tools (14)

- **URL Parser** — `/tools/url-parser` — Parse and analyze URL components.
- **IP Address Info** — `/tools/ip-address` — Get information about any IP address.
- **User Agent Parser** — `/tools/user-agent` — Parse and decode browser User-Agent strings.
- **HTTP Headers Info** — `/tools/http-headers` — Understand and analyze HTTP headers.
- **DNS Lookup** — `/tools/dns-lookup` — Look up DNS records for any domain.
- **WHOIS Lookup** — `/tools/whois-lookup` — Get WHOIS information for domains.
- **Port Scanner** — `/tools/port-checker` — Check if ports are open on a server.
- **Ping Test** — `/tools/ping-tool` — Test connectivity to websites.
- **SSL Checker** — `/tools/ssl-checker` — Check SSL certificate details.
- **Htaccess Generator** — `/tools/htaccess-generator` — Generate Apache .htaccess rules.
- **Robots.txt Generator** — `/tools/robots-txt` — Generate robots.txt files.
- **IP Subnet Calculator** — `/tools/ip-subnet-calc` — Calculate network, broadcast, host range from IP and CIDR.
- **URL Builder & Parser** — `/tools/url-builder` — Construct URLs from components or parse existing URLs into parts.
- **Network Speed Test** — `/tools/network-speed-test` — Estimate your download speed and latency directly in the browser.
### File Tools (9)

- **File Size Calculator** — `/tools/file-size-calc` — Calculate file sizes in different units.
- **ZIP Creator** — `/tools/zip-creator` — Create ZIP archives from files.
- **CSV Formatter** — `/tools/csv-formatter` — Format and validate CSV data.
- **File Hash** — `/tools/file-hash` — Calculate hash of any file.
- **CSV to Table** — `/tools/csv-to-table` — Convert CSV to an HTML table.
- **JSON to Table** — `/tools/json-to-table` — Visualize JSON data as a table.
- **Excel to JSON** — `/tools/excel-to-json` — Convert Excel/CSV files to JSON.
- **SQL to CSV** — `/tools/sql-to-csv` — Convert SQL INSERT statements to CSV.
- **File Statistics** — `/tools/file-statistics` — Analyze text file statistics.
### Generators (15)

- **UUID Generator** — `/tools/uuid-generator` — Generate UUIDs v1, v4, v5.
- **QR Code Generator** — `/tools/qr-generator` — Generate QR codes for URLs, text, contact info.
- **Barcode Generator** — `/tools/barcode-generator` — Generate barcodes in EAN, Code128, QR formats.
- **Random String** — `/tools/random-string` — Generate random strings and tokens.
- **Random Email** — `/tools/random-email` — Generate random email addresses for testing.
- **Name Generator** — `/tools/name-generator` — Generate random names from different cultures.
- **Test Credit Card** — `/tools/credit-card-generator` — Generate test credit card numbers (Luhn).
- **IBAN Generator** — `/tools/iban-generator` — Generate and validate IBAN numbers.
- **Random Color** — `/tools/random-color` — Generate random colors and palettes.
- **Random Number List** — `/tools/random-number-list` — Generate a list of random numbers.
- **ULID Generator** — `/tools/ulid-generator` — Generate Universally Unique Lexicographically Sortable IDs.
- **NATO Alphabet** — `/tools/nato-alphabet` — Convert text to NATO phonetic alphabet.
- **Fake Data Generator** — `/tools/fake-data-generator` — Generate realistic fake names, emails, addresses, and more for testing.
- **MAC Address Generator** — `/tools/mac-address-generator` — Generate and validate random or vendor-specific MAC addresses.
- **Number Sequence Generator** — `/tools/number-sequence` — Generate custom number sequences with step, padding, prefix, suffix and separator.
### SEO & Web (8)

- **Meta Tag Generator** — `/tools/meta-tag-generator` — Generate HTML meta tags for SEO.
- **Open Graph Generator** — `/tools/og-tag-generator` — Generate Open Graph meta tags.
- **Sitemap Generator** — `/tools/sitemap-generator` — Build an XML sitemap for your site so search engines can find every page.
- **Word Frequency** — `/tools/word-frequency` — Analyze word frequency in text.
- **Keyword Density** — `/tools/keyword-density` — Check keyword density in content.
- **Reading Time** — `/tools/reading-time` — Calculate estimated reading time.
- **Schema.org Generator** — `/tools/schema-generator` — Generate structured data markup.
- **Twitter Card Generator** — `/tools/twitter-card-generator` — Generate Twitter Card meta tags.
### Time & Date (14)

- **Timestamp Converter** — `/tools/timestamp-converter` — Convert Unix timestamps to dates and back.
- **Date Difference** — `/tools/date-difference` — Calculate the difference between two dates.
- **Date Add/Subtract** — `/tools/date-add-subtract` — Add or subtract days, months, years from a date.
- **Timezone Converter** — `/tools/timezone-converter` — Convert times between world timezones.
- **Age Calculator** — `/tools/age-calculator` — Calculate exact age from birthdate.
- **Countdown Timer** — `/tools/countdown-timer` — Create countdown timers to any date.
- **World Clock** — `/tools/world-clock` — View current time in multiple timezones.
- **Working Days Calculator** — `/tools/working-days` — Calculate working days between dates.
- **Week Number** — `/tools/week-number` — Get week number from any date.
- **Time to Decimal** — `/tools/time-to-decimal` — Convert time (HH:MM) to decimal hours.
- **Day of Year** — `/tools/day-of-year` — Find what day number of the year any date falls on.
- **Moon Phase Calculator** — `/tools/moon-phase` — Find the moon phase for any date — full moon, new moon, crescent.
- **Sunrise & Sunset** — `/tools/sunrise-sunset` — Find sunrise, sunset, and day length for any location and date.
- **Multi-Timezone Converter** — `/tools/multi-timezone` — Convert a time across multiple time zones simultaneously.
### Finance (14)

- **Loan Calculator** — `/tools/loan-calculator` — Calculate monthly payments and interest.
- **Compound Interest** — `/tools/compound-interest` — Calculate compound interest growth.
- **Tip Calculator** — `/tools/tip-calculator` — Calculate restaurant tip amounts.
- **Tax Calculator** — `/tools/tax-calculator` — Calculate taxes on income or purchases.
- **Discount Calculator** — `/tools/discount-calculator` — Calculate sale prices and savings.
- **ROI Calculator** — `/tools/roi-calculator` — Calculate Return on Investment.
- **BMI Calculator** — `/tools/bmi-calculator` — Calculate Body Mass Index.
- **Calorie Calculator** — `/tools/calorie-calculator` — Calculate daily calorie needs (TDEE).
- **Inflation Calculator** — `/tools/inflation-calculator` — Calculate inflation-adjusted values.
- **VAT Calculator** — `/tools/vat-calculator` — Add or remove VAT from prices.
- **Mortgage Calculator** — `/tools/mortgage-calculator` — Calculate monthly payments, total interest, and amortization schedule.
- **Savings Calculator** — `/tools/savings-calculator` — Project savings growth with compound interest and contributions.
- **Profit Margin Calculator** — `/tools/profit-margin` — Calculate gross profit, margin %, markup %, and pricing.
- **Unit Price Calculator** — `/tools/unit-price-calc` — Compare prices per unit to find the best value.
### Social & Media (6)

- **OG Preview** — `/tools/og-preview` — Preview how your page looks on social media.
- **Tweet Image Generator** — `/tools/tweet-generator` — Create Twitter-style tweet images.
- **Instagram Filters** — `/tools/instagram-filters` — Apply Instagram-like filters to images.
- **YouTube Thumbnail** — `/tools/youtube-thumbnail` — Get YouTube video thumbnails.
- **Bio Generator** — `/tools/bio-generator` — Generate social media bio text.
- **Hashtag Generator** — `/tools/hashtag-generator` — Generate relevant hashtags for posts.

## Shared UX / IA patterns
- Every tool has title/one-line description, large dashed drag/drop or click-to-choose input (when file-based), numbered How to use (usually 4 steps), Why use this tool feature cards, FAQ accordion, privacy callout, related tools, breadcrumbs, and footer.
- File outputs use in-browser Blob/download links; multi-output tools commonly download ZIP; text/code tools offer copy/clear/load sample, side-by-side editors/results.
- Search filters the catalog; category pages show count and responsive two-column card grid; no observed favorites/recent/history/account UI.
- Dark theme toggle persists via localStorage; page metadata advertises theme-color. No visible PWA install prompt/manifest found in page resource pass.
- Tool pages are lazy-loaded route chunks; initial loading state appears briefly before tool component.

## Representative tool capability notes

- **PDF Merge** `/tools/pdf-merge`: multiple PDF file input; reorder with up/down arrows; Merge; downloads merged PDF. Local browser processing, offline claim, no stated count limit/watermark; FAQ includes password-protected PDFs.

- **Background Remover** `/tools/background-remover`: PNG/JPG/WebP input; local AI segmentation; transparent/white/black/custom color background; Download PNG/Reset. Uses Transformers.js with `briaai/RMBG-1.4`, WebAssembly/WebGPU; first model approx 44 MB, cached; no watermark/credits. Minimal 1x1 local PNG test triggered runtime model + ONNX/WASM downloads.

- **Video Converter** `/tools/video-converter`: MP4/MOV/MKV/WebM/AVI input/output; format select + quality select (Balanced default); Convert/download. Browser-local FFmpeg via WASM; no upload cap beyond device memory; no watermark/login.

- **Audio Converter** `/tools/audio-converter`: MP3/WAV/M4A/OGG/FLAC; output format and bitrate (128/192/256/320k). Same local FFmpeg pipeline/download template.

- **Transcribe Audio & Video** `/tools/transcribe`: MP4/MOV/MP3/WAV/M4A input; optional Translate to English; Whisper speech model approx 75 MB one-time; audio extracted locally; editable/copyable transcript and `.txt` download. Whisper tiny, dozens of languages; WebAssembly/WebGPU, no API upload.

- **JSON to Code** `/tools/json-to-code`: JSON textarea + Root type name; language tabs TypeScript/Go/Python/Java/C#/Rust; Load sample, generated output pane, Copy/Clear. Entirely in-browser synchronous transformation; no network/API beyond app chunks.

- **Image Compress** `/tools/image-compress`: browser-image-compression CDN library; client-side image input, quality/size/format controls inferred from chunk, download; worker-backed compression.

- **HEIC conversions** `/tools/heic-to-jpg`, `/tools/heic-to-png`: HEIC image input, client-side `heic2any@0.0.4` from esm.sh; output download.

- **Text to Speech** `/tools/text-to-speech`: browser/device speech synthesis voices; text input, voice/rate/pitch controls and playback; no server model indicated.

- **PDF text/render tools** (`pdf-to-text`, `pdf-grayscale`, `redact-pdf`): client-side PDF workflows; public chunks construct pdf.js worker URLs from jsDelivr (`pdfjs-dist`); download outputs.

- **Zip Creator** `/tools/zip-creator`: multiple local files -> ZIP download, browser-side; no server upload.


## Per-category capability matrix

- PDF: merge/split/compress/extract text/rotate/watermark/page numbers/metadata/unlock/grayscale/crop/redact; pdf.js worker for reader/render paths.
- Image: resize/convert/crop/rotate/grayscale/adjust/blur/watermark/base64/metadata/picker/collage/favicon/background removal plus HEIC/WebP/AVIF/SVG conversions and ASCII/placeholder/borders.
- Video & Audio: extract/compress/trim/GIF/mute/transcribe/converters/screen record/subtitles/resize/crop/merge/speed/reverse/loop/split/add music/cut/adjust/slideshow/reframe/volume/frames/watermark/remove silence/boomerang/green screen; FFmpeg WASM for most transforms.
- Text: counting/case/diff/sort/deduplicate/reverse/lorem/slug/spacing/HTML/Markdown/truncate/repeat/extractors/numeral/code-like text, speech/SSML, statistics and generators.
- Developer: JSON/XML/YAML/CSV/HTML/CSS/JS/SQL/Markdown/TOML format/convert/minify; Base64/URL/HTML encode/decode; regex/JWT/CSS units/diffs/schema/GraphQL/cron and code generators.
- Math: calculators, number bases, primes, sequences, statistics, matrices, ratios, bitwise, fractions, quadratics/logs and geometry/finance/time helper calculators.
- Converters: length/weight/temp/speed/area/volume/storage/pressure/energy/power/angle/fuel/currency/duration/resolution/color.
- Color: picker/palettes/gradients/contrast/shades/color-blindness and HEX/RGB/name/mixer/CSS names.
- Crypto/Security: hashes, bcrypt, passwords/strength, UUID/HMAC/AES/JWT/OTP/checksum/ciphers/RSA.
- Network: URL/IP/User-Agent/headers/DNS/WHOIS/ports/ping/SSL; these are the main tools that intentionally call outside services.
- File: size/ZIP/CSV/hash/table/Excel/SQL/file statistics.
- Generators: QR/barcodes/random strings/emails/names/test credit cards/IBAN/colors/numbers/ULID/NATO.
- SEO: meta/OG/sitemap/keyword density/reading time/schema/Twitter card/frequency.
- Time: Unix/date math/timezones/age/countdown/world clock/working days/week/time decimal.
- Finance: loan/compound interest/tip/tax/discount/ROI/BMI/calorie/inflation/VAT/sales tax/retirement/net worth/currency.
- Social: OG preview/tweet image/Instagram filters/YouTube thumbnail/bio/hashtags.


## Network / performance fingerprints

- Initial page and all routes use Vite-like hashed ESM chunks: `/assets/index-BAEWVsuI.js`, `/assets/index-Ciezbd5D.css`, lazy route chunks, plus `ToolLayout-1f-8Mxns.js`, `button-CiEw8uFC.js`, `index-pr70sMka.js`. No first-party application API endpoint observed in page loads; tools are mostly local.
- Public resource hosts observed: `footrue.com`/Cloudflare hosting, Google Fonts, `static.cloudflareinsights.com`, Google Analytics (`googletagmanager.com`/`google-analytics.com`), AdSense/pagead plus ad quality/recaptcha frames.
- FFmpeg family imports `ffmpeg-mI5KjvPb.js`, worker `/assets/worker-BAOIWoxA.js`, FFmpeg core `@ffmpeg/core@0.12.10` from unpkg first with jsDelivr fallback; `ffmpeg-core.js` and `ffmpeg-core.wasm`, cache key is local cache storage.
- Transcribe imports `whisper-bPiXpwg7.js` and Transformers.js; uses Whisper tiny model (site says ~75 MB) from Hugging Face model delivery, FFmpeg for video audio extraction, and WebAssembly/WebGPU.
- Background Remover imports `transformers.web-UCYbrz6h.js`, model id `briaai/RMBG-1.4`; observed Network log after tiny local test: `model_quantized.onnx` redirect/load, ~44.4 MB model request, `ort-wasm-simd-threaded` JS and ~3.76 MB `.wasm`. No upload request.
- PDF worker references use jsDelivr `pdfjs-dist@<version>/build/pdf.worker.min.mjs`; public chunk signals observed for PDF text/grayscale/redaction.
- HEIC converter references `https://esm.sh/heic2any@0.0.4`. Image compression references `https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.js` and `new Worker`.
- High-level chunk scan found WebAssembly/FFmpeg signals across video/audio transform routes; no `.gguf` signals. JSON-to-Code chunk contains no external runtime/model.
- Privacy policy discloses external service calls: ipapi.co (IP info), Cloudflare DNS (DNS lookup), entered site/Cloudflare for ping/speed, external WHOIS/SSL websites. These intentionally send only requested domain/IP, not files.


## Privacy / business / info pages
- About: 270+ claim (homepage/current catalog is 316); browser-local, no signup/paywall on core tools, no ads interrupting work, offline-friendly.
- Privacy (updated Sep 13, 2026): files never uploaded/stored; program files may be fetched/cached from public CDNs; standard technical info collected; Google Analytics; Google AdSense cookies/advertising (despite homepage “no ads” UX claim); theme localStorage/cache; no accounts; no sale of personal data.
- Terms (Sep 13, 2026): free/no account, lawful use, keep rights to files; calculators informational; third-party/open-source licenses; as-is/no warranty; no automated overload, unauthorized scanning, or misuse of generated test data.
- Contact: click-to-reveal email; requests bug reports/tool requests/feedback.
- `/blog`, `/pricing`, `/faq` returned styled 404 (“Page Not Found”); no separate pricing/blog/FAQ page found.


## SEO/theme/PWA and gaps
- HTML metadata: title “Footrue - 200+ Free Online Tools”, description, robots index/follow, canonical, OG/Twitter metadata, `/opengraph.jpg`, favicon variants, Inter + JetBrains Mono, WebSite JSON-LD.
- No visible favorites, recent tools, sign-in, pricing tiers, or user workspace.
- Unknowns: exact versions/URLs of Hugging Face model artifacts can vary by runtime/cache/redirect; many tool-specific runtime requests were not triggered with real media; browser support/performance and practical memory limits are not formally documented.

## Captured screenshots
Browser screenshots saved by the managed browser tool:
- Homepage: `/tmp/.sand-browser/shot-call_8035100xnQQHwT7yD4ALAdANfc_03f223b62ed149a3.png`
- PDF category/tools index: `/tmp/.sand-browser/shot-call_3jMeg57CWcmFuqb6ea2SAhRNfc_03f223b62ed149a3.png`
- PDF Merge: `/tmp/.sand-browser/shot-call_4cFPDFPmOMeZ6n1L8Ua6Nkg7fc_03f223b62ed149a3.png`
- Background Remover: `/tmp/.sand-browser/shot-call_9ccUpz3lho4j8xschTH96cvwfc_03f223b62ed149a3.png`
- Video Converter: `/tmp/.sand-browser/shot-call_CuNH0ILNvauFitjlZomdm2o5fc_03f223b62ed149a3.png`
- Transcribe: `/tmp/.sand-browser/shot-call_64HtNgrdzO8Jt2XkzF1Z2gOsfc_03f223b62ed149a3.png`
- Native Chrome Network panel with Background Remover model/WASM requests visible: `file:///home/box/agent-data/agents/1c939996-6e49-4d36-bd44-eb58d8efe08f/assets/ca92a24c273102af84948c0f5283822123797b57302b8b16a43ea1fa3fd35d11.webp`
- Full-page homepage/tools catalog: `/tmp/.sand-browser/shot-call_036N9yWP1k0tvcGuwlrGpvUUfc_0432d58c25efb9dc.png`
- Homepage dark-theme state: `/tmp/.sand-browser/shot-call_Eua0NpRkCNRFMy8qcQ45qmtPfc_03159aaa85a48f5f.png`
