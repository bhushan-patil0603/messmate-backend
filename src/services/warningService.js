'use strict';

/**
 * warningService
 *
 * Centralised warning evaluation logic.
 * Called by mealService after every token deduction
 * and by memberService when returning member data.
 *
 * Warning thresholds (from RGD FR-05):
 *   WARN-01: remainingTokens <= 5
 *   WARN-02: days until endDate  <= 5
 *   WARN-03: both conditions true simultaneously
 */

const LOW_TOKEN_THRESHOLD  = 5;
const NEAR_EXPIRY_DAYS     = 5;

/**
 * evaluateWarnings
 *
 * @param {object} member  - Sequelize Member instance or plain object
 *                           Must have: remaining_tokens, end_date
 * @returns {{
 *   hasWarning:   boolean,
 *   lowToken:     boolean,
 *   nearExpiry:   boolean,
 *   daysLeft:     number,
 *   warnings:     Array<{ type: string, message: string }>
 * }}
 */
function evaluateWarnings(member) {
  const remaining = member.remaining_tokens;

  // Calculate days left until membership ends
  const today   = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(member.end_date);
  endDate.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((endDate - today) / 86_400_000);

  const lowToken   = remaining <= LOW_TOKEN_THRESHOLD;
  const nearExpiry = daysLeft >= 0 && daysLeft <= NEAR_EXPIRY_DAYS;

  const warnings = [];

  if (lowToken && nearExpiry) {
    warnings.push({
      type:    'CRITICAL',
      message: `Only ${remaining} token(s) left and membership expires in ${daysLeft} day(s)`,
    });
  } else {
    if (lowToken) {
      warnings.push({
        type:    'LOW_TOKEN',
        message: `Only ${remaining} token(s) remaining`,
      });
    }
    if (nearExpiry) {
      warnings.push({
        type:    'NEAR_EXPIRY',
        message: `Membership expires in ${daysLeft} day(s)`,
      });
    }
  }

  return {
    hasWarning: warnings.length > 0,
    lowToken,
    nearExpiry,
    daysLeft,
    warnings,
  };
}

module.exports = { evaluateWarnings, LOW_TOKEN_THRESHOLD, NEAR_EXPIRY_DAYS };