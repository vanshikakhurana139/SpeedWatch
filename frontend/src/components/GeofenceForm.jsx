import { useState } from 'react'
import { geofencesApi } from '../api/geofences'

export default function GeofenceForm({ coordinates, onSaved, onCancel }) {
    const [name, setName] = useState('')
    const [limit, setLimit] = useState('30')
    const [type, setType] = useState('main_road')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const ZONE_TYPES = [
        { value: 'main_road', label: 'Main Road', color: '#8A9099' },
        { value: 'coal_yard', label: 'Coal Yard', color: '#F59E0B' },
        { value: 'pedestrian', label: 'Pedestrian Zone', color: '#A855F7' },
        { value: 'workshop', label: 'Workshop', color: '#3B82F6' },
        { value: 'restricted', label: 'Restricted Area', color: '#EF4444' },
        { value: 'ash_pond', label: 'Ash Pond', color: '#06B6D4' },
        { value: 'gate', label: 'Gate / Entry', color: '#22C55E' },
    ]

    const SPEED_PRESETS = [10, 15, 20, 30, 40, 50]

    const handleSave = async () => {
        if (!name.trim()) { setError('Zone name is required'); return }
        const numLimit = Number(limit)
        if (!limit || isNaN(numLimit) || numLimit < 5 || numLimit > 80) {
            setError('Speed limit must be between 5 and 80 km/h'); return
        }
        setLoading(true); setError('')
        try {
            await geofencesApi.createGeofence({
                name: name.trim(),
                zone_type: type,
                speed_limit: numLimit,
                coordinates,
            })
            onSaved?.()
        } catch (e) {
            setError(e.response?.data?.detail || 'Failed to save zone. Is the backend running?')
            setLoading(false)
        }
    }

    const selectedTypeObj = ZONE_TYPES.find(t => t.value === type)

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ width: '400px' }}>

                {/* Title */}
                <div className="modal-title">
                    <span style={{ marginRight: '8px', fontSize: '14px' }}>⬡</span>
                    NEW SPEED ZONE
                </div>

                {/* Polygon preview pill */}
                <div style={{
                    background: 'var(--bg-3)', border: '1px solid var(--border-1)',
                    borderRadius: '6px', padding: '8px 12px',
                    fontSize: '12px', color: 'var(--text-3)',
                    fontFamily: 'var(--font-mono)', marginBottom: '20px',
                    display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                    <span style={{ color: 'var(--green)', fontSize: '14px' }}>✓</span>
                    Polygon drawn — {coordinates?.[0]?.length || 0} vertices
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Zone name */}
                    <div className="field-group">
                        <label className="field-label">Zone Name</label>
                        <input
                            className="field-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Pedestrian Gate 3, Coal Yard A"
                            autoFocus
                        />
                    </div>

                    {/* Zone type */}
                    <div className="field-group">
                        <label className="field-label">Zone Type</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {ZONE_TYPES.map((zt) => (
                                <button
                                    key={zt.value}
                                    onClick={() => setType(zt.value)}
                                    style={{
                                        padding: '5px 11px', borderRadius: '4px',
                                        border: `1px solid ${type === zt.value ? zt.color : 'var(--border-1)'}`,
                                        background: type === zt.value ? `${zt.color}1A` : 'var(--bg-3)',
                                        color: type === zt.value ? zt.color : 'var(--text-2)',
                                        fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                                        fontFamily: 'var(--font-hmi)', letterSpacing: '0.5px',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {zt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Speed limit */}
                    <div className="field-group">
                        <label className="field-label">Speed Limit (km/h)</label>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                            {SPEED_PRESETS.map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setLimit(String(p))}
                                    style={{
                                        padding: '5px 12px', borderRadius: '4px',
                                        border: `1px solid ${limit === String(p) ? 'var(--green)' : 'var(--border-1)'}`,
                                        background: limit === String(p) ? 'var(--green-dim)' : 'var(--bg-3)',
                                        color: limit === String(p) ? 'var(--green)' : 'var(--text-2)',
                                        fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                                        fontFamily: 'var(--font-mono)', transition: 'all 0.15s',
                                    }}
                                >
                                    {p}
                                </button>
                            ))}
                            <input
                                className="field-input"
                                type="number"
                                min="5" max="80"
                                value={limit}
                                onChange={(e) => setLimit(e.target.value)}
                                style={{ width: '80px', textAlign: 'center' }}
                                placeholder="Custom"
                            />
                        </div>
                    </div>

                    {/* Summary preview */}
                    <div style={{
                        background: 'var(--bg-3)', borderRadius: '6px', padding: '10px 14px',
                        border: `1px solid ${selectedTypeObj?.color || 'var(--border-1)'}33`,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-1)' }}>
                            {name || 'Unnamed zone'} · {type.replace('_', ' ')}
                        </span>
                        <span style={{
                            fontFamily: 'var(--font-mono)', fontSize: '16px',
                            color: selectedTypeObj?.color || 'var(--text-0)', fontWeight: 700,
                        }}>
                            {limit} km/h
                        </span>
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{
                            background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.35)',
                            borderRadius: '6px', padding: '9px 12px',
                            color: 'var(--red)', fontSize: '13px',
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                        <button className="btn btn-full" style={{ flex: 1 }} onClick={onCancel} disabled={loading}>
                            Cancel
                        </button>
                        <button className="btn btn-blue btn-full" style={{ flex: 2 }} onClick={handleSave} disabled={loading}>
                            {loading ? 'Saving…' : 'Save Zone'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}