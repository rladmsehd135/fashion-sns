import { Box, Tooltip } from '@mui/material';

const CONFIGS = {
  1: {
    gradient: 'linear-gradient(135deg, #FFE566 0%, #F5A623 100%)',
    border: 'rgba(255,200,0,0.6)',
    glow: '0 0 10px rgba(255,200,0,0.55), 0 2px 6px rgba(0,0,0,0.2)',
    label: '1st Style King',
  },
  2: {
    gradient: 'linear-gradient(135deg, #F0F0F8 0%, #8E8EA8 100%)',
    border: 'rgba(160,160,185,0.6)',
    glow: '0 0 10px rgba(160,160,190,0.5), 0 2px 6px rgba(0,0,0,0.2)',
    label: '2nd Style King',
  },
  3: {
    gradient: 'linear-gradient(135deg, #ECA96A 0%, #8B3A00 100%)',
    border: 'rgba(180,90,30,0.6)',
    glow: '0 0 10px rgba(180,90,30,0.5), 0 2px 6px rgba(0,0,0,0.2)',
    label: '3rd Style King',
  },
};

const SIZES = {
  overlay: 28,
  large: 24,
  inline: 17,
};

// Crown SVG 아이콘 (순수 SVG, 의존성 없음)
function CrownIcon({ size }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 왕관 몸체 */}
      <path
        d="M0.8,13 L0.8,8.2 L4,4.8 L7,8.2 L8,1.2 L9,8.2 L12,4.8 L15.2,8.2 L15.2,13 Z"
        fill="rgba(255,255,255,0.96)"
      />
      {/* 왕관 밑단 장식선 */}
      <rect x="0.8" y="12.2" width="14.4" height="1" rx="0.5" fill="rgba(255,255,255,0.5)" />
      {/* 왕관 끝 보석 */}
      <circle cx="4" cy="4.8" r="1.2" fill="rgba(255,255,255,0.75)" />
      <circle cx="8" cy="1.2" r="1.2" fill="rgba(255,255,255,0.9)" />
      <circle cx="12" cy="4.8" r="1.2" fill="rgba(255,255,255,0.75)" />
    </svg>
  );
}

/**
 * rank: 1 | 2 | 3
 * wins: 총 승리 수 (툴팁 표시용, 선택)
 * size: 'overlay' | 'large' | 'inline'
 */
export default function RankBadge({ rank, wins, size = 'inline' }) {
  const r = Number(rank);
  if (!r || r < 1 || r > 3) return null;

  const cfg = CONFIGS[r];
  const dim = SIZES[size];
  const crownSize = Math.round(dim * 0.62);
  const tooltipLabel = wins ? `${cfg.label} (${wins}승)` : cfg.label;

  return (
    <Tooltip title={tooltipLabel} arrow placement="top">
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: dim,
          height: dim,
          borderRadius: '50%',
          background: cfg.gradient,
          boxShadow: cfg.glow,
          border: `1.5px solid ${cfg.border}`,
          flexShrink: 0,
          cursor: 'default',
          transition: 'transform 0.15s ease',
          '&:hover': { transform: 'scale(1.12)' },
        }}
      >
        <CrownIcon size={crownSize} />
      </Box>
    </Tooltip>
  );
}
