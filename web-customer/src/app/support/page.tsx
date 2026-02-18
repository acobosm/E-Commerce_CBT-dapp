import { Mail, MessageSquare, ShieldCheck, HelpCircle } from "lucide-react";

export default function SupportPage() {
    return (
        <div className="container mx-auto px-4 py-20 max-w-4xl">
            <h1 className="text-4xl font-bold mb-4 text-white">Soporte y Ayuda</h1>
            <p className="text-white/50 mb-12">¿Necesitas asistencia con tus transacciones o tienes alguna duda técnica?</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-card rounded-3xl p-8 flex flex-col gap-4">
                    <Mail className="w-8 h-8 text-primary" />
                    <h3 className="text-xl font-bold">Correo Electrónico</h3>
                    <p className="text-sm text-white/60">Contáctanos directamente para temas de facturación o fallos en la Blockchain.</p>
                    <a href="mailto:support@cbt-market.com" className="text-primary font-bold">support@cbt-market.com</a>
                </div>

                <div className="glass-card rounded-3xl p-8 flex flex-col gap-4">
                    <MessageSquare className="w-8 h-8 text-primary" />
                    <h3 className="text-xl font-bold">Comunidad Discord</h3>
                    <p className="text-sm text-white/60">Únete a nuestra comunidad de desarrolladores y usuarios para soporte rápido.</p>
                    <a href="#" className="text-primary font-bold">Unirse al Discord</a>
                </div>

                <div className="glass-card rounded-3xl p-8 flex flex-col gap-4">
                    <ShieldCheck className="w-8 h-8 text-primary" />
                    <h3 className="text-xl font-bold">Seguridad</h3>
                    <p className="text-sm text-white/60">Reporta vulnerabilidades o fallos críticos en nuestros Smart Contracts.</p>
                    <a href="#" className="text-primary font-bold">Reportar Incidente</a>
                </div>

                <div className="glass-card rounded-3xl p-8 flex flex-col gap-4">
                    <HelpCircle className="w-8 h-8 text-primary" />
                    <h3 className="text-xl font-bold">Preguntas Frecuentes</h3>
                    <p className="text-sm text-white/60">Consulta nuestra base de conocimientos para resolver dudas comunes.</p>
                    <a href="#" className="text-primary font-bold">Ir a las FAQs</a>
                </div>
            </div>
        </div>
    );
}
