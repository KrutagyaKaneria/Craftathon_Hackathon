export const Theme = {
  colors: {
    primary: '#004ac6',
    primaryContainer: '#2563eb',
    onPrimary: '#ffffff',
    
    background: '#0a1428', // Deep Sentinel Blue
    surface: '#0f1d3a',
    surfaceVariant: 'rgba(255, 255, 255, 0.05)',
    surfaceContainerLow: 'rgba(255, 255, 255, 0.02)',
    surfaceContainerHigh: 'rgba(255, 255, 255, 0.08)',
    surfaceContainerHighest: 'rgba(255, 255, 255, 0.12)',
    
    success: '#006329',
    onSuccess: '#ffffff',
    
    error: '#ba1a1a',
    onError: '#ffffff',
    
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
    textMuted: 'rgba(255, 255, 255, 0.4)',
    
    accent: '#00D9FF',
    outline: 'rgba(255, 255, 255, 0.1)',
    outlineVariant: 'rgba(255, 255, 255, 0.05)',
  },
  
  fonts: {
    display: 'SpaceGrotesk-Bold',
    headline: 'SpaceGrotesk-SemiBold',
    title: 'SpaceGrotesk-Medium',
    body: 'Inter-Regular',
    label: 'Inter-Medium',
    technical: 'SpaceGrotesk-Regular',
  },
  
  roundness: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 24,
    full: 999,
  },
  
  shadows: {
    tripleDiffusion: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 24,
      elevation: 8,
    },
    glass: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
    }
  }
};
