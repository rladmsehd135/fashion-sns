// 마지막 접속 시간 → "방금 전", "3분 전" 변환
const formatLastSeen = (lastSeenAt) => {
  if (!lastSeenAt) return null;

  const now      = new Date();
  const lastSeen = new Date(lastSeenAt);
  const diffMs   = now - lastSeen;
  const diffMin  = Math.floor(diffMs / (1000 * 60));
  const diffHour = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDay  = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMin  <  1)  return '방금 전';
  if (diffMin  < 60)  return `${diffMin}분 전`;
  if (diffHour < 24)  return `${diffHour}시간 전`;
  if (diffDay  <  7)  return `${diffDay}일 전`;

  return lastSeen.toLocaleDateString('ko-KR');
};

module.exports = { formatLastSeen };