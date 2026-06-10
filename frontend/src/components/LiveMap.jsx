import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import { useDashboardStore } from '../store/dashboardStore'
import { geofencesApi } from '../api/geofences'

// Fix Leaflet icon paths in Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const PLANT_CENTER = [23.343, 85.319]
const PLANT_ZOOM = 15

export default function LiveMap({ onDrawGeofence, drawingActive }) {
    return (
        <div style={{ position: 'absolute', inset: 0 }}>
            <style>{`
                .geofence-polygon {
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .leaflet-popup-content-wrapper {
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    background: #FFFFFF;
                }
                .leaflet-popup-content {
                    margin: 0;
                    padding: 0;
                }
            `}</style>
            <MapContainer
                center={PLANT_CENTER}
                zoom={PLANT_ZOOM}
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                    maxZoom={20}
                />
                {/* Custom zoom position */}
                // Removed custom ZoomControl – default zoom control enabled
                <VehicleMarkerLayer />
                <GeofenceLayer />
                <DrawControl onGeofenceDrawn={onDrawGeofence} drawingActive={drawingActive} />
            </MapContainer>
            <MapOverlay />
        </div>
    )
}

// ── Custom positioned zoom control ───────────────────────────────
function ZoomControl() {
    const map = useMap()
    useEffect(() => {
        L.control.zoom({ position: 'topleft' }).addTo(map)
    }, [map])
    return null
}

// ── Compass / attribution overlay ────────────────────────────────
function MapOverlay() {
    return (
        <div style={{
            position: 'absolute', bottom: '16px', left: '16px', zIndex: 800,
            display: 'flex', flexDirection: 'column', gap: '6px',
            pointerEvents: 'none',
        }}>
            <div style={{
                background: 'rgba(16,19,24,0.85)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px', padding: '5px 9px',
                fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-3)',
                backdropFilter: 'blur(4px)',
            }}>
                SAIL RDCIS · Ranchi · 23.343°N 85.319°E
            </div>
        </div>
    )
}

// ── Vehicle Markers ───────────────────────────────────────────────
function VehicleMarkerLayer() {
    const map = useMap()
    const markersRef = useRef({})
    const { vehiclePositions, setSelectedVehicle, selectedVehicleId } = useDashboardStore()

    useEffect(() => {
        const currentIds = new Set(Object.keys(vehiclePositions))

        // Remove stale markers
        Object.keys(markersRef.current).forEach((id) => {
            if (!currentIds.has(id)) {
                markersRef.current[id].remove()
                delete markersRef.current[id]
            }
        })

        // Add or update markers
        Object.entries(vehiclePositions).forEach(([vehicleId, vehicle]) => {
            const { lat, lng, speed, status } = vehicle
            const color = status === 'violation' ? '#EF4444' : status === 'warning' ? '#F59E0B' : '#22C55E'
            const isViolation = status === 'violation'
            const isWarning = status === 'warning'
            const dotSize = isViolation ? 18 : 14
            const label = vehicleId.length > 10 ? vehicleId.slice(0, 10) + '…' : vehicleId

            const pulseStyle = isViolation
                ? `box-shadow: 0 0 0 3px rgba(239,68,68,0.5);`
                : isWarning
                    ? `box-shadow: 0 0 0 2px rgba(245,158,11,0.4);`
                    : ''

            const iconHtml = `
        <div style="pointer-events:none;width:${dotSize}px;height:${dotSize}px;background:${color};border:2.5px solid rgba(255,255,255,0.9);border-radius:50%;${pulseStyle}"></div>
      `

            const icon = L.divIcon({
                html: iconHtml, className: '',
                iconSize: [dotSize + 32, dotSize + 36],
                iconAnchor: [(dotSize + 32) / 2, (dotSize + 36) / 2],
            })

            if (markersRef.current[vehicleId]) {
                markersRef.current[vehicleId].setLatLng([lat, lng]).setIcon(icon)
            } else {
                const marker = L.marker([lat, lng], { icon, zIndexOffset: isViolation ? 1000 : 0 })
                marker.on('click', () => setSelectedVehicle(vehicleId))
                marker.addTo(map)
                markersRef.current[vehicleId] = marker
            }
        })
    }, [vehiclePositions, map, setSelectedVehicle])

    useEffect(() => {
        if (selectedVehicleId && vehiclePositions[selectedVehicleId]) {
            const { lat, lng } = vehiclePositions[selectedVehicleId]
            map.panTo([lat, lng], { animate: true, duration: 0.6 })
        }
    }, [selectedVehicleId, vehiclePositions, map])

    return null
}

