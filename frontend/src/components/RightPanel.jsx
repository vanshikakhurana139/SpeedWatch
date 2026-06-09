import React, { useState, useRef } from 'react'
import { useDashboardStore } from '../store/dashboardStore'
import { format } from 'date-fns'

export default function RightPanel() {
    const { violations, vehiclePositions, selectedVehicleId, setSelectedVehicle } = useDashboardStore()
    const [voiceText, setVoiceText] = useState('')
    const [listening, setListening] = useState(false)
    const [sent, setSent] = useState(false)

    const selectedVehicle = selectedVehicleId ? vehiclePositions[selectedVehicleId] : null
    const speed = Math.round(selectedVehicle?.speed || 0)
    const isViolation = selectedVehicle?.status === 'violation'
    const isWarning = selectedVehicle?.status === 'warning'

    const handleSpeak = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SR) { alert('Speech recognition requires Chrome'); return }
        const r = new SR()
        r.lang = 'en-IN'; r.continuous = false
        setListening(true)
        r.onresult = (e) => { setVoiceText(e.results[0][0].transcript); setListening(false) }
        r.onerror = () => setListening(false)
        r.onend = () => setListening(false)
        r.start()
    }

    const handleBroadcast = () => {
        if (!voiceText.trim()) return
        setSent(true)
        setTimeout(() => { setSent(false); setVoiceText('') }, 3000)
    }

    const timeSince = (ms) => {
        const s = Math.round((Date.now() - ms) / 1000)
        if (s < 60) return 'Just now'
        if (s < 3600) return `${Math.round(s / 60)}m ago`
        return `${Math.round(s / 3600)}h ago`
    }

    return (
        <aside style={S.aside}>
            {/* ── Vehicle Detail ── */}
            <div style={S.section}>
                <div style={S.sectionHeader}>
                    <span style={S.sectionTitle}>VEHICLE DETAIL</span>
                    {selectedVehicle && isViolation && (
                        <span className="badge-critical">CRITICAL</span>
                    )}
                    {selectedVehicle && isWarning && (
                        <span style={{ ...S.warningBadge }}>WARNING</span>
                    )}
                </div>

                {selectedVehicle ? (
                    <div style={S.vehicleCard}>
                        {/* Vehicle ID row */}
                        <div style={S.vehicleIdRow}>
                            <div style={S.truckIcon}>
                                <svg width="20" height="20" fill="none" stroke="#4A5568" strokeWidth="1.5" viewBox="0 0 24 24">
                                    <rect x="1" y="3" width="15" height="13" rx="1" />
                                    <path d="M16 8h4l3 5v3h-7V8z" />
                                    <circle cx="5.5" cy="18.5" r="2.5" />
                                    <circle cx="18.5" cy="18.5" r="2.5" />
                                </svg>
                            </div>
                            <div>
                                <div style={S.vehicleLabel}>Vehicle ID</div>
                                <div style={S.vehicleId}>{selectedVehicleId}</div>
                                <div style={S.vehicleZone}>
                                    {selectedVehicle.currentZone || 'Zone: Open Area'}
                                </div>
                            </div>
                            <button style={S.closeBtn} onClick={() => setSelectedVehicle(null)}>✕</button>
                        </div>

                        {/* Speed vs Limit */}
                        <div style={S.speedRow}>
                            <div style={S.speedBlock}>
                                <div style={S.speedLabel}>Speed</div>
                                <div style={{
                                    ...S.speedValue,
                                    color: isViolation ? '#CC0000' : isWarning ? '#F59E0B' : '#16A34A',
                                }}>
                                    {speed} km/h
                                </div>
                            </div>
                            <div style={S.speedBlock}>
                                <div style={S.speedLabel}>Limit</div>
                                <div style={{ ...S.speedValue, color: '#1A202C' }}>
                                    {selectedVehicle.speedLimit || 40} km/h
                                </div>
                            </div>
                        </div>

                        {/* Driver info */}
                        <div style={S.driverRow}>
                            <span style={S.driverLabel}>Driver:</span>
                            <span style={S.driverName}>{selectedVehicle.driverName || '—'}</span>
                        </div>

                        {/* Speak Warning */}
                        <div style={S.voiceSection}>
                            <div style={S.voiceHeader}>
                                <span style={S.voiceTitle}>Speak Warning</span>
                                <button
                                    style={{ ...S.micBtn, background: listening ? '#CC0000' : 'transparent' }}
                                    onClick={handleSpeak}
                                >
                                    <svg width="14" height="14" fill={listening ? 'white' : '#CC0000'} viewBox="0 0 24 24">
                                        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                                        <path d="M19 10v2a7 7 0 01-14 0v-2" stroke={listening ? 'white' : '#CC0000'} fill="none" strokeWidth="2" />
                                        <line x1="12" y1="19" x2="12" y2="23" stroke={listening ? 'white' : '#CC0000'} strokeWidth="2" />
                                        <line x1="8" y1="23" x2="16" y2="23" stroke={listening ? 'white' : '#CC0000'} strokeWidth="2" />
                                    </svg>
                                </button>
                            </div>
                            <textarea
                                style={S.voiceTA}
                                value={voiceText}
                                onChange={e => setVoiceText(e.target.value)}
                                placeholder="Type message or click mic to speak..."
                                rows={3}
                            />
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button style={S.broadcastBtn} onClick={handleBroadcast} disabled={!voiceText.trim()}>
                                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path d="M22 17H2a3 3 0 010-6h7l4-7 3 6h3a3 3 0 010 7z" />
                                    </svg>
                                    {sent ? 'SENT ✓' : 'BROADCAST'}
                                </button>
                                <button style={S.historyBtn} title="History">
                                    <svg width="14" height="14" fill="none" stroke="#718096" strokeWidth="1.8" viewBox="0 0 24 24">
                                        <polyline points="12 8 12 12 14 14" />
                                        <path d="M3.05 11A9 9 0 1 0 4 7.5" />
                                        <polyline points="3 3 3 8 8 8" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={S.emptyVehicle}>
                        <svg width="32" height="32" fill="none" stroke="#CBD5E0" strokeWidth="1.5" viewBox="0 0 24 24">
                            <rect x="1" y="3" width="15" height="13" rx="1" />
                            <path d="M16 8h4l3 5v3h-7V8z" />
                            <circle cx="5.5" cy="18.5" r="2.5" />
                            <circle cx="18.5" cy="18.5" r="2.5" />
                        </svg>
                        <div style={S.emptyText}>Click a vehicle on the map to view details</div>
                    </div>
                )}
            </div>

            <div style={S.divider} />

            {/* ── Live Violation Log ── */}
            <div style={S.section}>
                <div style={S.sectionHeader}>
                    <span style={S.sectionTitle}>LIVE VIOLATION LOG</span>
                    {violations.length > 0 && (
                        <span style={S.countBadge}>{violations.length}</span>
                    )}
                </div>

                <div style={S.violationList}>
                    {violations.length === 0 ? (
                        <div style={S.emptyViolations}>
                            <svg width="24" height="24" fill="none" stroke="#CBD5E0" strokeWidth="1.5" viewBox="0 0 24 24">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <div style={S.emptyText}>No violations recorded</div>
                        </div>
                    ) : (
                        violations.slice(0, 20).map((v, i) => (
                            <ViolationRow key={v._id || i} violation={v} timeSince={timeSince} isFirst={i === 0} />
                        ))
                    )}
                </div>

                {violations.length > 0 && (
                    <button style={S.viewAllBtn}>View All Enforcement Logs</button>
                )}
            </div>
        </aside>
    )
}

