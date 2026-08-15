# CAD parsers (transicional)

- Nest pack: solo backend (`POST /engineering/nest` o `/engineering/nest/jobs`).
- Parse DXF en back (primer escalón): `POST /engineering/cad/parse-dxf` (multipart `file`).
- Parsers locales (DXF/GEO/PDF) siguen para preview/import hasta migrar el flujo de UI al upload.