// ── Geofence Layer with Delete support ──────────────────────────
function GeofenceLayer() {
    const map = useMap()
    const layersRef = useRef([])      // { layer, id } pairs so we can delete by id
    const featureGroupRef = useRef(null)
    const popupRef = useRef(null)

    useEffect(() => {
        // Create a FeatureGroup to hold geofences so editing/deleting works
        const fg = new L.FeatureGroup()
        map.addLayer(fg)
        featureGroupRef.current = fg

        geofencesApi.getGeofences()
            .then((zones) => {
                zones.forEach((zone) => {
                    if (!zone.polygon?.coordinates) return
                    const colorMap = {
                        pedestrian: { color: '#A855F7', fillColor: '#b3e5fc' },
                        coal_yard: { color: '#F59E0B', fillColor: '#c8e6c9' },
                        main_road: { color: '#8A9099', fillColor: '#d0f0c0' },
                        restricted: { color: '#EF4444', fillColor: '#ffccbc' },
                        workshop: { color: '#3B82F6', fillColor: '#e1f5fe' },
                        ash_pond: { color: '#06B6D4', fillColor: '#cffafe' },
                        gate: { color: '#22C55E', fillColor: '#dcfce7' },
                        default: { color: '#718096', fillColor: '#f5f5dc' },
                    }
                    const colors = colorMap[zone.zone_type] || colorMap.default

                    // Create polygon from coordinates
                    const coordinates = zone.polygon.coordinates[0] // Get first ring
                    const latLngs = coordinates.map(coord => [coord[1], coord[0]]) // [lng, lat] -> [lat, lng]
                    
                    const polygon = L.polygon(latLngs, {
                        color: colors.color,
                        fillColor: colors.fillColor,
                        fillOpacity: 0.4,
                        weight: 2,
                        dashArray: '5, 5',
                        className: 'geofence-polygon'
                    })
                    
                    polygon.zoneId = zone.id
                    polygon.zoneData = zone

                    // Add hover events
                    polygon.on('mouseover', () => {
                        polygon.setStyle({
                            fillOpacity: 0.7,
                            weight: 3,
                            dashArray: 'none'
                        })
                        
                        // Show popup on hover
                        const popupContent = `
                            <div style="font-size: 12px; min-width: 180px;">
                                <strong style="color: ${colors.color};">${zone.name}</strong><br/>
                                <span style="color: #666;">Type: ${zone.zone_type.replace('_', ' ')}</span><br/>
                                <span style="color: #CC0000; font-weight: bold;">⚡ ${zone.speed_limit} km/h</span>
                            </div>
                        `
                        polygon.bindPopup(popupContent, { closeButton: false }).openPopup()
                    })

                    polygon.on('mouseout', () => {
                        polygon.setStyle({
                            fillOpacity: 0.4,
                            weight: 2,
                            dashArray: '5, 5'
                        })
                        polygon.closePopup()
                    })

                    fg.addLayer(polygon)
                    layersRef.current.push({ layer: polygon, id: zone.id })
                })
            })
            .catch((err) => console.warn('Could not load geofences:', err.message))

        // Attach global delete handler
        window._deleteZone = async (zoneId) => {
            if (!window.confirm('Delete this speed zone? This cannot be undone.')) return;
            try {
                await fetch(`/api/geofences/${zoneId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('supervisor_token')}` }
                });
                window.location.reload();
            } catch (err) {
                alert('Failed to delete zone. Check connection.')
            }
        };

        window._editZone = (zoneId) => {
            console.log('Edit zone requested:', zoneId);
        };

        return () => {
            map.removeLayer(fg)
        }
    }, [map])

    // Listen for delete events from DrawControl
    useEffect(() => {
        const handleDelete = (e) => {
            const layers = e.layers
            layers.eachLayer(async (layer) => {
                if (layer.zoneId) {
                    try {
                        await geofencesApi.deleteGeofence(layer.zoneId)
                        layersRef.current = layersRef.current.filter(item => item.id !== layer.zoneId)
                    } catch (err) {
                        console.error('Failed to delete geofence:', err)
                    }
                }
            })
        }
        // Use string literal 'draw:deleted' to avoid undefined L.Draw runtime crash on startup
        map.on('draw:deleted', handleDelete)
        return () => { map.off('draw:deleted', handleDelete) }
    }, [map])

    return null
}

// ── Draw Control (polygon + delete) ──────────────────────────────
function DrawControl({ onGeofenceDrawn, drawingActive }) {
    const map = useMap()
    const drawnItemsRef = useRef(null)
    const drawControlRef = useRef(null)

    useEffect(() => {
        if (!onGeofenceDrawn) return

        import('leaflet-draw').then(() => {
            const drawnItems = new L.FeatureGroup()
            drawnItemsRef.current = drawnItems
            map.addLayer(drawnItems)

            const drawControl = new L.Control.Draw({
                position: 'topleft',
                draw: {
                    polygon: drawingActive, // enable/disable based on drawingActive state
                    polyline: false,
                    rectangle: false,   // disabled — docx says polygon only
                    circle: false,
                    circlemarker: false,
                    marker: false,
                },
                edit: false, // edit toolbar (buffer buttons) disabled per user request
            })
            drawControlRef.current = drawControl
            map.addControl(drawControl)

            // When polygon finished drawing
            map.on(L.Draw.Event.CREATED, (event) => {
                const layer = event.layer
                drawnItems.addLayer(layer)
                const geojson = layer.toGeoJSON()
                onGeofenceDrawn(geojson.geometry.coordinates)
            })

            // When a drawn zone is deleted via the toolbar
            map.on(L.Draw.Event.DELETED, (event) => {
                const layers = event.layers
                layers.eachLayer((layer) => {
                    console.log('Zone deleted from map')
                })
            })
        })
    }, [onGeofenceDrawn, map])

    // Handle drawingActive state change - recreate control to toggle polygon tool
    useEffect(() => {
        if (!drawControlRef.current || !map) return

        import('leaflet-draw').then(() => {
            // Remove old control
            map.removeControl(drawControlRef.current)

            // Create new control with updated polygon state
            const newDrawControl = new L.Control.Draw({
                position: 'topleft',
                draw: {
                    polygon: drawingActive, // Toggle polygon drawing based on state
                    polyline: false,
                    rectangle: false,
                    circle: false,
                    circlemarker: false,
                    marker: false,
                },
                edit: false,
            })
            drawControlRef.current = newDrawControl
            map.addControl(newDrawControl)
        })
    }, [drawingActive, map])

    return null
}