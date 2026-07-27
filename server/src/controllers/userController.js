import asyncHandler from '../utils/asyncHandler.js';
import { ROLES } from '../config/constants.js';
import { User, CaregiverProfile, PatientProfile, Service } from '../models/index.js';

// Loads the full profile for the current user, joining the role-specific table.
async function loadFullUser(userId) {
  return User.findByPk(userId, {
    include: [
      { model: CaregiverProfile, as: 'caregiverProfile' },
      { model: PatientProfile, as: 'patientProfile' },
      { model: Service, as: 'services', through: { attributes: [] } },
    ],
  });
}

// GET /api/users/me
export const getMe = asyncHandler(async (req, res) => {
  const user = await loadFullUser(req.user.id);
  res.json({ user: sanitize(user) });
});

// PUT /api/users/me
export const updateMe = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  const { name, phone, language_pref } = req.body;
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (language_pref !== undefined) user.language_pref = language_pref;
  await user.save();

  // Patient-specific fields.
  if (user.role === ROLES.PATIENT) {
    const [profile] = await PatientProfile.findOrCreate({ where: { user_id: user.id } });
    const { address, city, emergency_contact, notes } = req.body;
    if (address !== undefined) profile.address = address;
    if (city !== undefined) profile.city = city;
    if (emergency_contact !== undefined) profile.emergency_contact = emergency_contact;
    if (notes !== undefined) profile.notes = notes;
    await profile.save();
  }

  const full = await loadFullUser(user.id);
  res.json({ user: sanitize(full) });
});

// Strips the password hash from the serialized user + nested associations.
function sanitize(user) {
  const plain = user.get({ plain: true });
  delete plain.password_hash;
  delete plain.password;
  return plain;
}

export { sanitize };
