import { Link } from 'react-router-dom'
import { Button } from '../components/ui'

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-5xl font-bold text-navy-200">404</div>
      <h1 className="mt-2 text-lg font-semibold text-navy">Page not found</h1>
      <p className="mt-1 text-sm text-slate-500">The page you are looking for does not exist.</p>
      <Link to="/dashboard" className="mt-5">
        <Button>Back to dashboard</Button>
      </Link>
    </div>
  )
}
