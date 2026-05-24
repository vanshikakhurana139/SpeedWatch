import { useState as useState2 } from 'react'
import { useDashboardStore as useDS } from '../store/dashboardStore'

export default function VehiclePopup({ sendWsMessage }) {
    const { selectedVehicleId, vehiclePositions, violations, setSelectedVehicle } = useDS()
    const [tab, setTab2] = useState2('info')   // 'info' | 'voice'
    const [voiceText, setVoiceText] = useState2('')
    const [voiceSent, setVoiceSent] = useState2(false)
    const [listening, setListening] = useState2(false)

    if (!selectedVehicleId) return null
    const vehicle = vehiclePositions[selectedVehicleId]
    if (!vehicle) return null

    const vViolations = violations.filter((v) => v.vehicle_id === selectedVehicleId)
    const todayPenalty = vViolations.reduce((s, v) => s + (v.penalty_amount || 0), 0)
    const speed = Math.round(vehicle.speed || 0)

    const color = vehicle.status === 'violation' ? 'var(--red)'
        : vehicle.status === 'warning' ? 'var(--amber)' : 'var(--green)'
    const statusLabel = vehicle.status === 'violation' ? 'VIOLATION'
        : vehicle.status === 'warning' ? 'WARNING' : 'SAFE'

    const handleSendVoice = () => {
        if (!voiceText.trim()) return
        sendWsMessage?.({ type: 'voice_command', driver_id: vehicle.driverId, message: voiceText })
        setVoiceSent(true)
        setTimeout(() => { setVoiceSent(false); setVoiceText('') }, 3000)
    }

    const handleSpeak = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SR) { alert('Speech recognition requires Google Chrome browser.'); return }
        const recognition = new SR()
        recognition.lang = 'en-IN'
        recognition.continuous = false
        setListening(true)
        recognition.onresult = (e) => { setVoiceText(e.results[0][0].transcript); setListening(false) }
        recognition.onerror = () => setListening(false)
        recognition.onend = () => setListening(false)
        recognition.start()
    }

    return (
        <div style={VP.overlay} onClick={() => setSelectedVehicle(null)}>
            <div style={VP.popup} onClick={(e) => e.stopPropagation()} className="anim-fadein">
                {/* Header */}
                <div style={VP.header}>
                    <div style={VP.headerLeft}>
                        <div style={VP.speedCircle}>
                            <span style={{ ...VP.speedNum, color }}>{speed}</span>
                            <span style={VP.speedUnit}>km/h</span>
                        </div>
                        <div>
                            <div style={VP.vehicleId}>{selectedVehicleId}</div>
                            <span style={{ ...VP.statusBadge, background: `${color}22`, color, border: `1px solid ${color}55` }}>{statusLabel}</span>
                        </div>
                    </div>
                    <button style={VP.closeBtn} onClick={() => setSelectedVehicle(null)}>✕</button>
                </div>

                {/* Tabs */}
                <div style={VP.tabs}>
                    {['info', 'voice'].map((t) => (
                        <button
                            key={t}
                            style={{ ...VP.tabBtn, ...(tab === t ? VP.tabBtnActive : {}) }}
                            onClick={() => setTab2(t)}
                        >
                            {t === 'info' ? 'Driver Info' : '🎤 Voice Cmd'}
                        </button>
                    ))}
                </div>

                {tab === 'info' && (
                    <div style={VP.body}>
                        <DataRow label="Driver" value={vehicle.driverName} />
                        <DataRow label="Status" value={statusLabel} valueColor={color} />
                        <DataRow label="Violations (session)" value={vViolations.length} valueColor={vViolations.length > 0 ? 'var(--red)' : undefined} />
                        <DataRow label="Penalty (session)" value={`₹ ${todayPenalty.toLocaleString('en-IN')}`} valueColor={todayPenalty > 0 ? 'var(--red)' : undefined} />
                        {vehicle.tripId && <DataRow label="Trip ID" value={vehicle.tripId.substring(0, 8) + '…'} />}
                        <DataRow label="Last update" value={`${Math.round((Date.now() - vehicle.lastUpdate) / 1000)}s ago`} />
                    </div>
                )}

                {tab === 'voice' && (
                    <div style={VP.voiceBody}>
                        <div style={VP.voiceTo}>
                            To: <span style={{ color: 'var(--text-0)', fontFamily: 'var(--font-mono)' }}>{selectedVehicleId}</span> — {vehicle.driverName}
                        </div>
                        <textarea
                            style={VP.voiceTextarea}
                            value={voiceText}
                            onChange={(e) => setVoiceText(e.target.value)}
                            placeholder="Type or speak a message to the driver..."
                            rows={3}
                        />
                        <div style={VP.voiceBtns}>
                            <button
                                className="btn btn-amber"
                                onClick={handleSpeak}
                                style={{ flex: 1 }}
                            >
                                {listening ? '● RECORDING...' : '🎤 SPEAK'}
                            </button>
                            <button
                                className="btn btn-blue"
                                onClick={handleSendVoice}
                                disabled={!voiceText.trim()}
                                style={{ flex: 1.5, opacity: voiceText.trim() ? 1 : 0.4 }}
                            >
                                {voiceSent ? '✓ SENT' : 'SEND TO DRIVER'}
                            </button>
                        </div>
                        {voiceSent && (
                            <div style={VP.sentConfirm}>
                                Message sent — playing via TTS on driver device
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
        <div style={VP.dataRow}>
            <span style={VP.dataLabel}>{label}</span>
            <span style={{ ...VP.dataValue, ...(valueColor ? { color: valueColor } : {}) }}>{value}</span>
        </div>
    )
}

const VP = {
    overlay: {
        position: 'absolute',
        inset: 0,
        zIndex: 900,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        padding: '16px',
    },
    popup: {
        pointerEvents: 'all',
        background: 'var(--bg-2)',
        border: '1px solid var(--border-2)',
        borderRadius: '8px',
        width: '300px',
        boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
        overflow: 'hidden',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 16px',
        background: 'var(--bg-3)',
        borderBottom: '1px solid var(--border-1)',
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
    speedCircle: {
        width: '52px', height: '52px',
        background: 'var(--bg-1)',
        borderRadius: '50%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        border: '1px solid var(--border-2)',
        flexShrink: 0,
    },
    speedNum: { fontFamily: 'var(--font-mono)', fontSize: '16px', lineHeight: 1 },
    speedUnit: { fontSize: '8px', color: 'var(--text-3)', letterSpacing: '0.5px', marginTop: '1px' },
    vehicleId: { fontFamily: 'var(--font-mono)', fontSize: '16px', color: 'var(--text-0)', letterSpacing: '1px' },
    statusBadge: {
        display: 'inline-block',
        fontSize: '9px', fontWeight: 700, letterSpacing: '1px',
        padding: '2px 7px', borderRadius: '3px',
        fontFamily: 'var(--font-hmi)', textTransform: 'uppercase',
    },
    closeBtn: {
        background: 'transparent', border: 'none', color: 'var(--text-3)',
        fontSize: '14px', cursor: 'pointer', padding: '4px', lineHeight: 1,
    },
    tabs: {
        display: 'flex',
        borderBottom: '1px solid var(--border-1)',
    },
    tabBtn: {
        flex: 1, background: 'transparent', border: 'none',
        color: 'var(--text-3)', padding: '9px 8px',
        fontSize: '11px', fontWeight: 700,
        letterSpacing: '0.8px', cursor: 'pointer',
        fontFamily: 'var(--font-hmi)',
        borderBottom: '2px solid transparent',
        transition: 'all 0.15s',
    },
    tabBtnActive: { color: 'var(--blue)', borderBottom: '2px solid var(--blue)' },
    body: { padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' },
    dataRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--border-0)' },
    dataLabel: { fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.8px', textTransform: 'uppercase' },
    dataValue: { fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-1)' },
    voiceBody: { padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' },
    voiceTo: { fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-hmi)' },
    voiceTextarea: {
        background: 'var(--bg-1)',
        border: '1px solid var(--border-2)',
        borderRadius: '4px',
        color: 'var(--text-0)',
        padding: '10px',
        fontSize: '13px',
        fontFamily: 'var(--font-hmi)',
        resize: 'none',
        outline: 'none',
        width: '100%',
        lineHeight: 1.5,
    },
    voiceBtns: { display: 'flex', gap: '8px' },
    sentConfirm: {
        background: 'var(--green-dim)',
        border: '1px solid rgba(34,197,94,0.3)',
        borderRadius: '4px',
        padding: '8px 10px',
        fontSize: '11px',
        color: 'var(--green)',
        fontFamily: 'var(--font-hmi)',
    },
}