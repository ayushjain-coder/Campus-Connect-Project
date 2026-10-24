import type { Severity, Ticket } from './types';

export const DEFAULT_SLA_HOURS: Record<Severity, number> = {
  CRITICAL: 0.25, HIGH: 2, MEDIUM: 24, LOW: 120,
};

export function slaDeadline(createdAt: string, severity: Severity, hours = DEFAULT_SLA_HOURS): string {
  return new Date(new Date(createdAt).getTime() + hours[severity] * 3600000).toISOString();
}

export function ticketSla(ticket: Ticket, now = new Date()) {
  const deadline = ticket.slaDeadline || slaDeadline(ticket.createdAt, ticket.severity);
  const remainingMs = new Date(deadline).getTime() - now.getTime();
  const completed = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';
  const effectiveRemaining = completed && ticket.resolvedAt
    ? new Date(deadline).getTime() - new Date(ticket.resolvedAt).getTime()
    : remainingMs;
  return {
    deadline, remainingMs: completed ? 0 : remainingMs,
    breached: effectiveRemaining < 0,
    status: effectiveRemaining < 0 ? 'BREACHED' : completed ? 'MET' : effectiveRemaining <= 0.2 * DEFAULT_SLA_HOURS[ticket.severity] * 3600000 ? 'APPROACHING' : 'ON_TRACK',
  };
}

export function priorityScore(ticket: Ticket, now = new Date()): number {
  const severityPoints: Record<Severity, number> = { LOW: 10, MEDIUM: 30, HIGH: 55, CRITICAL: 80 };
  const ageHours = Math.max(0, (now.getTime() - new Date(ticket.createdAt).getTime()) / 3600000);
  const sla = ticketSla(ticket, now);
  const safety = /fire|smoke|injur|shock|exposed wire|safety|medical|hazard/i.test(`${ticket.complaintText} ${ticket.summary}`);
  return (ticket.isEmergency ? 10000 : 0) + severityPoints[ticket.severity] +
    Math.min(20, Math.floor(ageHours / 6)) + Math.min(30, Math.max(0, (ticket.affectedStudents || 1) - 1) * 3) +
    (safety ? 20 : 0) + (sla.breached ? 40 : sla.status === 'APPROACHING' ? 20 : 0);
}
