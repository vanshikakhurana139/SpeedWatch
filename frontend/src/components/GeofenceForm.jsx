import { useState as useState3 } from 'react'
import { geofencesApi } from '../api/geofences'

export default function GeofenceForm({ coordinates, onSaved, onCancel }) {
    const [name, setName] = useState3('')
    const [limit, setLimit] = useState3('30')
    const [type, setType] = useState3('main_road')
    const [loading, setLoading] = useState3(false)
    const [error, setError] = useState3('')

    const handleSave = async () => {
        if (!name.trim()) { setError('Zone name is required'); return }
        if (!limit || isNaN(Number(limit)) || Number(limit) < 5) { setError('Enter a valid speed limit (min 5)'); return }
        setLoading(true); setError('')
        try {
            await geofencesApi.createGeofence({ name: name.trim(), zone_type: type, speed_limit: Number(limit), coordinates })
            onSaved?.()
        } catch (e) {
            setError(e.response?.data?.detail || 'Failed to save zone. Make sure backend is running.')
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="modal-title">New Speed Zone</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="field-group">
                        <label className="field-label">Zone name</label>
                        <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pedestrian Gate 3" />
                    </div>
                    <div className="field-group">
                        <label className="field-label">Zone type</label>
                        <select className="field-input" value={type} onChange={(e) => setType(e.target.value)}>
                            <option value="main_road">Main Road</option>
                            <option value="coal_yard">Coal Yard</option>
                            <option value="pedestrian">Pedestrian Zone</option>
                            <option value="workshop">Workshop</option>
                            <option value="restricted">Restricted</option>
                        </select>
                    </div>
                    <div className="field-group">
                        <label className="field-label">Speed limit (km/h)</label>
                        <input className="field-input" type="number" min="5" max="80" value={limit} onChange={(e) => setLimit(e.target.value)} />
                    </div>
                    {error && (
                        <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '4px', padding: '8px 10px', color: 'var(--red)', fontSize: '12px' }}>
                            {error}
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <button className="btn btn-full" style={{ flex: 1 }} onClick={onCancel} disabled={loading}>Cancel</button>
                        <button className="btn btn-blue btn-full" style={{ flex: 1.5 }} onClick={handleSave} disabled={loading}>
                            {loading ? 'Saving...' : 'Save Zone'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}