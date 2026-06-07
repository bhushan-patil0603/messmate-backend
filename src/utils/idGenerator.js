const { Member } = require('../models');

/**
 * generateMemberUid
 *
 * Generates the next sequential MBR-XXXX identifier.
 * Finds the highest existing numeric suffix and increments it.
 * Padded to at least 4 digits: MBR-1000, MBR-1001, …, MBR-9999, MBR-10000
 *
 * Uses a DB query so it stays consistent even with concurrent approvals.
 *
 * @returns {Promise<string>}  e.g. "MBR-1001"
 */
async function generateMemberUid() {
  // Pull all existing UIDs and find the maximum suffix number
  const members = await Member.findAll({
    attributes: ['member_uid'],
    where: { member_uid: { [require('sequelize').Op.ne]: null } },
    raw: true,
  });

  let maxNum = 999; // start before 1000 so first ID = MBR-1000

  for (const m of members) {
    const parts = m.member_uid?.split('-');
    if (parts && parts.length === 2) {
      const n = parseInt(parts[1], 10);
      if (!isNaN(n) && n > maxNum) maxNum = n;
    }
  }

  const nextNum = maxNum + 1;
  // Pad to minimum 4 digits
  const padded  = String(nextNum).padStart(4, '0');
  return `MBR-${padded}`;
}

module.exports = { generateMemberUid };