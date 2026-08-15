# CAD (cliente)

- **DXF / GEO** → `POST /engineering/cad/parse` (back, multi-pieza DXF).
- **PDF** → `pdf-parser.ts` en el browser (`pdfjs-dist` ya está en el front).
  No se parsea PDF en el servidor (evita dependencia y timeouts en deploy).
- **Material** → `thickness-scanner` / `material-audit` (UI).
