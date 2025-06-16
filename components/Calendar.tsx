"use client";
import { EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import FullCalendar from '@fullcalendar/react';
import { useEffect, useState } from "react";

const Calendar: React.FC = () => {
    const [events, setEvents] = useState<EventInput[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const token = process.env.CANVAS_TOKEN;
    console.log("Canvas Token (from calendar):", token);
    useEffect(() => {
        fetch("/api/calendar-events")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setEvents(data);
                } else {
                    setError(data.error || "Unknown error");
                }
                setLoading(false);
            })
            .catch(err => {
                setError("Failed to fetch events");
                setLoading(false);
            });
    }, []);

    if (loading) return <div>Loading events...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <FullCalendar
                plugins={[dayGridPlugin]}
                initialView="dayGridMonth"
                events={events}
                height="auto"
            />
        </div>
    );
};

export default Calendar;
