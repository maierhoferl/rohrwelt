# Rohrwelt 🔧

Rohr-Flick-Spiel für Adrian & Lorenz. Läuft komplett im Browser.

## Spielen
`index.html` im Browser öffnen – oder über GitHub Pages hosten.

## Auf GitHub Pages veröffentlichen
1. Neues Repo anlegen, diese Dateien hochladen (`index.html`, `style.css`, `game.js`, `audio.js`).
2. Repo → Settings → Pages → „Deploy from a branch“ → `main` / root.
3. Nach ~1 Minute unter `https://<name>.github.io/<repo>/` spielbar.

## Sicherheit
- Reine statische Dateien, keine Server, keine Cookies, kein Tracking, keine externen Downloads.
- Content-Security-Policy: nur eigene Skripte/Styles, kein `eval`, keine Formulare, keine Netzwerkanfragen.
- Spielstand nur lokal im Browser (`localStorage`).
- Musik & Geräusche werden live per WebAudio erzeugt (keine Audio-Dateien).

## Test
`node test.js` prüft die Level-Erzeugung (Rohrwege, Lecks, Lager, Zeit).