function ViolationRow({ violation, timeSince, isFirst }) {
    const speed = Math.round(violation.speed_recorded || 0)
    const limit = violation.zone_limit || 40
    const timeStr = violation.receivedAt ? timeSince(violation.receivedAt) : '—'
    const vehicleId = violation.vehicle_id || '—'

    return (
        <div style={{
            ...S.vRow,
            borderLeft: isFirst ? '3px solid #CC0000' : '3px solid #E2E8F0',
            background: isFirst ? 'rgba(204,0,0,0.03)' : 'transparent',
            animation: isFirst ? 'highlight-new 2.5s ease-out forwards' : 'none',
        }}>
            <div style={S.vTop}>
                <span style={{ ...S.vId, color: isFirst ? '#CC0000' : '#0D1B3E' }}>{vehicleId}</span>
                <span style={S.vTime}>{timeStr}</span>
            </div>
            <div style={S.vDesc}>
                Speed Violation: {speed}km/h in {violation.zone_name || 'Zone'}
            </div>
            {violation.action_taken && (
                <div style={S.vAction}>Action Taken: {violation.action_taken}</div>
            )}
            <div style={S.vMeta}>
                Limit: {limit} km/h
                {violation.penalty_amount > 0 && (
                    <span style={S.vPenalty}> · ₹{violation.penalty_amount}</span>
                )}
            </div>
        </div>
    )
}

