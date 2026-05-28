import { Box, Skeleton } from '@mui/material';

const SkeletonCard = () => (
  <Box sx={{ backgroundColor: '#111', borderBottom: '1px solid #1E1E1E', pb: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5 }}>
      <Skeleton variant="circular" width={38} height={38} sx={{ bgcolor: '#1E1E1E' }} />
      <Box>
        <Skeleton width={120} height={14} sx={{ bgcolor: '#1E1E1E', mb: 0.5 }} />
        <Skeleton width={70}  height={12} sx={{ bgcolor: '#1E1E1E' }} />
      </Box>
    </Box>
    <Skeleton variant="rectangular" sx={{ width: '100%', paddingTop: '100%', bgcolor: '#1A1A1A' }} />
    <Box sx={{ px: 2, pt: 1.5 }}>
      <Skeleton width={100} height={14} sx={{ bgcolor: '#1E1E1E', mb: 0.5 }} />
      <Skeleton width="80%" height={13} sx={{ bgcolor: '#1E1E1E' }} />
    </Box>
  </Box>
);

export default SkeletonCard;