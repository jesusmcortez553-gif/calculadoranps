# Calculadora NPS — BCP Pichanaki

Calculadora NPS con gauge estilo Medallia. React + Vite, sin frameworks de UI.

## Deploy en Vercel

1. Sube esta carpeta a un repo de GitHub (o usa `vercel` CLI directamente).
2. En Vercel: New Project → importa el repo.
3. Vercel detecta Vite automáticamente (build: `vite build`, output: `dist`). No configures nada.
4. Deploy.

## Desarrollo local

```
npm install
npm run dev
```

## Geometría del gauge (referencia)

- Centro (77.5, 77.5), radio 62
- Start: 8:00 = SVG 150° · End/badge ✦: 4:00 = SVG 30° · Sweep 240° horario · Gap inferior 120°
- svgDeg = (150 + arcDeg) % 360, donde arcDeg = ((NPS + 100) / 200) × 240
- Track: rojo claro 204° (−100→70), amarillo claro 12° (70→80), verde claro 24° (80→100)
