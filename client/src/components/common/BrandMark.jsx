import { Box } from '@mui/material';

const BrandMark = ({ size = 38 }) => (
  <Box
    sx={{
      width: size,
      height: size,
      borderRadius: `${Math.max(8, size * 0.26)}px`,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg,#E8C96D,#B8952D)',
      boxShadow: size >= 36 ? '0 4px 20px rgba(232,201,109,0.2)' : 'none',
    }}>
    <Box
      component="svg"
      viewBox="0 0 64 64"
      aria-hidden="true"
      sx={{ width: size * 0.78, height: size * 0.78 }}>
      <path
        d="M32 14c0-4.8 7-4.8 7 0 0 3.6-3.4 4.8-7 7.2"
        fill="none"
        stroke="#0A0A0A"
        strokeWidth="4.4"
        strokeLinecap="round"
      />
      <path
        d="M17 42 32 24l15 18"
        fill="none"
        stroke="#0A0A0A"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="19"
        y="37"
        width="26"
        height="15"
        rx="4"
        fill="none"
        stroke="#0A0A0A"
        strokeWidth="4.4"
      />
      <circle cx="41" cy="42" r="2.3" fill="#0A0A0A" />
      <path
        d="M25 43h8"
        fill="none"
        stroke="#0A0A0A"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </Box>
  </Box>
);

export default BrandMark;
