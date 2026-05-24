import React, { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import { useDashboardStore } from '../store/dashboardStore'
import { geofencesApi } from '../api/geofences'

// FIX: Leaflet's default icon paths break in Vite — point them to CDN
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// SAIL RDCIS Ranchi coordinates
const PLANT_CENTER = [23.343, 85.319]
const PLANT_ZOOM = 15

export default function LiveMap({ onDrawGeofence }) {
    return (
        // FIX: the container must have 100% height AND width for Leaflet to render
        // The parent div in DashboardPage has position:relative + height:100%
        <div style={{ position: 'absolute', inset: 0 }}>
            <MapContainer
                center={PLANT_CENTER}
                zoom={PLANT_ZOOM}
                // FIX: must match the container — position absolute fills 100% of the relative parent
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
            >
                {/* CartoDB light tiles — clean, no API key required */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
                    maxZoom={19}
                />

                {/* These three components MUST be inside MapContainer
                    so they can access the map instance via useMap() hook */}
                <VehicleMarkerLayer />
                <GeofenceLayer />
                <DrawControl onGeofenceDrawn={onDrawGeofence} />
            </MapContainer>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// VehicleMarkerLayer — reads positions from the Zustand store and places
// Leaflet markers imperatively. We use useRef to avoid re-creating markers
// on every render — instead we update existing ones in place.
// ─────────────────────────────────────────────────────────────────────────────
function VehicleMarkerLayer() {
    const map = useMap()
    const markersRef = useRef({})   // vehicleId → Leaflet Marker object
    const { vehiclePositions, setSelectedVehicle, selectedVehicleId } = useDashboardStore()

    useEffect(() => {
        // Track which vehicles we've already seen so we can remove stale ones
        const currentIds = new Set(Object.keys(vehiclePositions))

        // Remove markers for vehicles that ended their trip
        Object.keys(markersRef.current).forEach((id) => {
            if (!currentIds.has(id)) {
                markersRef.current[id].remove()
                delete markersRef.current[id]
            }
        })

        // Add or update a marker for each active vehicle
        Object.entries(vehiclePositions).forEach(([vehicleId, vehicle]) => {
            const { lat, lng, speed, status } = vehicle

            // Status → colour mapping (same as the sidebar dots)
            const color = status === 'violation' ? '#EF4444'
                : status === 'warning' ? '#F59E0B'
                    : '#22C55E'

            const isViolation = status === 'violation'
            const size = isViolation ? 20 : 16
            const labelShort = vehicleId.length > 8
                ? vehicleId.slice(0, 8) + '…'
                : vehicleId

            // Build the custom HTML icon — a coloured dot + vehicle ID + speed label
            const iconHtml = `
                <div style="
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    pointer-events: none;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
                ">
                    <div style="
                        background: #16181C;
                        color: #C9CDD6;
                        font-size: 9px;
                        font-family: 'Share Tech Mono', monospace;
                        font-weight: 700;
                        padding: 1px 5px;
                        border-radius: 2px;
                        border: 1px solid rgba(255,255,255,0.15);
                        white-space: nowrap;
                        margin-bottom: 3px;
                    ">${labelShort}</div>
                    <div style="
                        width: ${size}px;
                        height: ${size}px;
                        border-radius: 50%;
                        background: ${color};
                        border: 2.5px solid rgba(255,255,255,0.9);
                        ${isViolation ? `box-shadow: 0 0 0 4px rgba(239,68,68,0.35);` : ''}
                    "></div>
                    <div style="
                        background: #16181C;
                        color: ${color};
                        font-size: 9px;
                        font-family: 'Share Tech Mono', monospace;
                        font-weight: 700;
                        padding: 1px 5px;
                        border-radius: 2px;
                        border: 1px solid rgba(255,255,255,0.12);
                        margin-top: 3px;
                        white-space: nowrap;
                    ">${Math.round(speed)} km/h</div>
                </div>
            `

            const icon = L.divIcon({
                html: iconHtml,
                className: '',              // clear Leaflet's default white square
                iconSize: [size + 24, size + 30],
                iconAnchor: [(size + 24) / 2, (size + 30) / 2],
            })

            if (markersRef.current[vehicleId]) {
                // Vehicle already has a marker — just move it and update icon
                markersRef.current[vehicleId]
                    .setLatLng([lat, lng])
                    .setIcon(icon)
            } else {
                // First time we've seen this vehicle — create a new marker
                const marker = L.marker([lat, lng], { icon, zIndexOffset: isViolation ? 1000 : 0 })
                marker.on('click', () => setSelectedVehicle(vehicleId))
                marker.addTo(map)
                markersRef.current[vehicleId] = marker
            }
        })
    }, [vehiclePositions, map, setSelectedVehicle])

    // When a vehicle is selected from the sidebar, pan the map to it
    useEffect(() => {
        if (selectedVehicleId && vehiclePositions[selectedVehicleId]) {
            const { lat, lng } = vehiclePositions[selectedVehicleId]
            map.panTo([lat, lng], { animate: true, duration: 0.5 })
        }
    }, [selectedVehicleId, vehiclePositions, map])

    return null  // This component controls Leaflet imperatively — renders nothing in React
}

// ─────────────────────────────────────────────────────────────────────────────
// GeofenceLayer — loads saved speed zones from backend and draws them as
// coloured polygons. Loads once when the map is ready.
// ─────────────────────────────────────────────────────────────────────────────
function GeofenceLayer() {
    const map = useMap()
    const layersRef = useRef([])

    useEffect(() => {
        geofencesApi.getGeofences()
            .then((zones) => {
                // Clear previous layers first
                layersRef.current.forEach((l) => l.remove())
                layersRef.current = []

                zones.forEach((zone) => {
                    if (!zone.polygon?.coordinates) return

                    // Each zone type gets a distinct colour
                    const colorMap = {
                        pedestrian: '#A855F7',   // Purple
                        coal_yard: '#F59E0B',    // Amber
                        main_road: '#8A9099',    // Grey
                        restricted: '#EF4444',   // Red
                        workshop: '#3B82F6',     // Blue
                        default: '#3B82F6',
                    }
                    const color = colorMap[zone.zone_type] || colorMap.default

                    try {
                        // GeoJSON stores [lng, lat] — Leaflet needs [lat, lng]
                        const coords = zone.polygon.coordinates[0].map(([lng, lat]) => [lat, lng])
                        const polygon = L.polygon(coords, {
                            color,
                            fillColor: color,
                            fillOpacity: 0.12,
                            weight: 1.5,
                            dashArray: '6 4',
                        })

                        polygon.bindTooltip(
                            `<div style="font-family:'Share Tech Mono',monospace;font-size:11px;">
                                <strong>${zone.name}</strong><br/>
                                Limit: ${zone.speed_limit} km/h
                            </div>`,
                            { permanent: false, sticky: true, opacity: 0.95 }
                        )

                        polygon.addTo(map)
                        layersRef.current.push(polygon)
                    } catch (err) {
                        console.warn('Geofence render failed:', zone.name, err)
                    }
                })
            })
            .catch((err) => {
                // Silently fail — backend may not be running during development
                console.warn('Could not load geofences (backend offline?):', err.message)
            })
    }, [map])

    return null
}

// ─────────────────────────────────────────────────────────────────────────────
// DrawControl — adds Leaflet Draw toolbar so supervisors can draw new zones.
// After finishing a polygon, passes coordinates up to DashboardPage which
// opens the GeofenceForm modal to name and save the zone.
// ─────────────────────────────────────────────────────────────────────────────
function DrawControl({ onGeofenceDrawn }) {
    const map = useMap()

    useEffect(() => {
        if (!onGeofenceDrawn) return

        // leaflet-draw patches L globally — import it dynamically
        import('leaflet-draw').then(() => {
            const drawnItems = new L.FeatureGroup()
            map.addLayer(drawnItems)

            const drawControl = new L.Control.Draw({
                position: 'topleft',
                draw: {
                    polygon: {
                        allowIntersection: false,
                        shapeOptions: {
                            color: '#3B82F6',
                            fillOpacity: 0.15,
                            weight: 2,
                        },
                        showArea: false,
                        metric: true,
                    },
                    polyline: false,
                    rectangle: false,
                    circle: false,
                    circlemarker: false,
                    marker: false,
                },
                edit: { featureGroup: drawnItems },
            })
            map.addControl(drawControl)

            map.on(L.Draw.Event.CREATED, (event) => {
                const layer = event.layer
                drawnItems.addLayer(layer)
                // Pass the GeoJSON coordinates to the parent → opens GeofenceForm
                const geojson = layer.toGeoJSON()
                onGeofenceDrawn(geojson.geometry.coordinates)
            })
        }).catch((err) => {
            console.error('Failed to load leaflet-draw:', err)
        })

        // No cleanup needed — draw control persists for the session
    }, [map, onGeofenceDrawn])

    return null
}