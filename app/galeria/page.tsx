import AccessGate from '@/components/AccessGate'
import GalleryGrid from '@/components/GalleryGrid'

export const dynamic = 'force-dynamic'

export default function GaleriaPage() {
  return (
    <AccessGate>
      <GalleryGrid />
    </AccessGate>
  )
}
