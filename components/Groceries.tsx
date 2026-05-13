'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, type GroceryItem } from '@/lib/supabase'
import { useUserName } from '@/lib/auth'
import styles from './Groceries.module.css'

export default function Groceries() {
  const userName = useUserName()
  const [items, setItems] = useState<GroceryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newItem, setNewItem] = useState('')
  const [tickingId, setTickingId] = useState<string | null>(null)
  const [tickNote, setTickNote] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchItems = useCallback(async () => {
    const { data } = await supabase
      .from('groceries')
      .select('*')
      .order('created_at', { ascending: true })
    if (data) setItems(data as GroceryItem[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchItems()
    const channel = supabase
      .channel('groceries-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groceries' }, fetchItems)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchItems])

  async function addItem() {
    if (!newItem.trim()) return
    setSaving(true)
    await supabase.from('groceries').insert({
      item: newItem.trim(),
      added_by: userName || null,
    })
    setNewItem('')
    setSaving(false)
  }

  async function tickItem(id: string) {
    setSaving(true)
    await supabase.from('groceries').update({
      is_bought: true,
      bought_by: userName,
      bought_note: tickNote.trim() || null,
      bought_at: new Date().toISOString(),
    }).eq('id', id)
    setTickingId(null)
    setTickNote('')
    setSaving(false)
  }

  async function deleteItem(id: string) {
    await supabase.from('groceries').delete().eq('id', id)
  }

  const active = items.filter(i => !i.is_bought)
  const bought = items.filter(i => i.is_bought)

  return (
    <div className={styles.column}>
      <div className={styles.header}>
        <span className={styles.headerIcon}>🛒</span>
        <div className={styles.headerTitle}>Zakupy</div>
      </div>

      <div className={styles.body}>
        <div className={styles.addForm}>
          <input
            className={styles.input}
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            placeholder="Co potrzeba? np. węgiel do grilla…"
            onKeyDown={e => { if (e.key === 'Enter') addItem() }}
          />
          <button
            className={styles.addBtn}
            disabled={!newItem.trim() || saving}
            onClick={addItem}
          >
            + Dodaj
          </button>
        </div>

        {loading ? (
          <div className={styles.loader}>🛒 Ładowanie…</div>
        ) : (
          <>
            {active.length === 0 && (
              <div className={styles.empty}>Brak potrzebnych zakupów 🎉</div>
            )}

            <div className={styles.list}>
              {active.map(item => (
                <div key={item.id} className={styles.itemCard}>
                  <div className={styles.itemRow}>
                    <button
                      className={styles.tickBtn}
                      onClick={() => {
                        setTickingId(tickingId === item.id ? null : item.id)
                        setTickForm({ bought_by: '', bought_note: '' })
                      }}
                      title="Oznacz jako kupione"
                    >
                      ✓
                    </button>
                    <div className={styles.itemBody}>
                      <div className={styles.itemName}>{item.item}</div>
                      {item.added_by && (
                        <div className={styles.itemMeta}>dodane przez {item.added_by}</div>
                      )}
                    </div>
                    <button className={styles.removeBtn} onClick={() => deleteItem(item.id)}>×</button>
                  </div>

                  {tickingId === item.id && (
                    <div className={styles.tickForm}>
                      <input
                        className={styles.input}
                        value={tickNote}
                        onChange={e => setTickNote(e.target.value)}
                        placeholder="Komentarz (opcjonalnie)"
                        autoFocus
                      />
                      <div className={styles.tickActions}>
                        <button
                          className={styles.confirmBtn}
                          disabled={saving}
                          onClick={() => tickItem(item.id)}
                        >
                          Potwierdź
                        </button>
                        <button className={styles.cancelBtn} onClick={() => setTickingId(null)}>
                          Anuluj
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {bought.length > 0 && (
              <div className={styles.boughtSection}>
                <div className={styles.boughtTitle}>Kupione</div>
                {bought.map(item => (
                  <div key={item.id} className={styles.boughtCard}>
                    <div className={styles.boughtBody}>
                      <div className={styles.boughtName}>{item.item}</div>
                      <div className={styles.boughtMeta}>
                        ✓ {item.bought_by}
                        {item.bought_note ? ` — „${item.bought_note}"` : ''}
                      </div>
                    </div>
                    <button className={styles.removeBtn} onClick={() => deleteItem(item.id)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
