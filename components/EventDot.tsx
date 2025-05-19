type Evento = {
  id: number;
  title: string;
  start_at: string;
  context_name: string;
};

export default function EventDot({ date, events }: { date: Date; events: Evento[] }) {
  const hasEvent = events.some((ev) => new Date(ev.start_at).toDateString() === date.toDateString());

  return hasEvent ? <div className="mt-1 text-center text-xs text-red-500">●</div> : null;
}
