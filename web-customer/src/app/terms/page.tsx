export default function TermsPage() {
    return (
        <div className="container mx-auto px-4 py-20 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8 text-white">Términos y Condiciones</h1>
            <div className="prose prose-invert max-w-none text-white/70 flex flex-col gap-6">
                <p>Bienvenido a CBT Market. Al usar nuestra plataforma descentralizada, aceptas los siguientes términos:</p>
                <section>
                    <h2 className="text-xl font-bold text-white mb-2">1. Uso de la Blockchain</h2>
                    <p>Todas las transacciones son finales y se ejecutan en la red Ethereum (Anvil/Local). No nos hacemos responsables de pérdidas por errores en el manejo de llaves privadas.</p>
                </section>
                <section>
                    <h2 className="text-xl font-bold text-white mb-2">2. Propiedad de Tokens</h2>
                    <p>Los CBTokens (CBT) son activos digitales utilizados exclusivamente dentro del ecosistema CBT para la adquisición de bienes y servicios.</p>
                </section>
                <section>
                    <h2 className="text-xl font-bold text-white mb-2">3. Responsabilidad</h2>
                    <p>CBT Market actúa como el intermediario tecnológico Smart Contract que garantiza el intercambio atómico de activos.</p>
                </section>
            </div>
        </div>
    );
}
