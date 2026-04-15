export function isExpired(date, ttlHours = 24) {
  if (!date) return true;

  const diff = Date.now() - new Date(date).getTime();

  return diff > ttlHours * 60 * 60 * 1000;
}
