'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { supabase, GALLERY_BUCKET, type Gallery, type GalleryPhoto } from '@/lib/supabase'
import { useIsAdmin, useUserName } from '@/lib/auth'
import styles from './GalleryDetail.module.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

async function compressImage(file: File, maxDim = 1600, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, width, height)
  return new Promise(resolve => canvas.toBlob(blob => resolve(blob!), 'image/jpeg', quality))
}

export default function GalleryDetail({ galleryId }: { galleryId: string }) {
  const router = useRouter()
  const isAdmin = useIsAdmin()
  const userName = useUserName()
  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [photos, setPhotos] = useState<GalleryPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null)
  const [selected, setSelected] = useState<GalleryPhoto | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const fetchGallery = useCallback(async () => {
    const { data } = await supabase.from('galleries').select('*').eq('id', galleryId).maybeSingle()
    setGallery(data as Gallery | null)
  }, [galleryId])

  const fetchPhotos = useCallback(async () => {
    const { data } = await supabase
      .from('gallery_photos')
      .select('*')
      .eq('gallery_id', galleryId)
      .order('created_at', { ascending: false })
    if (data) setPhotos(data as GalleryPhoto[])
    setLoading(false)
  }, [galleryId])

  useEffect(() => {
    fetchGallery()
    fetchPhotos()
    const channel = supabase
      .channel(`gallery-${galleryId}-rt`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'gallery_photos', filter: `gallery_id=eq.${galleryId}`,
      }, fetchPhotos)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchGallery, fetchPhotos, galleryId])

  useGSAP(() => {
    if (loading) return
    const tiles = gridRef.current?.querySelectorAll(`.${styles.tile}`)
    if (!tiles || !tiles.length) return
    gsap.fromTo(tiles,
      { opacity: 0, yPercent: 6, clipPath: 'inset(0 0 100% 0)' },
      {
        opacity: 1, yPercent: 0, clipPath: 'inset(0 0 0% 0)',
        duration: 1.4, ease: 'expo.out', stagger: 0.06, force3D: true,
      }
    )
  }, { dependencies: [loading, photos.length], scope: gridRef })

  useGSAP(() => {
    if (!selected) return
    gsap.fromTo(`.${styles.lightbox}`, { opacity: 0 }, { opacity: 1, duration: 0.9, ease: 'power3.inOut' })
    gsap.fromTo(`.${styles.lightboxImg}`,
      { scale: 0.92, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.9, ease: 'power3.inOut' }
    )
  }, { dependencies: [selected] })

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || !fileList.length) return
    const files = Array.from(fileList)
    setUploading(true)
    setUploadProgress({ done: 0, total: files.length })
    for (const file of files) {
      try {
        const blob = await compressImage(file)
        const path = `${galleryId}/${crypto.randomUUID()}.jpg`
        const { error: uploadError } = await supabase.storage.from(GALLERY_BUCKET).upload(path, blob, {
          contentType: 'image/jpeg',
        })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(path)
        await supabase.from('gallery_photos').insert({
          gallery_id: galleryId,
          storage_path: path,
          image_url: urlData.publicUrl,
          uploaded_by: userName || null,
        })
      } catch (err) {
        console.error('Upload failed', err)
      }
      setUploadProgress(prev => prev ? { done: prev.done + 1, total: prev.total } : null)
    }
    setUploading(false)
    setUploadProgress(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function deletePhoto(photo: GalleryPhoto) {
    await supabase.storage.from(GALLERY_BUCKET).remove([photo.storage_path])
    await supabase.from('gallery_photos').delete().eq('id', photo.id)
    setSelected(null)
  }

  async function deleteGallery() {
    await supabase.from('galleries').delete().eq('id', galleryId)
    router.push('/galeria')
  }

  return (
    <div className={styles.column}>
      <div className={styles.header}>
        <Link href="/galeria" className={styles.backBtn}>←</Link>
        <div className={styles.headerTitle}>{gallery?.name ?? 'Galeria'}</div>
        {isAdmin && (
          <button className={styles.deleteGalleryBtn} onClick={deleteGallery}>Usuń galerię</button>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.uploadBox}>
          <input
            ref={fileInputRef}
            className={styles.fileInput}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            onChange={e => handleFiles(e.target.files)}
          />
          <button
            className={styles.uploadBtn}
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading
              ? `Wysyłanie ${uploadProgress?.done ?? 0}/${uploadProgress?.total ?? 0}…`
              : '+ Dodaj zdjęcia'}
          </button>
        </div>

        {loading ? (
          <div className={styles.loader}>📷 Ładowanie…</div>
        ) : photos.length === 0 ? (
          <div className={styles.empty}>Brak zdjęć — dodaj pierwsze! 🌿</div>
        ) : (
          <div className={styles.grid} ref={gridRef}>
            {photos.map(photo => (
              <div key={photo.id} className={styles.tile} onClick={() => setSelected(photo)}>
                <img className={styles.tileImg} src={photo.image_url} alt="" loading="lazy" />
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className={styles.lightbox} onClick={() => setSelected(null)}>
          <img
            className={styles.lightboxImg}
            src={selected.image_url}
            alt=""
            onClick={e => e.stopPropagation()}
          />
          {isAdmin && (
            <button
              className={styles.lightboxDelete}
              onClick={e => { e.stopPropagation(); deletePhoto(selected) }}
            >
              Usuń zdjęcie
            </button>
          )}
          <button className={styles.lightboxClose} onClick={() => setSelected(null)}>×</button>
        </div>
      )}
    </div>
  )
}
