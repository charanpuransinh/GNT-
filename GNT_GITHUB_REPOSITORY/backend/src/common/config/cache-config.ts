export const cacheConfig = {
  url: process.env.REDIS_URL || '',
  requiredInProduction: process.env.NODE_ENV === 'production',
};
