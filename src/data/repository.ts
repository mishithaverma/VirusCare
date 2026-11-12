import { DB, migrate, seed } from '../logic'

/**
 * Data access is written against this interface rather than against localStorage
 * directly. Today it is backed by the browser; swapping in a REST/Supabase
 * adapter later would not require touching any UI or domain code.
 */
export interface FacilityRepository {
  load(): DB
  save(db: DB): void
  reset(): DB
  subscribe(listener: (db: DB) => void): () => void
}

const KEY = 'viruscare-db'

export class LocalStorageRepository implements FacilityRepository {
  private listeners = new Set<(db: DB) => void>()

  constructor() {
    // Keep multiple tabs of the same browser in sync.
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === KEY && e.newValue) {
          try {
            this.emit(migrate(JSON.parse(e.newValue)))
          } catch {
            /* ignore malformed cross-tab payloads */
          }
        }
      })
    }
  }

  load(): DB {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) return migrate(JSON.parse(raw))
    } catch {
      /* fall through to a fresh seed */
    }
    const fresh = seed()
    this.save(fresh)
    return fresh
  }

  save(db: DB): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(db))
    } catch {
      /* storage can be unavailable (private mode / quota) */
    }
    this.emit(db)
  }

  reset(): DB {
    const fresh = seed()
    this.save(fresh)
    return fresh
  }

  subscribe(listener: (db: DB) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(db: DB) {
    this.listeners.forEach((l) => l(db))
  }
}

export const repository: FacilityRepository = new LocalStorageRepository()
