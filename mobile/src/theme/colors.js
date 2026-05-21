// SpeedWatch Industrial Design System
// NO gradients, NO neon colors, NO generic AI aesthetics

export const Colors = {
    // Base Industrial Palette
    background: {
        primary: '#1C1C1E',      // Matte dark charcoal (main screen background)
        secondary: '#2C2C2E',    // Slightly lighter for cards
        elevated: '#3A3A3C',     // Raised elements
    },

    // Status Colors (Safety System)
    status: {
        safe: '#34C759',         // Green - under 40 km/h
        warning: '#FF9500',      // Amber - 40-50 km/h
        violation: '#FF3B30',    // Red - over 50 km/h
        critical: '#C00000',     // Dark red - emergency
    },

    // UI Elements
    text: {
        primary: '#FFFFFF',
        secondary: '#EBEBF5',
        tertiary: '#98989D',
        inverse: '#1C1C1E',
    },

    // Functional
    border: '#48484A',
    divider: '#38383A',
    overlay: 'rgba(0, 0, 0, 0.85)',

    // Industrial Accents (very subtle, no gradients)
    accent: {
        blue: '#0A84FF',        // Only for interactive elements
        steel: '#8E8E93',       // Neutral metal tone
    },
};