/**
 * Commission Calculation Engine for Financial & Pension Products
 *
 * Formulas:
 * - Scope (היקף):
 *   • Mobility: mobility × scope%
 *   • Lump-sum deposit: lumpSum × scope%
 *   • Monthly deposit: monthly × 12 × scope%
 *   • Accumulation only (no mobility): NO scope commission
 *
 * - Ongoing (נפרעים):
 *   • Base from accumulation/mobility: (accumulation OR mobility) × ongoing% ÷ 12
 *   • Lump-sum addition: lumpSum × ongoing% ÷ 12
 *   • Monthly deposit: monthly × ongoing%
 *   • All components are ADDITIVE
 */

export interface FinancialInputs {
    accumulation: number;    // סכום צבירה
    mobility: number;        // סכום ניוד
    monthlyDeposit: number;  // הפקדה חודשית
    lumpSumDeposit: number;  // הפקדה חד פעמית
}

export interface CommissionRates {
    scope: number;    // היקף % (as decimal, e.g. 0.5 = 0.5%)
    ongoing: number;  // נפרעים % (as decimal, e.g. 0.2 = 0.2%)
    mobility: number; // ניוד % (as decimal)
}

/**
 * Calculate total one-time scope (היקף) commission
 */
export function calcFinancialScope(inputs: FinancialInputs, rates: CommissionRates): number {
    const scopeRate = rates.scope / 100;
    const mobilityRate = rates.mobility / 100 || scopeRate; // fallback to scope

    let total = 0;

    // Mobility scope
    if (inputs.mobility > 0) {
        total += inputs.mobility * mobilityRate;
    }

    // Lump-sum deposit scope
    if (inputs.lumpSumDeposit > 0) {
        total += inputs.lumpSumDeposit * scopeRate;
    }

    // Monthly deposit annualized scope
    if (inputs.monthlyDeposit > 0) {
        total += inputs.monthlyDeposit * 12 * scopeRate;
    }

    return total;
}

/**
 * Calculate monthly ongoing (נפרעים) commission
 */
export function calcFinancialOngoing(inputs: FinancialInputs, rates: CommissionRates): number {
    const ongoingRate = rates.ongoing / 100;

    let total = 0;

    // Base from the larger of accumulation or mobility (not both)
    const baseAmount = inputs.mobility > 0 ? inputs.mobility : inputs.accumulation;
    if (baseAmount > 0) {
        total += (baseAmount * ongoingRate) / 12;
    }

    // Lump-sum deposit ongoing (added to base)
    if (inputs.lumpSumDeposit > 0) {
        total += (inputs.lumpSumDeposit * ongoingRate) / 12;
    }

    // Monthly deposit ongoing
    if (inputs.monthlyDeposit > 0) {
        total += inputs.monthlyDeposit * ongoingRate;
    }

    return total;
}

/**
 * Calculate the total accumulated balance for a given month index
 * This supports the "premium development" view showing growing balances
 *
 * @param inputs - initial financial inputs
 * @param monthIndex - months elapsed since establishment (0 = first month)
 * @param monthlyReturnRate - average monthly return as a decimal (e.g. 0.5 = 0.5%)
 */
export function calcAccumulatedBalance(
    inputs: FinancialInputs,
    monthIndex: number,
    monthlyReturnRate: number = 0
): number {
    const returnMultiplier = 1 + (monthlyReturnRate / 100);

    // Starting balance = accumulation + mobility + lump sum
    let balance = (inputs.accumulation || 0) + (inputs.mobility || 0) + (inputs.lumpSumDeposit || 0);

    // Grow over months with returns and monthly deposits
    for (let m = 0; m < monthIndex; m++) {
        balance = balance * returnMultiplier + (inputs.monthlyDeposit || 0);
    }

    return balance;
}

/**
 * Calculate the weighted monthly return from multiple investment tracks
 */
export function calcWeightedReturn(
    tracks: { trackName: string; weight: number }[],
    trackReturns: Record<string, number> // trackName -> monthly return %
): number {
    let weightedReturn = 0;
    tracks.forEach(track => {
        const returnRate = trackReturns[track.trackName] || 0;
        weightedReturn += (track.weight / 100) * returnRate;
    });
    return weightedReturn;
}
