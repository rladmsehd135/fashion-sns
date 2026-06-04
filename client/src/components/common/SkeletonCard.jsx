import useThemeStore from '../../store/themeStore';

const shimmerStyle = (isDark) => ({
  background: isDark
    ? 'linear-gradient(90deg, #161616 25%, #1E1E1E 50%, #161616 75%)'
    : 'linear-gradient(90deg, #F0F0F0 25%, #E4E4E4 50%, #F0F0F0 75%)',
  backgroundSize: '400px 100%',
  animation: 'shimmer 1.6s ease-in-out infinite',
  borderRadius: 6,
});

const keyframesStyle = `
  @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
`;

const SkeletonCard = () => {
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';

  const S = shimmerStyle(isDark);
  const border = isDark ? '1px solid #181818' : '1px solid #EBEBEB';
  const bg     = isDark ? '#111111' : '#FAFAFA';

  return (
    <div style={{ backgroundColor: bg, borderBottom: border, paddingBottom: 12 }}>
      <style>{keyframesStyle}</style>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
        <div style={{ ...S, width: 38, height: 38, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ ...S, width: 130, height: 11, marginBottom: 6 }} />
          <div style={{ ...S, width: 72,  height: 9  }} />
        </div>
      </div>

      {/* 이미지 */}
      <div style={{ ...S, width: '100%', aspectRatio: '4 / 5', borderRadius: 0 }} />

      {/* 액션 버튼 */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 16px 0' }}>
        {[24, 24, 24].map((w, i) => (
          <div key={i} style={{ ...S, width: w, height: w, borderRadius: '50%' }} />
        ))}
      </div>

      {/* 텍스트 */}
      <div style={{ padding: '10px 16px 0' }}>
        <div style={{ ...S, width: '55%', height: 11, marginBottom: 7 }} />
        <div style={{ ...S, width: '80%', height: 10, marginBottom: 5 }} />
        <div style={{ ...S, width: '45%', height: 10 }} />
      </div>
    </div>
  );
};

export default SkeletonCard;
