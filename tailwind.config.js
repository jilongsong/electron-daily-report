module.exports = {
  content: [
    './src/renderer/index.html',
    './src/renderer/src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      backgroundImage: {
        'wavy-lines': "url('/src/renderer/src/assets/wavy-lines.svg')"
      },
      colors: {
        background: '#0f172a',
        surface: '#111827',
        primary: '#2563eb',
        accent: '#8b5cf6'
      }
    },
    fontFamily: {
      sans: ['Inter', 'sans-serif']
    }
  },
  plugins: []
}
