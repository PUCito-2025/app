import { NextRequest, NextResponse } from 'next/server';

const CANVAS_API_URL = 'https://cursos.canvas.uc.cl/api/v1';
const token = process.env.CANVAS_TOKEN;
export async function GET(req: NextRequest) {
    if (!token) {
        return NextResponse.json({ error: 'Missing Authorization token' }, { status: 401 });
    }
    console.log("Canvas Token:", token); // Debugging line to check if token is available
    // 1. Obtener cursos
    const coursesRes = await fetch(`${CANVAS_API_URL}/courses`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!coursesRes.ok) {
        return NextResponse.json({ error: 'Failed to fetch courses' }, { status: coursesRes.status });
    }

    const courses = await coursesRes.json();

    // 2. Filtrar cursos activos del semestre actual
    const contextCodes = courses
        .filter((course: any) =>
            course.workflow_state === 'available' &&
            course.enrollments?.some((e: any) => e.enrollment_state === 'active' && e.type === 'student')
        )
        .map((course: any) => `course_${course.id}`);

    if (contextCodes.length === 0) {
        return NextResponse.json([], { status: 200 });
    }

    // 3. Calcular fechas dinámicamente
    const now = new Date();
    const startDate = now.toISOString().split('T')[0]; // YYYY-MM-DD

    const endDateObj = new Date();
    endDateObj.setMonth(endDateObj.getMonth() + 3);
    const endDate = endDateObj.toISOString().split('T')[0];

    // 4. Preparar parámetros de la solicitud
    const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        type: 'assignment',
        per_page: '50',
    });

    contextCodes.forEach((code: string) => params.append('context_codes[]', code));

    const eventsUrl = `${CANVAS_API_URL}/calendar_events?${params.toString()}`;

    const eventsRes = await fetch(eventsUrl, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!eventsRes.ok) {
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: eventsRes.status });
    }

    const events = await eventsRes.json();

    // 5. Filtrar assignments activos (lock_at en el futuro o indefinido)
    const activeAssignments = events.filter((event: any) => {
        if (event.type !== 'assignment') return false;

        const lockAt = event.assignment?.lock_at
            ? new Date(event.assignment.lock_at)
            : null;

        return !lockAt || lockAt > now;
    });

    const formatted = activeAssignments.map((event: any) => {
        let start = event.assignment?.due_at || event.start_at;
        let end = event.assignment?.lock_at || event.end_at;
        let start_edited = new Date(new Date(start).getTime() - 60 * 1000).toISOString();
        // If end is the same as start, add 1 minute
        if (end === start) {
            start = start_edited;
        }
        return {
            id: event.id,
            title: event.title,
            start: start_edited || start,
            ...(end && end !== start ? { end } : {}),
            description: event.assignment?.description || event.description || '',
            url: event.html_url,
        };
    });

    return NextResponse.json(formatted);
}
