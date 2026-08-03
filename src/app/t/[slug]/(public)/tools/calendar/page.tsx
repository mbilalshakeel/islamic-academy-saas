"use client";

import { useEffect, useState } from "react";
import moment from "moment-hijri";
import { EmptyState } from "@/components/ui";

type CalendarEvent = {
  id: string;
  hijri_month: number;
  hijri_day: number;
  title: string;
  description: string | null;
};

const HIJRI_MONTHS = [
  "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani", "Jumada al-Awwal", "Jumada al-Thani",
  "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhul-Qadah", "Dhul-Hijjah",
];

export default function IslamicCalendarPage({ params }: { params: { slug: string } }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const today = moment();
  const todayHijri = { month: today.iMonth() + 1, day: today.iDate(), year: today.iYear() };

  useEffect(() => {
    fetch(`/api/public/calendar-events?slug=${params.slug}`)
      .then((r) => r.json())
      .then((body) => setEvents(body.items ?? []));
  }, [params.slug]);

  function nextGregorianDateFor(event: CalendarEvent) {
    let candidateYear = todayHijri.year;
    let candidate = moment(`${candidateYear}-${event.hijri_month}-${event.hijri_day}`, "iYYYY-iM-iD");

    if (candidate.isBefore(today, "day")) {
      candidateYear += 1;
      candidate = moment(`${candidateYear}-${event.hijri_month}-${event.hijri_day}`, "iYYYY-iM-iD");
    }
    return candidate;
  }

  const withDates = events
    .map((e) => ({ ...e, gregorian: nextGregorianDateFor(e) }))
    .sort((a, b) => a.gregorian.valueOf() - b.gregorian.valueOf());

  return (
    <div className="max-w-lg mx-auto px-4 py-6 md:py-8 space-y-5">
      <div
        className="rounded-2xl p-6 text-center relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, var(--tenant-primary), var(--tenant-secondary))`, boxShadow: "var(--shadow-md)" }}
      >
        <div className="ds-motif-bg" />
        <div
          className="rounded-2xl flex items-center justify-center mx-auto relative"
          style={{ width: 64, height: 64, background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)", fontSize: 30, marginBottom: "var(--sp-3)" }}
        >
          🗓️
        </div>
        <h1 className="tenant-on-primary ds-h2 relative" style={{ marginBottom: "var(--sp-3)" }}>
          Islamic Calendar
        </h1>
        <p className="tenant-on-primary relative" style={{ opacity: 0.75, fontSize: "var(--fs-caption)" }}>
          Today
        </p>
        <p className="tenant-on-primary relative ds-h1 relative" style={{ margin: "2px 0" }}>
          {todayHijri.day} {HIJRI_MONTHS[todayHijri.month - 1]} {todayHijri.year} AH
        </p>
        <p className="tenant-on-primary relative" style={{ opacity: 0.75, fontSize: "var(--fs-caption)" }}>
          {today.format("dddd, MMMM D, YYYY")}
        </p>
      </div>

      <h2 className="ds-h3">Upcoming Events</h2>
      <div className="space-y-2.5">
        {withDates.map((e) => (
          <div key={e.id} className="ds-card flex items-center justify-between">
            <div>
              <p className="font-semibold" style={{ fontSize: "var(--fs-body)" }}>
                {e.title}
              </p>
              <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-tertiary)" }}>
                {e.hijri_day} {HIJRI_MONTHS[e.hijri_month - 1]} · {e.gregorian.format("MMM D, YYYY")}
              </p>
              {e.description && (
                <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-secondary)", marginTop: 4 }}>{e.description}</p>
              )}
            </div>
            <span className="tenant-primary-text font-bold flex-shrink-0" style={{ fontSize: "var(--fs-caption)", marginLeft: 8 }}>
              {e.gregorian.diff(today, "days")}d
            </span>
          </div>
        ))}

        {withDates.length === 0 && <EmptyState icon="🗓️" title="No events have been added yet" />}
      </div>
    </div>
  );
}
