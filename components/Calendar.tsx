"use client";
import { EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import FullCalendar from '@fullcalendar/react';
import { createEvents, EventAttributes } from 'ics';
import { useEffect, useState } from "react";

interface CalendarEvent extends EventInput {
    description?: string;
}

const Calendar: React.FC = () => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    const handleBulkExport = () => {
        if (events.length === 0) {
            alert("No events to export.");
            return;
        }

        const icsEvents: EventAttributes[] = events.map(event => {
            const start = new Date(event.start as string);
            const end = event.end ? new Date(event.end as string) : start;

            return {
                title: event.title,
                start: [start.getFullYear(), start.getMonth() + 1, start.getDate(), start.getHours(), start.getMinutes()],
                end: [end.getFullYear(), end.getMonth() + 1, end.getDate(), end.getHours(), end.getMinutes()],
                description: event.description || '',
            };
        });

        const { error, value } = createEvents(icsEvents);

        if (error) {
            console.error("Error creating .ics file:", error);
            setError("Could not generate the calendar file.");
            return;
        }

        // Create a downloadable blob
        const blob = new Blob([value as string], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'canvas_calendar_export.ics');
        document.body.appendChild(link);
        link.click();

        // Clean up
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (loading) return <div>Loading events...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <div className="flex items-center mb-4 space-x-2">
                <p className="font-semibold">Export all events:</p>
                <button onClick={handleBulkExport} className="px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-600">
                    Export to Calendar (.ics)
                </button>
            </div>
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
