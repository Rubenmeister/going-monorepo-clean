export const metadata = {
  title: 'Going Platform - Documentación Completa',
  description: 'Documentación completa de la plataforma Going',
};

export default function DocumentationPage() {
  return (
    <div className="w-full h-screen">
      <iframe
        src="/DOCUMENTACION_COMPLETA.html"
        className="w-full h-full border-none"
        title="Documentación Completa"
      />
    </div>
  );
}
