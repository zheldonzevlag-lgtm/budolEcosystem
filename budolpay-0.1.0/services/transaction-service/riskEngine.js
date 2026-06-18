/**
 * AI-Driven Behavioral Baselining Engine (v2.4.0)
 * Implements Exponentially Weighted Moving Average (EWMA) for real-time risk scoring.
 * Compliance: BSP Circular No. 808 / Institutional AML Guidelines
 */

const ALPHA = 0.2; // Smoothing factor for EWMA
const GLOBAL_MEDIAN = 2500; // PHP fallback for cold start protection

/**
 * Pure math core for Anomaly Detection
 * @param {number} amount 
 * @param {Array} history 
 * @returns {Object} { score, baseline, deviation, method }
 */
function calculateAnomalyScore(amount, history) {
    if (!history || history.length < 3) {
        // Cold start fallback
        const deviation = Math.abs(amount - GLOBAL_MEDIAN) / GLOBAL_MEDIAN;
        const score = Math.min(100, Math.floor(deviation * 10)); // Simple normalization for cold start
        return { 
            score, 
            baseline: GLOBAL_MEDIAN, 
            deviation, 
            method: 'COLD_START_MEDIAN' 
        };
    }

    // EWMA Algorithm
    let baseline = parseFloat(history[history.length - 1].amount);
    for (let i = history.length - 2; i >= 0; i--) {
        baseline = (ALPHA * parseFloat(history[i].amount)) + (1 - ALPHA) * baseline;
    }

    const deviation = Math.abs(amount - baseline) / (baseline || 1);
    
    // Scoring logic: 
    // Deviation < 0.5 (50%): Low Score
    // Deviation > 2.5 (250%): Critical Score
    let score = Math.round((deviation / 2.5) * 100);

    return {
        score: Math.min(100, Math.max(0, score)),
        baseline,
        deviation,
        method: 'DEVIATION_EWMA'
    };
}

module.exports = { calculateAnomalyScore };
