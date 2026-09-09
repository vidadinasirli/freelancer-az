export function toPublicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    role: row.role,
  };
}

export function toProfile(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    role: row.role,
    about: row.about || '',
    avatarUrl: row.avatarUrl || '',
    bannerUrl: row.bannerUrl || '',
    isProfileVisible: !!row.isProfileVisible,
    status: row.status || '',
    activityAreas: safeParseArray(row.activityAreas),
    experience: row.experience || 'bir ilden azdir',
    hourlyRate: row.hourlyRate || 0,
    rateType: row.rateType || '',
    nickname: row.nickname || '',
    phone: row.phone || '',
    privacySettings: safeParseObject(row.privacySettings),
    createdAt: row.createdAt || '',
  };
}

export function safeParseArray(str) {
  try {
    const v = JSON.parse(str || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function safeParseObject(str) {
  try {
    const value = JSON.parse(str || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

export function toTask(row, extra = {}) {
  return {
    id: row.id,
    ownerId: row.ownerId,
    title: row.title,
    description: row.description,
    price: row.price,
    currency: row.currency,
    priceType: row.priceType,
    categories: safeParseArray(row.categories),
    status: row.status,
    views: row.views,
    createdAt: row.createdAt,
    ...extra,
  };
}
