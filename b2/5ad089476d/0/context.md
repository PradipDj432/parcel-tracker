# Session Context

## User Prompts

### Prompt 1

You know over old converions where we left last time ? and what things we are doing

### Prompt 2

okay where did you find out plans road map?

### Prompt 3

right now detect apis not wroking its give 200 response but getting empty courire list

### Prompt 4

First go thouth the code and correct if anythings is wrong after that start phase - 8 | 
## Phase 8: Bulk Import
50. **Build import page** (`/import`)
51. **CSV upload** — drag-and-drop zone or file input, parse with `papaparse`
52. **Validation report** — show table of parsed rows, highlight invalid ones (missing tracking number, bad courier code)
53. **Review & confirm step** — user removes bad rows or fixes them, then clicks "Submit"
54. **Progress UI** — show a progress bar as each t...

### Prompt 5

yes commit it

### Prompt 6

push it

### Prompt 7

okay lets start phase 9 | 
## Phase 9: Shareable Tracking Pages
58. **Generate a unique `public_slug`** for each tracking (e.g., nanoid or short uuid)
59. **Build public tracking page** (`/track/[id]`):
    - Fetch tracking by `public_slug` where `is_public = true`
    - Show full timeline (no login required)
    - Generate and display a **QR code** linking to this page
60. **Build OG image route** (`/api/og/[id]`):
    - Use Next.js `ImageResponse` (from `next/og`) to generate a dynamic social ...

