import Calendar from '@/components/Calendar'
import Groceries from '@/components/Groceries'
import Fundraising from '@/components/Fundraising'
import AccessGate from '@/components/AccessGate'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <AccessGate>
      <div className={styles.layout}>
        <div className={styles.col}><Calendar /></div>
        <div className={styles.col}><Groceries /></div>
        <div className={styles.col}><Fundraising /></div>
      </div>
    </AccessGate>
  )
}
