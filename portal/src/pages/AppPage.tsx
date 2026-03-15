import { useParams, Navigate } from 'react-router-dom'
import { apps } from '../data/apps'
import { AppDetail } from '../components/AppDetail'

export function AppPage() {
  const { appId } = useParams<{ appId: string }>()
  const app = apps.find((a) => a.id === appId)

  if (!app) return <Navigate to="/" replace />

  return <AppDetail app={app} />
}
