'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, type Booking, type EventType } from '@/lib/supabase'
import { useUserName, useIsAdmin } from '@/lib/auth'
import styles from './Calendar.module.css'

/* ─── Config ─────────────────────────────────────────────── */

const EVENT_TYPES: { id: EventType; label: string; emoji: string; color: string }[] = [
  { id: 'grill',   label: 'Grill rodzinny',   emoji: '🔥', color: '#C0622F' },
  { id: 'visit',   label: 'Zwykła wizyta',    emoji: '🌱', color: '#4A6741' },
  { id: 'work',    label: 'Prace na działce', emoji: '🛠️', color: '#5C3D2E' },
  { id: 'private', label: 'Prywatna wizyta',  emoji: '🏡', color: '#7B5EA7' },
]

const MONTHS = [
  'Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec',
  'Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień',
]

const DAYS_SHORT = ['Pon','Wt','Śr','Czw','Pt','Sob','Nie']

/* ─── Helpers ─────────────────────────────────────────────── */

function toDateKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function todayKey() {
  const d = new Date()
  return toDateKey(d.getFullYear(), d.getMonth(), d.getDate())
}

function getDaysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate()
}

function getFirstDayMon(y: number, m: number) {
  const d = new Date(y, m, 1).getDay()
  return d === 0 ? 6 : d - 1
}

