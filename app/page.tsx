import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-blue-50">
      <div className="flex flex-grow items-center justify-center px-4 py-0 text-center">
        <div>
          <h1 className="text-2xl font-bold text-blue-900 md:text-4xl">
            PUCito: La nueva forma de organizar tu estudio
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-gray-700 md:text-base">
            Conecta tu Canvas, registra tus horas de estudio y sigue tu progreso académico como nunca antes.
          </p>
          <div className="mt-4 flex flex-col justify-center gap-4 sm:flex-row">
            <a href="/canvasInfo" className="rounded-xl bg-blue-600 px-6 py-3 text-white shadow-md hover:bg-blue-700">
              Ver mis Cursos
            </a>
            <a href="/tracker" className="rounded-xl border border-blue-600 px-6 py-3 text-blue-600 hover:bg-blue-100">
              Ir al Planificador
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
