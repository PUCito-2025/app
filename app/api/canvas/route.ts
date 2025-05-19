// Este archivo corre del lado del servidor (Next 13+ App Router)
export async function GET() {
  const API_URL = "https://canvas.instructure.com/api/v1/courses?enrollment_state=active";
  const TOKEN = process.env.CANVAS_TOKEN;

  const res = await fetch(API_URL, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  });

  if (!res.ok) {
    return new Response(JSON.stringify({ error: "Error al obtener cursos" }), {
      status: res.status,
    });
  }

  const data = await res.json();
  return new Response(JSON.stringify(data));
}
