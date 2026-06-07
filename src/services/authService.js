const { Admin, Member }          = require('../models');
const { comparePassword }        = require('../utils/hash');
const { buildAuthResponse }      = require('../utils/jwt');
const AppError                   = require('../utils/AppError');

/**
 * adminLogin
 *
 * Finds an admin by email, verifies the password,
 * and returns a signed JWT with the safe admin object.
 *
 * @param {string} email
 * @param {string} password
 * @returns {{ token: string, user: object }}
 */
async function adminLogin(email, password) {
  // 1. Find admin (include password_hash explicitly — it's not returned by default)
  const admin = await Admin.findOne({ where: { email: email.toLowerCase() } });

  if (!admin) {
    // Use a generic message — don't reveal whether the email exists
    throw new AppError('Invalid email or password', 401);
  }

  if (!admin.is_active) {
    throw new AppError('This admin account has been deactivated.', 403);
  }

  // 2. Verify password
  const isMatch = await comparePassword(password, admin.password_hash);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  // 3. Build and return auth response
  return buildAuthResponse(admin, 'ADMIN');
}

/**
 * memberLogin
 *
 * Finds an active member by their unique MBR-XXXX id,
 * verifies the password, and returns a signed JWT.
 *
 * @param {string} memberUid  e.g. "MBR-1001"
 * @param {string} password
 * @returns {{ token: string, user: object }}
 */
async function memberLogin(memberUid, password) {
  // 1. Find member by their human-readable ID
  const member = await Member.findOne({
    where: { member_uid: memberUid.toUpperCase() },
  });

  if (!member) {
    throw new AppError('Invalid Member ID or password', 401);
  }

  // 2. Only ACTIVE members can log in
  if (member.status !== 'ACTIVE') {
    const statusMessages = {
      PENDING:  'Your membership request is still pending approval.',
      DECLINED: 'Your membership request was declined.',
      EXPIRED:  'Your membership has expired.',
    };
    throw new AppError(
      statusMessages[member.status] || 'Account is not active.',
      403,
    );
  }

  // 3. Members get a password set when approved. Check it exists.
  if (!member.password_hash) {
    throw new AppError(
      'No password has been set for this account. Please contact the mess admin.',
      403,
    );
  }

  // 4. Verify password
  const isMatch = await comparePassword(password, member.password_hash);
  if (!isMatch) {
    throw new AppError('Invalid Member ID or password', 401);
  }

  // 5. Build and return auth response
  return buildAuthResponse(member, 'MEMBER');
}

/**
 * getMe
 *
 * Returns the currently authenticated user's profile.
 * Works for both ADMIN and MEMBER roles.
 *
 * @param {object} user     - req.user set by authenticate middleware
 * @param {string} userRole - req.userRole set by authenticate middleware
 * @returns {object}
 */
function getMe(user, userRole) {
  const { password_hash, ...safeUser } = user.toJSON
    ? user.toJSON()
    : { ...user };

  return { role: userRole, ...safeUser };
}

module.exports = { adminLogin, memberLogin, getMe };