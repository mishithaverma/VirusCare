import { useState } from 'react'
import { CalendarClock, RotateCcw, Save } from 'lucide-react'
import { CAP, FEVER } from '../logic'
import { useFacility } from '../state/FacilityContext'
import { useConfirm } from '../components/ConfirmDialog'
import { Button, Card, Field, Input, PageHeader } from '../components/ui'

export function SettingsPage() {
  const { db, today, updateSettings, advanceDay, reset } = useFacility()
  const confirm = useConfirm()
  const [facilityName, setFacilityName] = useState(db.settings.facilityName)

  return (
    <>
      <PageHeader title="Settings" description="Facility configuration and demonstration controls" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Facility">
          <div className="space-y-3">
            <Field label="Facility name">
              <Input value={facilityName} onChange={(e) => setFacilityName(e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Bed capacity" hint="Fixed for this facility">
                <Input value={CAP} disabled />
              </Field>
              <Field label="Fever threshold" hint="Clinical constant">
                <Input value={`${FEVER} C`} disabled />
              </Field>
            </div>
            <Button
              icon={<Save size={16} />}
              disabled={facilityName.trim() === db.settings.facilityName || !facilityName.trim()}
              onClick={() => updateSettings({ facilityName: facilityName.trim() })}
            >
              Save changes
            </Button>
          </div>
        </Card>

        <Card title="Demonstration controls" description="This build stores data locally in your browser.">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
              <div>
                <div className="font-medium text-navy">Simulated date</div>
                <div className="text-xs text-slate-500">Currently {today}</div>
              </div>
              <Button size="sm" variant="secondary" icon={<CalendarClock size={14} />} onClick={advanceDay}>
                Advance a day
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
              <div>
                <div className="font-medium text-navy">Reset data</div>
                <div className="text-xs text-slate-500">Restore the seeded demonstration dataset</div>
              </div>
              <Button
                size="sm"
                variant="danger"
                icon={<RotateCcw size={14} />}
                onClick={async () => {
                  if (
                    await confirm({
                      title: 'Reset demo data?',
                      message: 'This discards your current changes and restores the seeded dataset.',
                      confirmLabel: 'Reset',
                      danger: true,
                    })
                  )
                    reset()
                }}
              >
                Reset
              </Button>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-navy-50 px-3 py-3 text-xs text-navy-700">
            Data persistence is backed by a swappable repository layer. A production deployment would point the same
            interface at a real API without changing any screens.
          </div>
        </Card>
      </div>
    </>
  )
}
