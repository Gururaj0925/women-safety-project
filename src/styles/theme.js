// Theme Configuration
export const theme = {
  colors: {
    primary: {
      pink: '#0F766E',
      lavender: '#14B8A6',
      purple: '#0F4C5C',
    },
    light: {
      pink: '#F8FAFC',
      lavender: '#EEF6F7',
      purple: '#DBE8EB',
    },
    neutral: {
      white: '#F3F7F8',
      border: '#D6E1E5',
      darkText: '#102A43',
      lightText: '#627D98',
    },
    status: {
      red: '#C0392B',
      green: '#1F9D74',
      yellow: '#D97706',
    },
  },
  gradients: {
    primary: 'linear-gradient(135deg, #0F4C5C 0%, #0F766E 55%, #14B8A6 100%)',
    secondary: 'linear-gradient(180deg, #FFFFFF 0%, #EEF6F7 100%)',
    accent: 'linear-gradient(135deg, #C0392B 0%, #E74C3C 100%)',
  },
  shadows: {
    sm: '0 8px 20px rgba(15, 42, 67, 0.06)',
    md: '0 18px 36px rgba(15, 42, 67, 0.08)',
    lg: '0 28px 56px rgba(15, 42, 67, 0.12)',
  },
  borderRadius: {
    sm: '12px',
    md: '18px',
    lg: '28px',
    full: '50%',
  },
  transitions: {
    default: 'all 0.25s ease',
  },
};

export default theme;
