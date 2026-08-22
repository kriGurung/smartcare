import asyncHandler from '../utils/asyncHandler.js';
import { Service, Setting } from '../models/index.js';
import { DEFAULT_COMMISSION_PERCENT } from '../config/constants.js';

// GET /api/services  — public service catalogue (for filters & caregiver setup)
export const listServices = asyncHandler(async (req, res) => {
  const services = await Service.findAll({ where: { is_active: true }, order: [['name', 'ASC']] });
  res.json({ services });
});

// GET /api/meta/public  — public banner + commission (shown on marketing pages)
export const getPublicMeta = asyncHandler(async (req, res) => {
  const [banner, commission] = await Promise.all([
    Setting.findByPk('banner'),
    Setting.findByPk('commission_percent'),
  ]);
  res.json({
    banner: banner?.value || '',
    commissionPercent: typeof commission?.value === 'number' ? commission.value : DEFAULT_COMMISSION_PERCENT,
  });
});
