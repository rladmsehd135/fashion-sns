export const getFeedStyles = (isDark, loading) => ({
  container: { display: 'flex', justifyContent: 'center', gap: 4, px: { xs: 0, lg: 2 } },
  feedBox: { width: '100%', maxWidth: 470, minWidth: 0 },
  tabs: {
    borderBottom: `1px solid ${isDark ? '#1E1E1E' : '#EBEBEB'}`,
    '& .MuiTab-root': { color: isDark ? '#505050' : '#AAAAAA', fontWeight: 600, fontSize: 13 },
    '& .Mui-selected': { color: isDark ? '#F0F0F0' : '#0A0A0A' },
    '& .MuiTabs-indicator': { backgroundColor: isDark ? '#F0F0F0' : '#0A0A0A', height: 2 },
  },
  refreshHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    px: 2, py: 1.2,
    borderBottom: `1px solid ${isDark ? '#1A1A1A' : '#F0F0F0'}`,
  },
  hintText: {
    fontSize: 11, color: isDark ? '#707070' : '#888888',
    letterSpacing: 0.3, fontWeight: 600
  },
  refreshIcon: {
    fontSize: 18,
    animation: loading ? 'spin 0.8s linear infinite' : 'none',
    '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
  }
});