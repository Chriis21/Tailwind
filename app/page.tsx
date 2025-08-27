'use client'

import { useEffect, useMemo, useState } from 'react'
import { getSupabaseClient } from '../lib/supabase'

type Measurement = {
  id: number
  ts: string
  value: number
  source: string
}

type RealtimeStatus = 'initializing' | 'active' | 'error' | 'closed'

export default function Page() {
  const [rows, setRows] = useState<Measurement[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('initializing')

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      let supabase
      try {
        supabase = getSupabaseClient()
      } catch (e) {
        if (!isMounted) return
        setErrorMessage('Fehlende Umgebungsvariablen für Supabase.')
        setInitialLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('measurements')
        .select('*')
        .order('ts', { ascending: false })
        .limit(50)

      if (!isMounted) return

      if (error) {
        setErrorMessage('Fehler beim Laden der Messwerte.')
      } else {
        setRows((data ?? []) as Measurement[])
      }

      setInitialLoading(false)
    })()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let supabase
    try {
      supabase = getSupabaseClient()
    } catch (e) {
      setRealtimeStatus('error')
      return
    }
    const channel = supabase
      .channel('realtime:public:measurements')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'measurements' },
        (payload) => {
          const inserted = payload.new as Measurement
          setRows((current) => {
            const withoutExisting = current.filter((r) => r.id !== inserted.id)
            const next = [inserted, ...withoutExisting]
            return next.slice(0, 200)
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'measurements' },
        (payload) => {
          const updated = payload.new as Measurement
          setRows((current) => {
            const withoutExisting = current.filter((r) => r.id !== updated.id)
            const next = [updated, ...withoutExisting]
            return next.slice(0, 200)
          })
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeStatus('active')
        else if (status === 'CHANNEL_ERROR') setRealtimeStatus('error')
        else if (status === 'CLOSED') setRealtimeStatus('closed')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const latest = useMemo(() => (rows.length ? rows[0] : null), [rows])

  const formatPercent = (v: number) => `${v.toFixed(2)} %`
  const formatTs = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'medium' })

  return (
    <main className="mx-auto max-w-5xl p-6 md:p-8 space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-semibold text-white/90">
          Live-Dashboard • public.measurements
        </h1>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6">
          <div className="text-sm uppercase tracking-wide text-white/60 mb-3">Aktueller Wert</div>
          {latest ? (
            <div>
              <div className="text-5xl md:text-6xl font-semibold tracking-tight">
                {formatPercent(latest.value)}
              </div>
              <div className="mt-3 text-white/70 text-sm">
                Quelle: <span className="text-white/90">{latest.source}</span> • Zeit:{' '}
                <span className="text-white/90">{formatTs(latest.ts)}</span>
              </div>
            </div>
          ) : initialLoading ? (
            <div className="text-white/70">Lade…</div>
          ) : (
            <div className="text-white/70">Keine Daten geladen.</div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6">
          <div className="text-sm uppercase tracking-wide text-white/60 mb-3">Status</div>
          <div className="flex items-center gap-3">
            <span
              className={
                'inline-flex h-2.5 w-2.5 rounded-full ' +
                (realtimeStatus === 'active'
                  ? 'bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.7)]'
                  : realtimeStatus === 'error'
                  ? 'bg-rose-400'
                  : 'bg-yellow-400')
              }
            />
            <span className="text-white/90">
              Realtime:{' '}
              {realtimeStatus === 'active'
                ? 'aktiv'
                : realtimeStatus === 'error'
                ? 'Fehler'
                : realtimeStatus === 'closed'
                ? 'geschlossen'
                : 'verbinden…'}
            </span>
          </div>
          <div className="mt-2 text-white/70">
            Datensätze: <span className="text-white/90">{rows.length}</span>
          </div>
          <div className="text-white/70">
            Schema/Tabelle: <span className="text-white/90">public.measurements</span>
          </div>
          {errorMessage ? (
            <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-rose-200">
              {errorMessage}
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6">
        <div className="mb-4 text-sm uppercase tracking-wide text-white/60">Letzte Werte</div>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr className="text-left text-white/60 text-sm">
                <th className="py-2 pr-4 font-medium">Zeit</th>
                <th className="py-2 pr-4 font-medium">Wert</th>
                <th className="py-2 pr-4 font-medium">Quelle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {rows.map((r) => (
                <tr key={r.id} className="text-white/90">
                  <td className="py-2 pr-4 whitespace-nowrap">{formatTs(r.ts)}</td>
                  <td className="py-2 pr-4">{formatPercent(r.value)}</td>
                  <td className="py-2 pr-4">{r.source}</td>
                </tr>
              ))}
              {!rows.length && !initialLoading ? (
                <tr>
                  <td className="py-4 text-white/70" colSpan={3}>
                    Keine Daten vorhanden.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

