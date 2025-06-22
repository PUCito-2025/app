import Calendar from "@/components/Calendar"; // Asegúrate de que la ruta sea correcta
import Footer from "@/components/Footer";

export default function BrowsePage() {
    return (
        <div className="flex min-h-screen flex-col">
            <div className="flex-grow px-4 py-6 lg:px-10">
                <div className="mt-6 flex gap-6">

                    <main className="flex-1">
                        <Calendar />

                    </main>
                </div>
            </div>
            <Footer />
        </div>
    );
}
