/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F172A', // Bleu Nuit (Navy)
          dark: '#020617',    // Bleu très foncé pour les survols/fond
        },
        accent: '#D4AF37',    // Or Doux (Gold)
        gray: {
          '50': '#F8FAFC',    // Blanc cassé premium
          '100': '#F1F5F9',
          '200': '#E2E8F0',
          '700': '#64748B',   // Gris ardoise pour textes secondaires
          '800': '#1E293B',   // Gris foncé pour badges/footer
          '900': '#0F172A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(15, 23, 42, 0.08)',
        'glow': '0 0 15px rgba(212, 175, 55, 0.3)',
      }
    },
  },
  plugins: [],
}