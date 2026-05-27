export enum UserRole {
  Student = "student",
  Teacher = "teacher",
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  rollNo?: string;
  avatarColor: string;
  role: "Student" | "Project Leader" | "Teacher";
}

export type TaskStatus = "Todo" | "In_Progress" | "Review" | "Completed";

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assignedTo: string; // TeamMember id
  status: TaskStatus;
  priority: "Low" | "Medium" | "High";
  dueDate: string;
  progressPercentage: number; // 0 to 100
  weight: number; // impact weight on overall program (e.g. 1 to 5)
  hoursLogged: number;
  attachments?: string[]; // list of names of files uploaded
}

export interface Project {
  id: string;
  title: string;
  description: string;
  leaderId: string;
  teamMembers: string[]; // TeamMember ids
  startDate: string;
  endDate: string;
  status: "Planning" | "In_Progress" | "Under_Review" | "Completed";
  category: string;
}

export interface ProjectFeedback {
  id: string;
  projectId: string;
  teacherName: string;
  teacherId: string;
  comment: string;
  rating: number; // 1-5 stars
  timestamp: string;
}

export interface AttachedFile {
  id: string;
  taskId?: string;
  projectId: string;
  name: string;
  size: string;
  uploadedBy: string; // TeamMember name
  timestamp: string;
}

export interface ActivityLog {
  id: string;
  userName: string;
  action: string;
  projectName: string;
  timestamp: string;
  type: "task" | "status" | "comment" | "upload" | "project";
}
