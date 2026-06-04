/**
 * FITLOG 로고 마크 — 미니멀 패션 행어 SVG
 * size: 아이콘 크기 (px)
 * variant: 'icon' | 'full' | 'wordmark'
 */
const BrandMark = ({ size = 36, variant = 'icon', isDark = true }) => {
  const iconSize  = size;
  const radius    = Math.round(iconSize * 0.28);
  const strokeW   = Math.max(1.6, iconSize * 0.065);

  const Icon = () => (
    <div style={{
      width:  iconSize,
      height: iconSize,
      borderRadius: radius,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(145deg, #F2D060 0%, #C8991A 100%)',
      boxShadow: iconSize >= 30
        ? '0 2px 16px rgba(232,201,109,0.30), 0 1px 4px rgba(0,0,0,0.3)'
        : 'none',
    }}>
      <svg
        viewBox="0 0 32 32"
        fill="none"
        width={iconSize * 0.70}
        height={iconSize * 0.70}
        aria-hidden="true"
      >
        {/* 후크 (J-커브) */}
        <path
          d="M16 3C14 3 10 5.2 10 8.2C10 10.4 12 12 14.5 12"
          stroke="rgba(15,10,0,0.85)"
          strokeWidth={strokeW}
          strokeLinecap="round"
        />
        {/* 행어 몸통 (삼각형) */}
        <path
          d="M14.5 12L3.5 27H28.5L14.5 12Z"
          stroke="rgba(15,10,0,0.85)"
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );

  if (variant === 'icon') return <Icon />;

  /* ── full: 아이콘 + 워드마크 ── */
  const textColor = isDark ? '#F0F0F0' : '#0A0A0A';
  const subColor  = isDark ? '#383838' : '#CCCCCC';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Icon />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span style={{
          fontFamily:    '"Montserrat", sans-serif',
          fontWeight:    900,
          fontSize:      size * 0.50,
          letterSpacing: '0.15em',
          background:    'linear-gradient(135deg, #E8C96D 0%, #C8991A 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor:  'transparent',
          lineHeight:    1,
          whiteSpace:    'nowrap',
        }}>
          FITLOG
        </span>
        <span style={{
          fontFamily:    '"Montserrat", "Pretendard", sans-serif',
          fontWeight:    700,
          fontSize:      size * 0.21,
          letterSpacing: '0.32em',
          color:         subColor,
          lineHeight:    1,
          marginTop:     3,
          whiteSpace:    'nowrap',
          textTransform: 'uppercase',
        }}>
          Fashion Archive
        </span>
      </div>
    </div>
  );
};

export default BrandMark;
