export default function Footer() {
  return (
    <footer className="bg-blue-950 px-6 py-6 text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 text-xs md:grid-cols-4">
        <div>
          <h3 className="mb-2 font-bold">PUCito</h3>
          <p>Your trusted platform for studying across Canvas.</p>
          <div className="mt-3 flex gap-3">
            <div className="h-5 w-5 rounded-full bg-white" />
            <div className="h-5 w-5 rounded-full bg-white" />
            <div className="h-5 w-5 rounded-full bg-white" />
          </div>
        </div>
        <div>
          <h4 className="mb-2 font-semibold">Support</h4>
          <ul className="space-y-1">
            <li>Help Center</li>
            <li>Contact Us</li>
            <li>Privacy Policy</li>
            <li>Terms of Service</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-2 font-semibold">Connect</h4>
          <ul className="space-y-1">
            <li>Instagram</li>
            <li>Facebook</li>
            <li>Twitter</li>
          </ul>
        </div>
      </div>
      <div className="mt-4 text-center text-xs opacity-70">© 2025 PUCito. Todos los derechos reservados.</div>
    </footer>
  );
}
