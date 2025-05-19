import { formatISO } from "date-fns";

export async function GET() {
  const TOKEN = process.env.CANVAS_TOKEN;
  const today = new Date();
  const end = new Date();
  end.setDate(today.getDate() + 14);

  const startDate = formatISO(today);
  const endDate = formatISO(end);

  const res = await fetch(
    `https://canvas.instructure.com/api/v1/calendar_events?type=assignment&start_date=${startDate}&end_date=${endDate}`,
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    },
  );

  if (!res.ok) {
    return new Response(JSON.stringify({ error: "Error al obtener eventos" }), { status: res.status });
  }

  const data = await res.json();
  return new Response(JSON.stringify(data));
}
