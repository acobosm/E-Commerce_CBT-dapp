import PaymentProcessor from "@/components/PaymentProcessor";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-mesh flex flex-col items-center py-12 px-4 gap-12 overflow-y-auto">
      <div className="text-center animate-in fade-in slide-in-from-top duration-700 flex flex-col items-center">
        <div className="relative h-16 w-48 flex items-center justify-center mb-4">
          <Image
            src="/logo-cbt.png"
            alt="CBT Logo"
            width={192}
            height={64}
            className="object-contain"
            priority
          />
        </div>
        <h2 className="text-blue-500 font-mono tracking-[0.2em] uppercase text-lg font-bold mb-2">CBT Market | Payments Gateway</h2>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-white uppercase italic">Procesador de Pago Seguro</h1>
      </div>

      <div className="flex-1 flex items-center justify-center w-full">
        <PaymentProcessor />
      </div>

      <footer className="text-slate-500 text-sm py-4">
        Powered by CBT - Blockchain E-Commerce Project &copy; 2026
      </footer>
    </main>
  );
}
