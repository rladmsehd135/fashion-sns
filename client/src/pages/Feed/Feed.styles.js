export const getFeedStyles = (isDark, loading) => ({
  container: { display: 'flex', justifyContent: 'center', gap: 4, px: { xs: 0, lg: 2 } },
  feedBox:   { width: '100%', maxWidth: 470, minWidth: 0 },


  refreshIcon: {
    fontSize: 18,
    animation: loading ? 'spin 0.8s linear infinite' : 'none',
    '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
  },
});
