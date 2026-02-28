/**
 * Formats a value in milliliters into a human-readable string with units.
 * Switches to Liters (L) if the value is >= 1000 ml.
 */
export const formatVolume = (ml: number): { value: string; unit: string } => {
    if (Math.abs(ml) >= 1000) {
        return {
            value: (ml / 1000).toFixed(2),
            unit: 'L'
        };
    }
    return {
        value: ml.toFixed(1),
        unit: 'ml'
    };
};

/**
 * Formats a flow rate in ml/min into a human-readable string with units.
 */
export const formatFlow = (mlMin: number): { value: string; unit: string } => {
    if (Math.abs(mlMin) >= 1000) {
        return {
            value: (mlMin / 1000).toFixed(2),
            unit: 'L/min'
        };
    }
    return {
        value: mlMin.toFixed(0),
        unit: 'ml/min'
    };
};
