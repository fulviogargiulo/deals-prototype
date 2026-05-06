import { format } from "date-fns";

interface AddToCalendarOptions {
  title: string;
  startDate: Date;
  durationInMinutes: number;
  description?: string;
  location?: string;
}

/**
 * Reusable function to add an event to the user's calendar.
 * On the web, it opens Google Calendar with pre-filled event details.
 * (On native iOS/Android via Capacitor, this could try the native calendar first.)
 */
export const addToCalendar = (options: AddToCalendarOptions): void => {
  const { title, startDate, durationInMinutes, description, location } = options;

  const endDate = new Date(startDate.getTime() + durationInMinutes * 60 * 1000);

  const formatForCalendar = (date: Date) => format(date, "yyyyMMdd'T'HHmmss");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${formatForCalendar(startDate)}/${formatForCalendar(endDate)}`,
  });

  if (description) params.set("details", description);
  if (location) params.set("location", location);

  const googleCalendarUrl = `https://calendar.google.com/calendar/render?${params.toString()}`;
  window.open(googleCalendarUrl, "_blank");
};
