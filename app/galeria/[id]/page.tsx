import AccessGate from '@/components/AccessGate'
import GalleryDetail from '@/components/GalleryDetail'

export const dynamic = 'force-dynamic'

export default async function GaleriaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <AccessGate>
      <GalleryDetail galleryId={id} />
    </AccessGate>
  )
}
