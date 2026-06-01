import React, { useState } from 'react'
import { useDashboardStore } from '../store/dashboardStore'

export default function VehiclePopup({ sendWsMessage }) {
    const { selectedVehicleId, vehiclePositions, violations, setSelectedVehicle } = useDashboardStore()
    const [tab, setTab] = useState('info')
    const [voiceText, setVoiceText] = useState('')
    const [voiceSent, setVoiceSent] = useState(false)
    const [listening, setListening] = useState(false)

    if (!selectedVehicleId) return null
    const vehicle = vehiclePositions[selectedVehicleId]
    if (!vehicle) return null

    const vViolations = violations.filter((v) => v.vehicle_id === selectedVehicleId)
    const todayPenalty = vViolations.reduce((s, v) => s + (v.penalty_amount || 0), 0)
    const speed = Math.round(vehicle.speed || 0)

    const color = vehicle.status === 'violation' ? 'var(--red)'
        : vehicle.status === 'warning' ? 'var(--amber)'
            : 'var(--green)'
    const statusLabel = vehicle.status === 'violation' ? 'VIOLATION'
        : vehicle.status === 'warning' ? 'CAUTION'
            : 'SAFE'

    const handleSendVoice = () => {
        if (!voiceText.trim()) return
        sendWsMessage?.({ type: 'voice_command', driver_id: vehicle.driverId, message: voiceText })
        setVoiceSent(true)
        setTimeout(() => { setVoiceSent(false); setVoiceText('') }, 3000)
    }

    const handleSpeak = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SR) { alert('Speech recognition requires Google Chrome'); return }
        const recognition = new SR()
        recognition.lang = 'en-IN'; recognition.continuous = false
        setListening(true)
        recognition.onresult = (e) => { setVoiceText(e.results[0][0].transcript); setListening(false) }
        recognition.onerror = () => setListening(false)
        recognition.onend = () => setListening(false)
        recognition.start()
    }

    const timeSince = Math.round((Date.now() - (vehicle.lastUpdate || Date.now())) / 1000)

    return (
        <div style={VP.overlay} onClick={() => setSelectedVehicle(null)}>
            <div style={VP.popup} onClick={(e) => e.stopPropagation()} className="anim-fadein">

                {/* Header */}
                <div style={{ ...VP.header, borderTop: `3px solid ${color}` }}>
                    <div style={VP.headerLeft}>
                        <div style={{ ...VP.speedCircle, borderColor: `${color}55` }}>
                            <span style={{ ...VP.speedNum, color }}>{speed}</span>
                            <span style={VP.speedUnit}>km/h</span>
                        </div>
                        <div>
                            <div style={VP.vehicleId}>{selectedVehicleId}</div>
                            <span style={{
                                fontSize: '11px', fontWeight: 700, letterSpacing: '1px',
                                padding: '2px 9px', borderRadius: '3px',
                                background: `${color}1A`, color, border: `1px solid ${color}44`,
                                fontFamily: 'var(--font-hmi)',
                            }}>
                                ● {statusLabel}
                            </span>
                        </div>
                    </div>
                    <button style={VP.closeBtn} onClick={() => setSelectedVehicle(null)}>✕</button>
                </div>

                {/* Tabs */}
                <div style={VP.tabs}>
                    {[{ id: 'info', label: 'Driver Info' }, { id: 'voice', label: '🎤 Voice Cmd' }].map((t) => (
                        <button
                            key={t.id}
                            style={{ ...VP.tabBtn, ...(tab === t.id ? VP.tabBtnActive : {}) }}
                            onClick={() => setTab(t.id)}
                        >{t.label}</button>
                    ))}
                </div>

                {/* Info tab */}
                {tab === 'info' && (
                    <div style={VP.body}>
                        <DataRow label="Driver" value={vehicle.driverName || 'Unknown'} />
                        <DataRow label="Status" value={statusLabel} valueColor={color} />
                        <DataRow label="Violations" value={vViolations.length} valueColor={vViolations.length > 0 ? 'var(--red)' : undefined} />
                        <DataRow label="Penalty (session)" value={`₹ ${todayPenalty.toLocaleString('en-IN')}`} valueColor={todayPenalty > 0 ? 'var(--red)' : undefined} />
                        {vehicle.tripId && <DataRow label="Trip ID" value={vehicle.tripId.substring(0, 10) + '…'} />}
                        <DataRow label="Last update" value={`${timeSince}s ago`} />
                        <DataRow label="GPS" value={`${(vehicle.lat || 0).toFixed(4)}, ${(vehicle.lng || 0).toFixed(4)}`} />
                    </div>
                )}

                {/* Voice tab */}
                {tab === 'voice' && (
                    <div style={VP.voiceBody}>
                        <div style={VP.voiceTo}>
                            To: <strong style={{ color: 'var(--text-0)' }}>{vehicle.driverName || selectedVehicleId}</strong>
                        </div>
                        <textarea
                            style={VP.voiceTA}
                            value={voiceText}
                            onChange={(e) => setVoiceText(e.target.value)}
                            placeholder="Type or speak a message…"
                            rows={3}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-amber btn-full" style={{ flex: 1 }} onClick={handleSpeak}>
                                {listening ? '● REC…' : '🎤 SPEAK'}
                            </button>
                            <button
                                className={`btn btn-blue btn-full`}
                                style={{ flex: 1.5, opacity: voiceText.trim() ? 1 : 0.4 }}
                                onClick={handleSendVoice}
                                disabled={!voiceText.trim()}
                            >
                                {voiceSent ? '✓ SENT' : 'SEND'}
                            </button>
                        </div>
                        {voiceSent && (
                            <div style={{ background: 'var(--green-dim)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '4px', padding: '9px 12px', fontSize: '12px', color: 'var(--green)' }}>
                                Message sent — TTS playing on driver device
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

function DataRow({ label, value, valueColor }) {
    return (
        <div className="data-row">
            <span className="data-label">{label}</span>
            <span className="data-value" style={valueColor ? { color: valueColor } : {}}>{value}</span>
        </div>
    )
}

const VP = {
    overlay: {
        position: 'absolute', inset: 0, zIndex: 900,
        pointerEvents: 'none', display: 'flex',
        alignItems: 'flex-start', justifyContent: 'flex-end',
        padding: '14px',
    },
    popup: {
        pointerEvents: 'all',
        background: 'var(--bg-2)', border: '1px solid var(--border-2)',
        borderRadius: '10px', width: '310px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.7)', overflow: 'hidden',
    },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 16px', background: 'var(--bg-3)',
        borderBottom: '1px solid var(--border-1)',
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '14px' },
    speedCircle: {
        width: '56px', height: '56px', background: 'var(--bg-1)',
        borderRadius: '50%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        border: '2px solid', flexShrink: 0,
    },
    speedNum: { fontFamily: 'var(--font-mono)', fontSize: '18px', lineHeight: 1 },
    speedUnit: { fontSize: '9px', color: 'var(--text-3)', letterSpacing: '0.5px', marginTop: '1px' },
    vehicleId: { fontFamily: 'var(--font-mono)', fontSize: '17px', color: 'var(--text-0)', letterSpacing: '1px', marginBottom: '5px' },
    closeBtn: { background: 'transparent', border: 'none', color: 'var(--text-3)', fontSize: '15px', cursor: 'pointer', padding: '4px', lineHeight: 1, },
    tabs: { display: 'flex', borderBottom: '1px solid var(--border-1)' },
    tabBtn: { flex: 1, background: 'transparent', border: 'none', color: 'var(--text-3)', padding: '10px 8px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.8px', cursor: 'pointer', fontFamily: 'var(--font-hmi)', borderBottom: '2px solid transparent', transition: 'all 0.15s' },
    tabBtnActive: { color: 'var(--blue-bright)', borderBottom: '2px solid var(--blue)' },
    body: { padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '2px' },
    voiceBody: { padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' },
    voiceTo: { fontSize: '12px', color: 'var(--text-2)', fontFamily: 'var(--font-hmi)' },
    voiceTA: { background: 'var(--bg-1)', border: '1px solid var(--border-2)', borderRadius: '6px', color: 'var(--text-0)', padding: '10px', fontSize: '14px', fontFamily: 'var(--font-hmi)', resize: 'none', outline: 'none', width: '100%', lineHeight: 1.5, },
}