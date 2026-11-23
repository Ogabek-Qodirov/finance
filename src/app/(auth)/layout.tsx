import { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-cream">
      {/* Chap tomondagi retro-modern panel - faqat katta ekranlarda */}
      <div className="hidden lg:flex lg:w-1/2 bg-forest flex-col justify-between p-12 relative overflow-hidden select-none">
        {/* Bezakli retro shakllar */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-mustard/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-tomato/10 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-mustard rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-forest font-bold text-base font-display">M</span>
            </div>
            <span className="font-display text-cream text-2xl font-bold tracking-tight">Moliya</span>
          </div>
          <p className="text-cream/60 text-xs font-medium uppercase tracking-wider">
            O'zbekiston Shaxsiy Moliya Boshqaruvi
          </p>
        </div>

        <div className="relative z-10 space-y-6 my-auto">
          <h1 className="font-display text-5xl font-black text-cream leading-[1.15]">
            Moliyangizni<br />
            <span className="text-mustard">aniq va erkin</span><br />
            boshqaring
          </h1>
          <p className="text-cream/80 text-base max-w-md leading-relaxed">
            Kundalik xarajatlar, oylik daromadlar va budjetingizni yagona joyda kuzatib boring. Moliyaviy rejalaringizni aniq ko'ring.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4">
          <div className="bg-cream/10 backdrop-blur-sm rounded-2xl p-4 border border-cream/10">
            <div className="font-display text-2xl font-bold text-mustard">100%</div>
            <div className="text-cream/70 text-xs mt-1 font-medium">Shaxsiy va xavfsiz</div>
          </div>
          <div className="bg-cream/10 backdrop-blur-sm rounded-2xl p-4 border border-cream/10">
            <div className="font-display text-2xl font-bold text-mustard">UZS</div>
            <div className="text-cream/70 text-xs mt-1 font-medium">Milliy valyuta qulayligi</div>
          </div>
        </div>
      </div>

      {/* O'ng tomondagi forma paneli */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Mobil qurilmalar uchun logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-forest rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-cream font-bold text-sm font-display">M</span>
            </div>
            <span className="font-display text-forest text-xl font-bold">Moliya</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
