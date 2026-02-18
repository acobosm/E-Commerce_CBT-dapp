export default function PrivacyPage() {
    return (
        <div className="container mx-auto px-4 py-20 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8 text-white">Política de Privacidad</h1>
            <div className="prose prose-invert max-w-none text-white/70 flex flex-col gap-6">
                <p>En CBT Market, la privacidad de tus datos es nuestra prioridad, reforzada por la transparencia de la Blockchain.</p>
                <section>
                    <h2 className="text-xl font-bold text-white mb-2">1. Datos Recolectados</h2>
                    <p>Solo almacenamos en la Blockchain los datos necesarios para la facturación legal (Nombre, ID, Dirección) solicitados en el formulario de registro.</p>
                </section>
                <section>
                    <h2 className="text-xl font-bold text-white mb-2">2. Transparencia</h2>
                    <p>Tu dirección de wallet y las transacciones realizadas son públicas en el explorador de bloques, pero tu identidad legal solo es accesible por los comercios a los que compras para fines de facturación.</p>
                </section>
                <section>
                    <h2 className="text-xl font-bold text-white mb-2">3. Seguridad</h2>
                    <p>No almacenamos contraseñas; el acceso se realiza exclusivamente mediante firmas criptográficas de tu wallet (MetaMask).</p>
                </section>
            </div>
        </div>
    );
}
