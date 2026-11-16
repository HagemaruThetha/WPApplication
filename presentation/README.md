# Interview deck: School WordPress on AWS

An 8-slide executive summary of this Terraform submission for a technical interview panel.

| File | What it is |
|---|---|
| `deck.html` | Interactive React deck in one file. Works offline: open it in any browser |
| `School_WordPress_on_AWS.pptx` | Editable PowerPoint version with the same content and speaker notes |

## Presenting `deck.html`

| Key | Action |
|---|---|
| → / Space / click | Next slide |
| ← | Previous slide |
| N | Show or hide speaker notes |
| O | Overview grid |
| F | Full screen |
| 1–8 | Jump to a slide |
| Ctrl/Cmd + P | Print or save as PDF, one slide per page |

Slide 5 has live buttons that step the Auto Scaling group between 1 and 4 instances.

## Editing

All wording, figures and speaker notes live in `content.js`, which feeds both outputs.

```bash
cd presentation
npm install
npm run build        # writes deck.html and School_WordPress_on_AWS.pptx
```

- `src/app.js`, `src/styles.css`: the React slides (React 18 with `htm`, no bundler)
- `build-pptx.js`: PowerPoint layouts and slides (pptxgenjs), theme applied by `lib/apply_theme.js`
- `icons.js`: Font Awesome icons via react-icons, shared by both builds
