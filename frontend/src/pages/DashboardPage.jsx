import React, { useState } from 'react'
// FIX: was importing 'Topbar' (lowercase b) — file is 'TopBar.jsx' (capital B)
import TopBar from '../components/TopBar'
import LeftSidebar from '../components/LeftSidebar'
import LiveMap from '../components/LiveMap'
import RightPanel from '../components/RightPanel'
import VehiclePopup from '../components/VehiclePopup'
import SosPanel from '../components/SosPanel'
import GeofenceForm from '../components/GeofenceForm'
import ReportsPage from './ReportsPage'
import { useWebSocket } from '../hooks/useWebSocket'
import { useDashboardStore } from '../store/dashboardStore'

export default function DashboardPage() {
    const { sendMessage } = useWebSocket()
    const { selectedVehicleId, activePage } = useDashboardStore()
    const [pendingGeofenceCoords, setPendingGeofenceCoords] = useState(null)

    const handleGeofenceDrawn = (coords) => setPendingGeofenceCoords(coords)
    const handleGeofenceSaved = () => {
        setPendingGeofenceCoords(null)
        window.location.reload()
    }

    return (
        <div style={S.root}>
            {/* TopBar is always visible */}
            <TopBar />

            {/* Content area switches based on activePage */}
            {activePage === 'dashboard' && (
                <div style={S.mainArea}>
                    {/* SOS floats above the map inside the map area */}
                    <div style={S.mapWrapper}>
                        <SosPanel />
                        <LiveMap onDrawGeofence={handleGeofenceDrawn} />
                        {selectedVehicleId && (
                            <VehiclePopup sendWsMessage={sendMessage} />
                        )}
                    </div>
                    <LeftSidebar />
                    <RightPanel />
                </div>
            )}

            {activePage === 'reports' && (
                <div style={S.pageArea}>
                    <ReportsPage />
                </div>
            )}

            {activePage === 'leaderboard' && (
                <div style={S.pageArea}>
                    <LeaderboardPlaceholder />
                </div>
            )}

            {/* Geofence save modal — floats over everything */}
            {pendingGeofenceCoords && (
                <GeofenceForm
                    coordinates={pendingGeofenceCoords}
                    onSaved={handleGeofenceSaved}
                    onCancel={() => setPendingGeofenceCoords(null)}
                />
            )}
        </div>
    )
}

// Simple placeholder for leaderboard — Phase 4 will fill this in
function LeaderboardPlaceholder() {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            height: '100%', gap: '12px',
        }}>
            <div style={{ fontSize: '40px', opacity: 0.15 }}>🏆</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-3)', letterSpacing: '2px' }}>
                LEADERBOARD — PHASE 4
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-3)', textAlign: 'center', maxWidth: '300px', lineHeight: 1.6 }}>
                Driver performance rankings and safety scores will appear here after Phase 4 implementation.
            </div>
        </div>
    )
}

const S = {
    root: {
        height: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--bg-0)',
    },
    // Live map view — sidebar | map | right panel
    mainArea: {
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden',
        minHeight: 0,  // critical — without this, flex children don't shrink in Firefox
    },
    // The map wrapper must fill all remaining space after the sidebars
    mapWrapper: {
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        minWidth: 0,
        minHeight: 0,
        // FIX: explicit height so Leaflet can measure it
        height: '100%',
    },
    // Full-width page for reports / leaderboard
    pageArea: {
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
    },
}