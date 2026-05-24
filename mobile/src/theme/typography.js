export const Typography = {
    // For precision numbers (speed, penalties)
    mono: {
        family: 'monospace',
        sizes: {
            huge: 68,        // Speedometer
            large: 44,       // Penalties
            medium: 28,      // Limits
            small: 20,       // Metrics
            tiny: 14,        // Labels
        },
    },

    // SAIL Professional Typography
    sans: {
        family: 'System',
        sizes: {
            title: 32,       // Screen titles
            heading: 24,     // Section headers
            subheading: 20,  // Card headers
            body: 16,        // Regular text
            caption: 14,     // Small labels
            small: 12,       // Tiny text
        },
        weights: {
            regular: '400',
            medium: '500',
            semibold: '600',
            bold: '700',
            heavy: '800',    // For emphasis
        },
    },
};