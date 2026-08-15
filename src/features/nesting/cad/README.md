# CAD parsers (transicional)

La autoridad de **nest** es el backend (`POST /engineering/nest`).

Estos parsers (DXF/GEO/PDF) aún corren en el cliente para preview e import local.
Migración objetivo: upload de archivo → API engineering → piezas normalizadas,
para no exponer el pipeline CAD en el bundle del browser.
