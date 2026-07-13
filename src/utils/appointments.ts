export type AppointmentLike = {
  id?: number | string;
  doctor_name?: string;
  status?: string;
  created_at?: string;
  appointment_datetime?: string;
  appointment_date?: string;
  appointment_time?: string;
};

export type AppointmentFilter = 'ALL' | 'UPCOMING' | 'CONFIRMED' | 'CANCELLED';

const parseDateTime = (value?: string): number => {
  if (!value) return 0;
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const time = new Date(normalized).getTime();
  return isNaN(time) ? 0 : time;
};

export const getBookingTime = (appt: AppointmentLike): number =>
  parseDateTime(appt.created_at);

export const getAppointmentTime = (appt: AppointmentLike): number => {
  if (appt.appointment_datetime) return parseDateTime(appt.appointment_datetime);
  if (appt.appointment_date) {
    return parseDateTime(`${appt.appointment_date} ${appt.appointment_time || '00:00:00'}`);
  }
  return 0;
};

const FINISHED_STATUSES = ['CANCELLED', 'COMPLETED', 'REJECTED'];

export const isUpcoming = (appt: AppointmentLike): boolean => {
  const status = (appt.status || '').toUpperCase();
  if (FINISHED_STATUSES.includes(status)) return false;
  const apptTime = getAppointmentTime(appt);
  if (!apptTime) return true;
  return apptTime >= Date.now();
};

export const isConfirmed = (appt: AppointmentLike): boolean => {
  const status = (appt.status || '').toUpperCase();
  return status === 'CONFIRMED' || status === 'APPROVED';
};

export const isCancelled = (appt: AppointmentLike): boolean =>
  (appt.status || '').toUpperCase() === 'CANCELLED';

export const sortByLatestBooking = <T extends AppointmentLike>(appts: T[]): T[] =>
  [...appts].sort((a, b) => getBookingTime(b) - getBookingTime(a));

export const filterAppointments = <T extends AppointmentLike>(
  appts: T[],
  filter: AppointmentFilter
): T[] => {
  switch (filter) {
    case 'UPCOMING':
      return appts.filter(isUpcoming);
    case 'CONFIRMED':
      return appts.filter(isConfirmed);
    case 'CANCELLED':
      return appts.filter(isCancelled);
    case 'ALL':
    default:
      return appts;
  }
};
