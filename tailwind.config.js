module.exports = {
  content: [
    './src/renderer/index.html',
    './src/renderer/src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      backgroundImage: {
        'wavy-lines': "url('/src/renderer/src/assets/wavy-lines.svg')"
      }
    }
  },
  plugins: []
}
