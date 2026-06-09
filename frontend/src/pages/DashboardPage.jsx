import React, { useState } from 'react'
import TopBar from '../components/TopBar'
import LeftSidebar from '../components/LeftSidebar'
import LiveMap from '../components/LiveMap'
import RightPanel from '../components/RightPanel'
import VehiclePopup from '../components/VehiclePopup'
import SosPanel from '../components/SosPanel'
import SecondHitAlert from '../components/SecondHitAlert'
import GeofenceForm from '../components/GeofenceForm'
import ReportsPage from './ReportsPage'
import RiskScoresPage from './RiskScoresPage'
import ViolationsPage from './ViolationsPage'
import GeofencingPage from './GeofencingPage'
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
            {/* Global Left Sidebar navigation */}
            <LeftSidebar />

            {/* Main content wrapper on the right */}
            <div style={S.mainContent}>
                {/* TopBar is always visible */}
                <TopBar />

                <div style={S.pageContent}>
                    {/* Content area switches based on activePage */}
                    {activePage === 'dashboard' && (
                        <div style={S.mainArea}>
                            {/* SOS floats above the map inside the map area */}
                            <div style={S.mapWrapper}>
                                <SosPanel />
                                <SecondHitAlert />
                                <LiveMap onDrawGeofence={handleGeofenceDrawn} />
                                {selectedVehicleId && (
                                    <VehiclePopup sendWsMessage={sendMessage} />
                                )}
                            </div>
                            <RightPanel />
                        </div>
                    )}

                    {activePage === 'violations' && (
                        <div style={S.pageArea}>
                            <ViolationsPage />
                        </div>
                    )}

                    {activePage === 'risk_scores' && (
                        <div style={S.pageArea}>
                            <RiskScoresPage />
                        </div>
                    )}

                    {activePage === 'geofencing' && (
                        <div style={S.pageArea}>
                            <GeofencingPage onDrawGeofence={handleGeofenceDrawn} />
                        </div>
                    )}

                    {activePage === 'reports' && (
                        <div style={S.pageArea}>
                            <ReportsPage />
                        </div>
                    )}
                </div>
            </div>

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

const S = {
    root: {
        height: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden',
        background: '#F0F2F5',
    },
    mainContent: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        minWidth: 0,
    },
    pageContent: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0,
    },
    // Live map view — map | right panel
    mainArea: {
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden',
        minHeight: 0,  // critical — without this, flex children don't shrink in Firefox
    },
    // The map wrapper must fill all remaining space
    mapWrapper: {
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        minWidth: 0,
        minHeight: 0,
        height: '100%',
    },
    // Full-width page container
    pageArea: {
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: '#F0F2F5',
    },
}