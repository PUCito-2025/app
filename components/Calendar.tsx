"use client";

import { useUser } from "@clerk/nextjs";
import { EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from '@fullcalendar/react';
import { createClient } from "@supabase/supabase-js";
import { createEvents, EventAttributes } from 'ics';
import { useEffect, useState } from "react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CalendarEvent extends EventInput {
    description?: string;
    deletable?: boolean;
    db_id?: number;
    source?: 'Assignment' | 'StudyPlan' | 'Canvas';
}

const AddAssignmentModal = ({ isOpen, onClose, onSave, courses, defaultDate }: { isOpen: boolean, onClose: () => void, onSave: (data: any) => void, courses: any[], defaultDate: string | null }) => {
    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        onSave({
            title: formData.get('title'),
            courseId: formData.get('courseId'),
            dueDate: defaultDate,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 backdrop-blur-sm">
            <div className="relative w-full max-w-md p-6 bg-white rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">&times;</button>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Add New Assignment</h3>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input type="text" name="title" id="title" required className="w-full px-3 py-2 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                            <select name="courseId" id="courseId" required className="w-full px-3 py-2 text-gray-800 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Select a course</option>
                                {courses.map(course => (
                                    <option key={course.id} value={course.id}>{course.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                            <input type="text" value={new Date(defaultDate!).toLocaleDateString()} disabled className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg" />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none">Save Assignment</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ViewEventModal = ({ isOpen, onClose, event, onDelete, onEdit }: { isOpen: boolean, onClose: () => void, event: any, onDelete: (event: any) => void, onEdit: (event: any) => void }) => {
    if (!isOpen || !event) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 backdrop-blur-sm">
            <div className="relative w-full max-w-md p-6 bg-white rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">&times;</button>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{event.title}</h3>
                <p className="text-sm text-gray-600 mb-4" dangerouslySetInnerHTML={{ __html: event.extendedProps.description || "No description available." }}></p>
                <div className="mt-6 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none">Close</button>
                    <button type="button" onClick={() => onEdit(event)} className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 rounded-lg hover:bg-yellow-600 focus:outline-none">Edit</button>
                    <button type="button" onClick={() => onDelete(event)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none">Delete</button>
                </div>
            </div>
        </div>
    );
};


const EditEventModal = ({ isOpen, onClose, onSave, event, courses }: { isOpen: boolean, onClose: () => void, onSave: (data: any) => void, event: any, courses: any[] }) => {
    if (!isOpen || !event) return null;

    const [formData, setFormData] = useState({
        title: event.extendedProps.source === 'Assignment' ? event.title.split(' (')[0] : '',
        courseId: event.extendedProps.courseId,
        studiedHours: event.extendedProps.source === 'StudyPlan' ? event.title.match(/(\d+)\//)?.[1] || '' : '',
        recommendedHours: event.extendedProps.source === 'StudyPlan' ? event.title.match(/\/(\d+)/)?.[1] || '' : '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSave(formData);
    };

    const isStudyPlan = event.extendedProps.source === 'StudyPlan';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 backdrop-blur-sm">
            <div className="relative w-full max-w-md p-6 bg-white rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">&times;</button>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Edit Event</h3>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {isStudyPlan ? (
                            <>
                                <div>
                                    <label htmlFor="studiedHours" className="block text-sm font-medium text-gray-700 mb-1">Studied Hours</label>
                                    <input type="number" name="studiedHours" id="studiedHours" value={formData.studiedHours} onChange={handleChange} required className="w-full px-3 py-2 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label htmlFor="recommendedHours" className="block text-sm font-medium text-gray-700 mb-1">Recommended Hours</label>
                                    <input type="number" name="recommendedHours" id="recommendedHours" value={formData.recommendedHours} onChange={handleChange} required className="w-full px-3 py-2 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </>
                        ) : (
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="w-full px-3 py-2 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                        )}
                         <div>
                            <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                            <select name="courseId" id="courseId" value={formData.courseId} onChange={handleChange} required className="w-full px-3 py-2 text-gray-800 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                {courses.map(course => (
                                    <option key={course.id} value={course.id}>{course.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const Calendar: React.FC = () => {
    const { user } = useUser();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [courses, setCourses] = useState<{ id: number, name: string }[]>([]);
    const [isViewModalOpen, setViewModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [eventToEdit, setEventToEdit] = useState<any | null>(null);


    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchAllEvents = async () => {
            setLoading(true);
            setError(null);
            try {
                const [canvasEventsRes, assignmentsRes, studyPlansRes, coursesRes] = await Promise.all([
                    fetch("/api/calendar-events"),
                    supabase.from('Assignment').select('*'),
                    supabase.from('StudyPlan').select('*, courseId:Course(id, name)').eq('userId', user.id),
                    supabase.from('Course').select('id, name')
                ]);

                if (!canvasEventsRes.ok) {
                    throw new Error(`Canvas API failed with status ${canvasEventsRes.status}`);
                }
                const canvasData = await canvasEventsRes.json();

                const courseMap = new Map(coursesRes.data?.map(course => [course.id, course.name]) || []);
                setCourses(coursesRes.data || []);

                // Process Canvas Events (RED)
                const canvasEvents: CalendarEvent[] = Array.isArray(canvasData) ? canvasData.map((e: any) => ({
                    ...e,
                    color: '#c0392b ',
                    allDay: true,
                    deletable: false,
                    source: 'Canvas'
                })) : [];

                // Process Assignment Events (BLUE)
                const assignmentEvents: CalendarEvent[] = (assignmentsRes.data || []).map((a: any) => ({
                    id: `db-assign-${a.id}`,
                    title: `${a.title} (${courseMap.get(a.courseId) || 'Course'})`,
                    start: a.dueDate,
                    allDay: true,
                    color: '#2980b9 ',
                    description: `Assignment: ${a.title}`,
                    deletable: true,
                    db_id: a.id,
                    courseId: a.courseId,
                    source: 'Assignment'
                }));

                // Process Study Plan Events (GREEN)
                const studyPlanEvents: CalendarEvent[] = (studyPlansRes.data || []).map((p: any) => ({
                    id: `db-plan-${p.id}`,
                    title: `Study: ${p.studiedHours}/${p.recommendedHours} hrs (${p.courseId.name || 'Course'})`,
                    start: p.planDate,
                    allDay: true,
                    color: '#1abc9c',
                    description: `Planned to study for ${p.studiedHours} hour(s). Recommended: ${p.recommendedHours} hours.`,
                    deletable: true,
                    db_id: p.id,
                    courseId: p.courseId.id,
                    source: 'StudyPlan'
                }));

                setEvents([...canvasEvents, ...assignmentEvents, ...studyPlanEvents]);

            } catch (err: any) {
                setError(`Failed to fetch events: ${err.message}`);
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllEvents();
    }, [user]);

    const handleDateClick = (arg: { dateStr: string }) => {
        setSelectedDate(arg.dateStr);
        setAddModalOpen(true);
    };

    const handleEventClick = (clickInfo: any) => {
        if (clickInfo.event.extendedProps.deletable) {
            setSelectedEvent(clickInfo.event);
            setViewModalOpen(true);
        }
    };

    const handleSaveAssignment = async (newAssignment: { title: string, courseId: string, dueDate: string }) => {
        const { data, error } = await supabase
            .from('Assignment')
            .insert({
                title: newAssignment.title,
                courseId: parseInt(newAssignment.courseId, 10),
                dueDate: newAssignment.dueDate,
            })
            .select()
            .single();

        if (error) {
            setError(`Error saving assignment: ${error.message}`);
        } else if (data) {
            const courseName = courses.find(c => c.id === data.courseId)?.name || 'Course';
            setEvents(prevEvents => [
                ...prevEvents,
                {
                    id: `db-assign-${data.id}`,
                    title: `${data.title} (${courseName})`,
                    start: data.dueDate,
                    allDay: true,
                    color: '#2980b9',
                    deletable: true,
                    db_id: data.id,
                    courseId: data.courseId,
                    source: 'Assignment'
                }
            ]);
            setAddModalOpen(false);
        }
    };

    const handleDeleteEvent = async (eventToDelete: any) => {
        const { db_id, source } = eventToDelete.extendedProps;

        if (!confirm(`Are you sure you want to delete "${eventToDelete.title}"?`)) {
            return;
        }

        const { error } = await supabase.from(source).delete().eq('id', db_id);

        if (error) {
            setError(`Error deleting event: ${error.message}`);
        } else {
            setEvents(prevEvents => prevEvents.filter(event => event.id !== eventToDelete.id));
            setViewModalOpen(false);
        }
    };

    const handleEditEvent = (event: any) => {
        setViewModalOpen(false);
        setEventToEdit(event);
        setEditModalOpen(true);
    };

    const handleUpdateEvent = async (updatedData: any) => {
        const { db_id, source } = eventToEdit.extendedProps;
        let updatePayload = {};
        let newTitle = '';

        if (source === 'Assignment') {
            updatePayload = { title: updatedData.title, courseId: updatedData.courseId };
            const courseName = courses.find(c => c.id === parseInt(updatedData.courseId, 10))?.name || 'Course';
            newTitle = `${updatedData.title} (${courseName})`;
        } else if (source === 'StudyPlan') {
            updatePayload = {
                studiedHours: updatedData.studiedHours,
                recommendedHours: updatedData.recommendedHours,
                courseId: updatedData.courseId
            };
            const courseName = courses.find(c => c.id === parseInt(updatedData.courseId, 10))?.name || 'Course';
            newTitle = `Study: ${updatedData.studiedHours}/${updatedData.recommendedHours} hrs (${courseName})`;
        }

        const { data, error } = await supabase.from(source).update(updatePayload).eq('id', db_id).select().single();

        if (error) {
            setError(`Error updating event: ${error.message}`);
        } else {
            setEvents(prevEvents => prevEvents.map(event => {
                if (event.id === eventToEdit.id) {
                    return { ...event, title: newTitle, extendedProps: { ...event.extendedProps, courseId: data.courseId } };
                }
                return event;
            }));
            setEditModalOpen(false);
        }
    };


    const handleBulkExport = () => {
        if (events.length === 0) {
            alert("No events to export.");
            return;
        }

        const icsEvents: EventAttributes[] = events.map(event => {
            const start = new Date(event.start as string);
            // For all-day events, the end can be the same as the start (for .ics)
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
        <>
            <AddAssignmentModal
                isOpen={isAddModalOpen}
                onClose={() => setAddModalOpen(false)}
                onSave={handleSaveAssignment}
                courses={courses}
                defaultDate={selectedDate}
            />
            <ViewEventModal
                isOpen={isViewModalOpen}
                onClose={() => setViewModalOpen(false)}
                event={selectedEvent}
                onDelete={handleDeleteEvent}
                onEdit={handleEditEvent}
            />
            <EditEventModal
                isOpen={isEditModalOpen}
                onClose={() => setEditModalOpen(false)}
                onSave={handleUpdateEvent}
                event={eventToEdit}
                courses={courses}
            />
            <div className="p-4 bg-white rounded-lg shadow">
                <div className="flex items-center mb-4 space-x-2">
                    <p className="font-semibold">Export all events:</p>
                    <button onClick={handleBulkExport} className="px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-600">
                        Export to Calendar (.ics)
                    </button>
                </div>
                <FullCalendar
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    events={events}
                    height="auto"
                    dateClick={handleDateClick}
                    eventClick={handleEventClick}
                />
            </div>
        </>
    );
};

export default Calendar;
