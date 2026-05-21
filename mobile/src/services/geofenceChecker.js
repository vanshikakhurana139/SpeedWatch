// Point-in-polygon algorithm to check if GPS coordinate is inside a geofence
const isPointInPolygon = (point, polygon) => {
    const { lat, lng } = point;
    const coordinates = polygon.coordinates[0]; // GeoJSON polygon format

    let inside = false;
    for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
        const xi = coordinates[i][0]; // longitude
        const yi = coordinates[i][1]; // latitude
        const xj = coordinates[j][0];
        const yj = coordinates[j][1];

        const intersect = ((yi > lat) !== (yj > lat)) &&
            (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);

        if (intersect) inside = !inside;
    }

    return inside;
};

// Apply time-based rules if present
const getEffectiveLimit = (zone) => {
    const now = new Date();
    const currentHour = now.getHours();

    if (!zone.time_rules || Object.keys(zone.time_rules).length === 0) {
        return zone.speed_limit;
    }

    // Check each time period
    for (const [period, rules] of Object.entries(zone.time_rules)) {
        if (rules.start && rules.end && rules.limit) {
            const [startH] = rules.start.split(':').map(Number);
            const [endH] = rules.end.split(':').map(Number);

            const inPeriod = startH < endH
                ? (currentHour >= startH && currentHour < endH)
                : (currentHour >= startH || currentHour < endH);

            if (inPeriod) {
                return Math.min(zone.speed_limit, rules.limit);
            }
        }
    }

    return zone.speed_limit;
};

// Get applicable speed limit for current position
export const getSpeedLimitForPosition = (lat, lng, geofences, loadType = 'empty') => {
    // Load-type base limits (from blueprint)
    const loadLimits = {
        empty: 50,
        partial: 50,
        full: 40,
        hazardous: 30,
    };

    const baseLoadLimit = loadLimits[loadType] || 50;
    let applicableLimit = 50; // Plant default
    let currentZone = null;

    // Check each geofence
    for (const zone of geofences) {
        if (isPointInPolygon({ lat, lng }, zone.polygon)) {
            const zoneLimit = getEffectiveLimit(zone);

            // Hazardous load special rules
            const adjustedLimit = loadType === 'hazardous' && zone.zone_type === 'pedestrian'
                ? Math.min(zoneLimit, 10)
                : zoneLimit;

            // Take most restrictive limit
            if (adjustedLimit < applicableLimit) {
                applicableLimit = adjustedLimit;
                currentZone = zone;
            }
        }
    }

    // Apply load limit
    const finalLimit = Math.min(applicableLimit, baseLoadLimit);

    return {
        limit: finalLimit,
        zone: currentZone,
        insideZone: !!currentZone,
    };
};