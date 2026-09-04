export const tokens = {
  light: {
    color: {
      background: '#fbf7ef',
      surface: '#ffffff',
      text: '#20272c',
      muted: '#687078',
      accent: '#d8a13a',
      accentText: '#20272c',
      border: 'rgba(216, 161, 58, 0.28)',
    },
    radius: { card: 20, control: 18 },
    shadow: '0 18px 42px rgba(32, 39, 44, 0.08)',
  },
  dark: {
    color: {
      background: '#071421',
      surface: '#101d2a',
      text: '#f8f4ec',
      muted: '#aeb7c0',
      accent: '#d8a13a',
      accentText: '#20272c',
      border: 'rgba(216, 161, 58, 0.42)',
    },
    radius: { card: 20, control: 18 },
    shadow: '0 18px 42px rgba(0, 0, 0, 0.22)',
  },
} as const;