function pluralize(n: number) {
  if (n === 1) return '1 rezerwacja'
  if (n >= 2 && n <= 4) return `${n} rezerwacje`
  return `${n} rezerwacji`
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function getEventType(type: EventType) {
  return EVENT_TYPES.find(e => e.id === type) ?? EVENT_TYPES[1]
}

/* ─── Component ───────────────────────────────────────────── */

export default function Calendar() {
  const userName = useUserName()
  const isAdmin = useIsAdmin()
  const now = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [bookings, setBookings] = useState<Record<string, Booking[]>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [view, setView] = useState<'calendar' | 'day'>('calendar')
  const [form, setForm] = useState({ title: '', type: 'visit' as EventType, note: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [booked, setBooked] = useState(false)
  const [liveIndicator, setLiveIndicator] = useState(false)
  const TODAY = todayKey()

  /* ── Load all bookings ── */
  const fetchBookings = useCallback(async () => {
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .order('date', { ascending: true })
    if (data) {
      const grouped: Record<string, Booking[]> = {}
      for (const b of data as Booking[]) {
        grouped[b.date] = grouped[b.date] ? [...grouped[b.date], b] : [b]
      }
      setBookings(grouped)
    }
    setLoading(false)
  }, [])

  /* ── Real-time subscription ── */
  useEffect(() => {
    fetchBookings()

    const channel = supabase
      .channel('bookings-rt')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          fetchBookings()
          setLiveIndicator(true)
          setTimeout(() => setLiveIndicator(false), 1200)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchBookings])

  /* ── Add booking ── */
  async function addBooking() {
    if (!selected) return
    setSaving(true)
    await supabase.from('bookings').insert({
      date: selected,
      name: userName,
      title: form.title.trim() || null,
      type: form.type,
      note: form.note.trim() || null,
    })
    setForm({ title: '', type: 'visit', note: '' })
    setSaving(false)
    setBooked(true)
  }

  /* ── Remove booking ── */
  async function removeBooking(id: string) {
    await supabase.from('bookings').delete().eq('id', id)
  }

  /* ── Navigation ── */
  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  function openDay(day: number) {
    setSelected(toDateKey(year, month, day))
    setView('day')
    setForm({ title: '', type: 'visit', note: '' })
    setBooked(false)
  }

  /* ── Calendar grid data ── */
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay    = getFirstDayMon(year, month)
  const dayBookings = selected ? (bookings[selected] ?? []) : []

  /* ── Upcoming ── */
  const upcoming = Object.entries(bookings)
    .filter(([k]) => k >= TODAY)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 6)

  /* ─────────────────────────────────────────────────────────
     RENDER
  ──────────────────────────────────────────────────────────*/
  return (
    <div className={styles.app}>

      {/* HEADER */}
      <header className={styles.header}>
        <span className={styles.headerIcon}>🌿</span>
        <div>
          <div className={styles.headerTitle}>ROD ZREMB</div>
          <div className={styles.headerSub}>ul. Potulicka 3 · Warszawa</div>
        </div>
        <div className={styles.headerRight}>
          {liveIndicator && <span className={styles.liveDot} />}
          <span className={styles.liveLabel}>na żywo</span>
        </div>
      </header>

      <div className={styles.container}>

        {loading ? (
          <div className={styles.loader}>🌱 Ładowanie rezerwacji…</div>
        ) : view === 'calendar' ? (

          /* ══ CALENDAR VIEW ══════════════════════════════════ */
          <>
            {/* Month nav */}
            <div className={styles.monthNav}>
              <button className={styles.navBtn} onClick={prevMonth}>‹</button>
              <div className={styles.monthLabel}>
                <span className={styles.monthName}>{MONTHS[month]}</span>
                <span className={styles.yearName}>{year}</span>
              </div>
              <button className={styles.navBtn} onClick={nextMonth}>›</button>
            </div>

            {/* Day headers */}
            <div className={styles.dayHeaders}>
              {DAYS_SHORT.map(d => <div key={d} className={styles.dayHeader}>{d}</div>)}
            </div>

            {/* Grid */}
            <div className={styles.grid}>
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`e${i}`} className={styles.emptyCell} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day  = i + 1
                const key  = toDateKey(year, month, day)
                const bks  = bookings[key] ?? []
                const isToday = key === TODAY
                const isPast  = key < TODAY
                const hasGrill = bks.some(b => b.type === 'grill')
                const hasWork  = bks.some(b => b.type === 'work')

                let cellMod = ''
                if (isToday)      cellMod = styles.cellToday
                else if (bks.length && hasGrill) cellMod = styles.cellGrill
                else if (bks.length && hasWork)  cellMod = styles.cellWork
                else if (bks.length)             cellMod = styles.cellBooked
                else if (isPast)                 cellMod = styles.cellPast

                return (
                  <button
                    key={day}
                    className={`${styles.cell} ${cellMod}`}
                    onClick={() => openDay(day)}
                  >
                    <span className={styles.cellDay}>{day}</span>
                    {bks.length > 0 && (
                      <div className={styles.cellEmojis}>
                        {[...new Set(bks.map(b => b.type))].map(t => (
                          <span key={t}>{getEventType(t).emoji}</span>
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div className={styles.legend}>
              <div className={styles.legendTitle}>Rodzaje wydarzeń</div>
              <div className={styles.legendGrid}>
                {EVENT_TYPES.map(et => (
                  <div key={et.id} className={styles.legendItem}>
                    <span>{et.emoji}</span> {et.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div className={styles.upcoming}>
                <div className={styles.legendTitle}>Nadchodzące rezerwacje</div>
                {upcoming.map(([key, bks]) => {
                  const d = new Date(key + 'T12:00:00')
                  return (
                    <button
                      key={key}
                      className={styles.upcomingRow}
                      onClick={() => { setSelected(key); setView('day') }}
                    >
                      <div className={styles.upcomingDate}>
                        <span className={styles.upcomingDay}>{d.getDate()}</span>
                        <span className={styles.upcomingMonth}>
                          {d.toLocaleDateString('pl-PL', { month: 'short' })}
                        </span>
                      </div>
                      <div className={styles.upcomingInfo}>
                        <div className={styles.upcomingNames}>
                          {bks.map(b => b.name).join(', ')}
                        </div>
                        <div className={styles.upcomingEmojis}>
                          {[...new Set(bks.map(b => b.type))].map(t => (
                            <span key={t}>{getEventType(t).emoji}</span>
                          ))}
                        </div>
                      </div>
                      <div className={styles.upcomingCount}>{pluralize(bks.length)}</div>
                    </button>
                  )
                })}
              </div>
            )}
          </>

        ) : (

          /* ══ DAY VIEW ═══════════════════════════════════════ */
          <>
            <button className={styles.back} onClick={() => setView('calendar')}>
              ← Wróć do kalendarza
            </button>

            <div className={styles.dayTitle}>
              {selected && formatDate(selected).replace(/^\w/, c => c.toUpperCase())}
            </div>

            {/* Existing bookings */}
            {dayBookings.length === 0 ? (
              <div className={styles.empty}>Brak rezerwacji na ten dzień</div>
            ) : (
              <div className={styles.bookingList}>
                {dayBookings.map(b => {
                  const et = getEventType(b.type)
                  return (
                    <div key={b.id} className={styles.bookingCard} style={{ borderColor: et.color + '55' }}>
                      <span className={styles.bookingEmoji}>{et.emoji}</span>
                      <div className={styles.bookingBody}>
                        <div className={styles.bookingName}>{b.name}</div>
                        {b.title && <div className={styles.bookingTitle}>{b.title}</div>}
                        <div className={styles.bookingTag} style={{ color: et.color, background: et.color + '18' }}>
                          {et.label}
                        </div>
                        {b.note && <div className={styles.bookingNote}>„{b.note}"</div>}
                      </div>
                      {(isAdmin || b.name === userName) && (
                        <button className={styles.removeBtn} onClick={() => removeBooking(b.id)} title="Usuń">×</button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Add form / status */}
            {booked ? (
              <div className={styles.successNote}>
                ✅ Zarezerwowano pomyślnie!
              </div>
            ) : selected && selected >= TODAY ? (
              dayBookings.length > 0 ? (
                <div className={styles.takenNote}>
                  🔒 Ten dzień jest już zarezerwowany
                </div>
              ) : (
                <div className={styles.form}>
                  <div className={styles.formTitle}>+ Dodaj rezerwację</div>
                  <div className={styles.userLabel}>Rezerwujesz jako: <strong>{userName}</strong></div>

                  <label className={styles.label}>Tytuł (opcjonalnie)</label>
                  <input
                    className={styles.input}
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="np. Urodziny, Długi weekend…"
                  />

                  <label className={styles.label}>Rodzaj wizyty</label>
                  <div className={styles.typeGrid}>
                    {EVENT_TYPES.map(et => (
                      <button
                        key={et.id}
                        className={`${styles.typeBtn} ${form.type === et.id ? styles.typeBtnActive : ''}`}
                        style={form.type === et.id
                          ? { borderColor: et.color, background: et.color + '18', color: et.color }
                          : {}}
                        onClick={() => setForm(f => ({ ...f, type: et.id }))}
                      >
                        <span>{et.emoji}</span> {et.label}
                      </button>
                    ))}
                  </div>

                  <label className={styles.label}>Notatka (opcjonalnie)</label>
                  <input
                    className={styles.input}
                    value={form.note}
                    onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                    placeholder="np. Sadzę pomidory, przynoszę kiełbaski…"
                  />

                  <button
                    className={styles.submitBtn}
                    disabled={saving}
                    onClick={addBooking}
                  >
                    {saving ? 'Zapisywanie…' : 'Zarezerwuj ten dzień 🌱'}
                  </button>
                </div>
              )
            ) : (
              <div className={styles.pastNote}>Ta data już minęła</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
