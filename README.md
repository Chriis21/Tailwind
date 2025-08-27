## Live-Dashboard (Next.js 14 + Tailwind v4 + Supabase Realtime)

Ein kleines, dunkles Dashboard für `public.measurements` mit Live-Updates (INSERT/UPDATE) aus Supabase – gebaut für Deployment auf [Vercel](https://vercel.com/).

### Voraussetzungen
- Node.js 18+
- Supabase-Projekt mit Tabelle `public.measurements`:
  - Spalten: `id bigserial primary key`, `ts timestamptz not null default now()`, `value real not null`, `source text not null`
  - RLS aktiv mit SELECT-Policy
  - Realtime für `public.measurements` aktiviert (Publication: `supabase_realtime`)

### Setup lokal
1. Abhängigkeiten installieren:
   ```bash
   npm i
   ```
2. `.env.local` anlegen:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>
   ```
3. Dev-Server starten:
   ```bash
   npm run dev
   ```
4. Aufruf: http://localhost:3000

Es ist keine weitere Konfiguration nötig. Tailwind v4 ist über PostCSS eingebunden.

### Realtime testen
Führe im Supabase SQL Editor z. B. aus:
```sql
insert into public.measurements (value, source) values (42.5, 'test');
```
Erwartung: Der Eintrag erscheint sofort oben in der Tabelle und aktualisiert die „Aktueller Wert“-Kachel.

Update-Test:
```sql
update public.measurements
set value = 70.1
where id = <id>;
```
Erwartung: Der geänderte Eintrag rutscht nach oben und ersetzt sich selbst.

### Architektur
- `app/page.tsx` (Client Component):
  - Lädt initial die letzten 50 Einträge (`order ts desc`).
  - Realtime-Subscribe auf INSERT und UPDATE; neue/aktualisierte Zeilen werden vorne eingefügt/ersetzt.
  - State wird auf max. 200 Items begrenzt.
  - Kacheln: „Aktueller Wert“ (neueste Zeile), „Status“ (Realtime, Anzahl, Tabelle).
  - Tabelle „Letzte Werte“: lokale Zeit, Prozent mit 2 Nachkommastellen, `source`.
- `lib/supabase.ts`: Browser-Client mit `persistSession:false`. Nur `NEXT_PUBLIC_*` Variablen.
- Tailwind v4: `@import "tailwindcss";` in `app/globals.css`, Plugin `@tailwindcss/postcss` in `postcss.config.mjs`.

### Fehlerbehandlung
- Ladefehler werden im UI angezeigt (ohne Keys zu loggen).
- Realtime-Channel wird beim Unmount entfernt.

### Deployment auf Vercel
- Projekt zu [Vercel](https://vercel.com/) importieren oder via CLI deployen.
- In den Project Settings die gleichen Variablen setzen:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Build & Runtime stehen damit zur Verfügung. Nach dem Deploy sollte das Live-Dashboard ohne weitere Änderungen funktionieren.

### Lizenz
MIT

