'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, type FundraisingPot } from '@/lib/supabase'
import { useIsAdmin } from '@/lib/auth'
import styles from './Fundraising.module.css'

function formatPLN(amount: number) {
  return amount.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pl-PL', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function Fundraising() {
  const isAdmin = useIsAdmin()
  const [pots, setPots] = useState<FundraisingPot[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', description: '', goal_amount: '', creator_name: '' })
  const [saving, setSaving] = useState(false)
  const [raisedInputs, setRaisedInputs] = useState<Record<string, string>>({})

  const fetchPots = useCallback(async () => {
    const { data } = await supabase
      .from('fundraising')
      .select('*')
      .order('is_complete', { ascending: true })
      .order('created_at', { ascending: false })
    if (data) setPots(data as FundraisingPot[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPots()
    const channel = supabase
      .channel('fundraising-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fundraising' }, fetchPots)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchPots])

  async function addPot() {
    const amount = parseFloat(form.goal_amount)
    if (!form.title.trim() || !form.creator_name.trim() || isNaN(amount) || amount <= 0) return
    setSaving(true)
    await supabase.from('fundraising').insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      goal_amount: amount,
      raised_amount: 0,
      is_complete: false,
      creator_name: form.creator_name.trim(),
    })
    setForm({ title: '', description: '', goal_amount: '', creator_name: '' })
    setSaving(false)
  }

  async function updateRaised(pot: FundraisingPot) {
    const val = parseFloat(raisedInputs[pot.id] ?? '')
    if (isNaN(val) || val < 0) return
    await supabase.from('fundraising').update({ raised_amount: val }).eq('id', pot.id)
    setRaisedInputs(r => { const n = { ...r }; delete n[pot.id]; return n })
  }

  async function completePot(id: string) {
    await supabase.from('fundraising').update({ is_complete: true }).eq('id', id)
  }

  const canSubmit = form.title.trim() && form.creator_name.trim() &&
    parseFloat(form.goal_amount) > 0 && !saving

  return (
    <div className={styles.column}>
      <div className={styles.header}>
        <span className={styles.headerIcon}>💰</span>
        <div className={styles.headerTitle}>Zbiórki</div>
        {isAdmin && <div className={styles.adminBadge}>Admin</div>}
      </div>

      <div className={styles.body}>
        <div className={styles.banner}>
          Wszystkie wpłaty kieruj bezpośrednio do <strong>Tomasza Częścika</strong>
        </div>

        {loading ? (
          <div className={styles.loader}>💰 Ładowanie…</div>
        ) : (
          <>
            {pots.length === 0 && (
              <div className={styles.empty}>Brak aktywnych zbiórek</div>
            )}

            <div className={styles.list}>
              {pots.map(pot => {
                const pct = pot.goal_amount > 0
                  ? Math.min(100, Math.round((pot.raised_amount / pot.goal_amount) * 100))
                  : 0
                const raisedVal = raisedInputs[pot.id] ?? ''

                return (
                  <div
                    key={pot.id}
                    className={`${styles.potCard} ${pot.is_complete ? styles.potCardComplete : ''}`}
                  >
                    <div className={styles.potHeader}>
                      <div className={styles.potTitle}>{pot.title}</div>
                      {pot.is_complete && (
                        <div className={styles.completeBadge}>✓ Zakończona</div>
                      )}
                    </div>

                    {pot.description && (
                      <div className={styles.potDesc}>{pot.description}</div>
                    )}

                    <div className={styles.progressWrap}>
                      <div className={styles.progressLabels}>
                        <span className={styles.progressRaised}>
                          Zebrano: {formatPLN(pot.raised_amount)}
                        </span>
                        <span>Cel: {formatPLN(pot.goal_amount)} ({pct}%)</span>
                      </div>
                      <div className={styles.progressTrack}>
                        <div
                          className={`${styles.progressFill} ${pot.is_complete ? styles.progressFillComplete : ''}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className={styles.potMeta}>
                      <span>{pot.creator_name}</span>
                      <span>{formatDate(pot.created_at)}</span>
                    </div>

                    {isAdmin && !pot.is_complete && (
                      <div className={styles.adminPanel}>
                        <div className={styles.adminLabel}>Panel admina</div>
                        <div className={styles.adminRow}>
                          <input
                            className={styles.adminInput}
                            type="number"
                            min="0"
                            step="0.01"
                            value={raisedVal}
                            onChange={e => setRaisedInputs(r => ({ ...r, [pot.id]: e.target.value }))}
                            placeholder={`Teraz: ${formatPLN(pot.raised_amount)}`}
                          />
                          <button
                            className={styles.adminSaveBtn}
                            disabled={raisedVal === '' || isNaN(parseFloat(raisedVal))}
                            onClick={() => updateRaised(pot)}
                          >
                            Zapisz
                          </button>
                        </div>
                        <button className={styles.completeBtn} onClick={() => completePot(pot.id)}>
                          ✓ Zakończ zbiórkę
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className={styles.form}>
              <div className={styles.formTitle}>+ Dodaj zbiórkę</div>
              <input
                className={styles.input}
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Tytuł np. Nowa furtka"
              />
              <textarea
                className={styles.textarea}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Opis (opcjonalnie)"
                rows={2}
              />
              <input
                className={styles.input}
                type="number"
                min="0"
                step="0.01"
                value={form.goal_amount}
                onChange={e => setForm(f => ({ ...f, goal_amount: e.target.value }))}
                placeholder="Cel zbiórki (PLN)"
              />
              <input
                className={styles.input}
                value={form.creator_name}
                onChange={e => setForm(f => ({ ...f, creator_name: e.target.value }))}
                placeholder="Imię i nazwisko twórcy"
              />
              <button
                className={styles.submitBtn}
                disabled={!canSubmit}
                onClick={addPot}
              >
                {saving ? 'Zapisywanie…' : 'Dodaj zbiórkę 💰'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
