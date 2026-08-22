/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background:'hsl(var(--background) / <alpha-value>)', foreground:'hsl(var(--foreground) / <alpha-value>)', border:'hsl(var(--border) / <alpha-value>)', input:'hsl(var(--input) / <alpha-value>)', ring:'hsl(var(--ring) / <alpha-value>)', card:'hsl(var(--card) / <alpha-value>)', 'card-foreground':'hsl(var(--card-foreground) / <alpha-value>)', primary:'hsl(var(--primary) / <alpha-value>)', 'primary-foreground':'hsl(var(--primary-foreground) / <alpha-value>)', secondary:'hsl(var(--secondary) / <alpha-value>)', 'secondary-foreground':'hsl(var(--secondary-foreground) / <alpha-value>)', muted:'hsl(var(--muted) / <alpha-value>)', 'muted-foreground':'hsl(var(--muted-foreground) / <alpha-value>)', accent:'hsl(var(--accent) / <alpha-value>)', 'accent-foreground':'hsl(var(--accent-foreground) / <alpha-value>)',
        brand: { 50:'#ECFDF8',100:'#D5F5EC',200:'#AEEAD9',300:'#78D5C0',400:'#43BFA6',500:'#1F9D8B',600:'#178577',700:'#116B61',800:'#0F554E',900:'#0B3F3A' },
        care: { 50:'#ECFDF5',100:'#D1FAE5',400:'#34D399',500:'#10B981',600:'#059669',700:'#047857' },
        ink: { DEFAULT:'#172033',soft:'#41506A',muted:'#69788F',faint:'#9AA7B8' },
        surface: { DEFAULT:'#FFFFFF',muted:'#F8FAFC',sunken:'#F1F5F9',warm:'#F8FAFC' },
        danger:'#D94B4B',warning:'#D69A2D',navy:'#16324F'
      },
      fontFamily:{ display:['Fraunces','Georgia','serif'], sans:['DM Sans','ui-sans-serif','system-ui','sans-serif'], mono:['Space Mono','monospace'] },
      borderRadius:{ xl:'14px','2xl':'20px','3xl':'28px' },
      boxShadow:{ card:'0 1px 2px rgba(22,50,79,.04),0 8px 28px rgba(22,50,79,.06)',lift:'0 18px 45px rgba(22,50,79,.12)',soft:'0 6px 24px rgba(22,50,79,.07)',focus:'0 0 0 4px rgba(36,123,109,.18)' },
      keyframes:{ 'fade-in':{'0%':{opacity:0,transform:'translateY(6px)'},'100%':{opacity:1,transform:'translateY(0)'}},'float-soft':{'0%,100%':{transform:'translateY(0)'},'50%':{transform:'translateY(-5px)'}},'image-in':{'0%':{opacity:0,transform:'scale(1.015)'},'100%':{opacity:1,transform:'scale(1)'}} },
      animation:{'fade-in':'fade-in .3s ease-out','float-soft':'float-soft 4s ease-in-out infinite','image-in':'image-in .55s ease-out'}
    }
  }, plugins:[]
};
