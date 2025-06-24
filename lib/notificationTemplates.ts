// Notification templates (in code, not DB)
export const NotificationTemplates = {
  ASSIGNMENT_DUE_SOON: {
    title: (assignmentTitle: string) => `Assignment Due Soon: ${assignmentTitle}`,
    message: (assignmentTitle: string, courseName: string, days: number) =>
      `Your assignment "${assignmentTitle}" for ${courseName} is due in ${days} day(s).`,
  },
  ASSIGNMENT_OVERDUE: {
    title: (assignmentTitle: string) => `Overdue Assignment: ${assignmentTitle}`,
    message: (assignmentTitle: string, courseName: string) =>
      `Your assignment "${assignmentTitle}" for ${courseName} is overdue.`,
  },
  STUDY_PLAN_REMINDER: {
    title: (courseName: string) => `Study Session Reminder: ${courseName}`,
    message: (courseName: string, hours: number) =>
      `Your scheduled study session for ${courseName} starts in ${hours} hours.`,
  },
  COURSE_UPDATE: {
    title: (courseName: string) => `Course Update: ${courseName}`,
    message: (courseName: string, updateMessage: string) => `${courseName}: ${updateMessage}`,
  },
};
