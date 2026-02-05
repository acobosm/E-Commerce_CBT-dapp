import PurchaseCard from "@/components/PurchaseCard";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-mesh flex flex-col items-center py-12 px-4 gap-12 overflow-y-auto">
      <div className="text-center animate-in fade-in slide-in-from-top duration-700">
        <h2 className="text-blue-500 font-mono tracking-widest uppercase text-sm mb-2">CBT Stablecoin App</h2>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Portal de Compra de CBTokens</h1>
      </div>

      <div className="flex-1 flex items-center justify-center w-full">
        <PurchaseCard />
      </div>

      <footer className="text-slate-500 text-sm py-4">
        Powered by CBT - Blockchain E-Commerce Project &copy; 2026
      </footer>
    </main>
  );
}