const S = {
    aside: {
        width: 300,
        background: '#F8FAFC',
        borderLeft: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        flexShrink: 0,
    },
    section: {
        flexShrink: 0,
        padding: '14px',
    },
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 700,
        color: '#718096',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        fontFamily: 'Inter, sans-serif',
    },
    warningBadge: {
        background: '#F59E0B',
        color: 'white',
        fontSize: 10,
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: 3,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    vehicleCard: {
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 10,
        overflow: 'hidden',
    },
    vehicleIdRow: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '12px 12px 8px',
        borderBottom: '1px solid #F0F2F5',
    },
    truckIcon: {
        width: 38,
        height: 38,
        background: '#F7FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    vehicleLabel: { fontSize: 10, color: '#A0AEC0', fontWeight: 500, marginBottom: 2 },
    vehicleId: { fontSize: 17, fontWeight: 800, color: '#0D1B3E', fontFamily: 'Inter, sans-serif' },
    vehicleZone: { fontSize: 11, color: '#718096', marginTop: 1 },
    closeBtn: {
        marginLeft: 'auto',
        background: 'transparent',
        border: 'none',
        color: '#A0AEC0',
        fontSize: 14,
        cursor: 'pointer',
        padding: 4,
        lineHeight: 1,
    },
    speedRow: {
        display: 'flex',
        gap: 0,
        padding: '10px 12px',
        borderBottom: '1px solid #F0F2F5',
    },
    speedBlock: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
    },
    speedLabel: { fontSize: 10, color: '#A0AEC0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 },
    speedValue: { fontSize: 22, fontWeight: 800, fontFamily: 'Inter, sans-serif', lineHeight: 1 },
    driverRow: {
        display: 'flex',
        gap: 6,
        padding: '8px 12px',
        borderBottom: '1px solid #F0F2F5',
        alignItems: 'center',
    },
    driverLabel: { fontSize: 11, color: '#A0AEC0', fontWeight: 500 },
    driverName: { fontSize: 13, color: '#1A202C', fontWeight: 600 },
    voiceSection: {
        padding: '10px 12px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    },
    voiceHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    voiceTitle: { fontSize: 12, fontWeight: 600, color: '#4A5568' },
    micBtn: {
        width: 28,
        height: 28,
        borderRadius: '50%',
        border: '1.5px solid #CC0000',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s',
    },
    voiceTA: {
        width: '100%',
        padding: '9px 10px',
        fontSize: 13,
        fontFamily: 'Inter, sans-serif',
        border: '1.5px solid #E2E8F0',
        borderRadius: 6,
        color: '#1A202C',
        background: '#F7FAFC',
        outline: 'none',
        resize: 'none',
        lineHeight: 1.5,
    },
    broadcastBtn: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '9px 12px',
        background: '#0D1B3E',
        color: 'white',
        border: 'none',
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 700,
        fontFamily: 'Inter, sans-serif',
        cursor: 'pointer',
        letterSpacing: 0.5,
        transition: 'opacity 0.15s',
    },
    historyBtn: {
        width: 36,
        height: 36,
        background: '#F7FAFC',
        border: '1.5px solid #E2E8F0',
        borderRadius: 6,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    emptyVehicle: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '24px 16px',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 10,
    },
    emptyText: { fontSize: 12, color: '#A0AEC0', textAlign: 'center', lineHeight: 1.5 },
    divider: { height: 1, background: '#E2E8F0', flexShrink: 0 },
    countBadge: {
        background: '#CC0000',
        color: 'white',
        fontSize: 10,
        fontWeight: 700,
        padding: '2px 7px',
        borderRadius: 10,
    },
    violationList: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        overflowY: 'auto',
        maxHeight: 'calc(100vh - 560px)',
        minHeight: 80,
    },
    emptyViolations: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '20px 16px',
    },
    vRow: {
        padding: '10px 10px 8px 10px',
        borderRadius: 6,
        border: '1px solid #E2E8F0',
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
    },
    vTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    vId: { fontSize: 13, fontWeight: 700, fontFamily: 'Inter, sans-serif' },
    vTime: { fontSize: 11, color: '#A0AEC0' },
    vDesc: { fontSize: 12, color: '#4A5568', lineHeight: 1.4 },
    vAction: { fontSize: 11, color: '#CC0000', fontWeight: 500, textDecoration: 'underline', cursor: 'pointer' },
    vMeta: { fontSize: 11, color: '#A0AEC0' },
    vPenalty: { color: '#CC0000', fontWeight: 600 },
    viewAllBtn: {
        width: '100%',
        marginTop: 8,
        padding: '9px',
        background: 'transparent',
        border: '1.5px solid #E2E8F0',
        borderRadius: 6,
        color: '#0D1B3E',
        fontSize: 12,
        fontWeight: 600,
        fontFamily: 'Inter, sans-serif',
        cursor: 'pointer',
        transition: 'all 0.15s',
    },
}