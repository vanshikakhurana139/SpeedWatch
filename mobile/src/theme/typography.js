// Industrial Typography - Monospace for precision
export const Typography = {
    // For speed, penalties, distances - needs precision
    mono: {
        family: 'monospace',
        sizes: {
            huge: 72,      // Main speedometer reading
            large: 48,     // Penalty amounts
            medium: 32,    // Zone limits
            small: 24,     // Metric values
            tiny: 16,      // Labels
        },
    },

    // For labels and UI text
    sans: {
        family: 'System',
        sizes: {
            title: 28,
            heading: 22,
            body: 17,
            caption: 15,
            small: 13,
        },
        weights: {
            regular: '400',
            medium: '500',
            semibold: '600',
            bold: '700',
        },
    },
};