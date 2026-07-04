'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { supabase, type Gallery, type GalleryPhoto } from '@/lib/supabase'
import { useIsAdmin, useUserName } from '@/lib/auth'
import styles from './GalleryGrid.module.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export default function GalleryGrid() {
  const isAdmin = useIsAdmin()
  const userName = useUserName()
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [covers, setCovers] = useState<Record<string, { url: string; count: number }>>({})
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)

  const fetchAll = useCallback(async () => {
    const { data: gData } = await supabase
      .from('galleries')
      .select('*')
      .order('created_at', { ascending: false })
    if (gData) setGalleries(gData as Gallery[])

    const { data: pData } = await supabase
      .from('gallery_photos')
      .select('*')
      .order('created_at', { ascending: false })
    if (pData) {
      const map: Record<string, { url: string; count: number }> = {}
      for (const photo of pData as GalleryPhoto[]) {
        if (!map[photo.gallery_id]) {
          map[photo.gallery_id] = { url: photo.image_url, count: 1 }
        } else {
          map[photo.gallery_id].count += 1
        }
      }
      setCovers(map)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
    const channel = supabase
      .channel('galleries-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'galleries' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery_photos' }, fetchAll)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchAll])

  useGSAP(() => {
    if (loading) return
    const cards = gridRef.current?.querySelectorAll(`.${styles.card}`)
    if (!cards || !cards.length) return
    gsap.fromTo(cards,
      { opacity: 0, yPercent: 8, clipPath: 'inset(0 0 100% 0)' },
      {
        opacity: 1, yPercent: 0, clipPath: 'inset(0 0 0% 0)',
        duration: 1.2, ease: 'power4.out', stagger: 0.12, force3D: true,
      }
    )
  }, { dependencies: [loading, galleries.length], scope: gridRef })

  async function createGallery() {
    if (!newName.trim()) return
    setSaving(true)
    await supabase.from('galleries').insert({
      name: newName.trim(),
      created_by: userName || null,
    })
    setNewName('')
    setSaving(false)
  }

  async function deleteGallery(id: string) {
    await supabase.from('galleries').delete().eq('id', id)
  }

  return (
    <div className={styles.column}>
      <div className={styles.header}>
        <Link href="/" className={styles.backBtn}>←</Link>
        <span className={styles.headerIcon}>📷</span>
        <div className={styles.headerTitle}>Galerie</div>
      </div>

      <div className={styles.body}>
        <div className={styles.addForm}>
          <input
            className={styles.input}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Nazwa nowej galerii, np. Wakacje 2026"
            onKeyDown={e => { if (e.key === 'Enter') createGallery() }}
          />
          <button
            className={styles.addBtn}
            disabled={!newName.trim() || saving}
            onClick={createGallery}
          >
            + Nowa galeria
          </button>
        </div>

        {loading ? (
          <div className={styles.loader}>📷 Ładowanie…</div>
        ) : galleries.length === 0 ? (
          <div className={styles.empty}>Brak galerii — utwórz pierwszą! 🌿</div>
        ) : (
          <div className={styles.grid} ref={gridRef}>
            {galleries.map(gallery => {
              const cover = covers[gallery.id]
              return (
                <Link key={gallery.id} href={`/galeria/${gallery.id}`} className={styles.card}>
                  <div className={styles.thumbWrap}>
                    {cover ? (
                      <img className={styles.thumb} src={cover.url} alt={gallery.name} />
                    ) : (
                      <div className={styles.thumbEmpty}>📷</div>
                    )}
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.cardName}>{gallery.name}</div>
                    <div className={styles.cardMeta}>
                      {cover?.count ?? 0} {cover?.count === 1 ? 'zdjęcie' : 'zdjęć'}
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      className={styles.deleteBtn}
                      onClick={e => { e.preventDefault(); e.stopPropagation(); deleteGallery(gallery.id) }}
                    >
                      ×
                    </button>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
