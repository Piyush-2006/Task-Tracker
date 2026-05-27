import { TeamMember, Project, Task, ProjectFeedback, ActivityLog, AttachedFile } from "./types";

export const initialTeamMembers: TeamMember[] = [
  {
    id: "piyush",
    name: "Piyush Kumar",
    email: "piyushorps2006@gmail.com",
    rollNo: "24SCSE1011468",
    avatarColor: "from-blue-500 to-indigo-600",
    role: "Student",
  },
  {
    id: "najmuddin",
    name: "Najmuddin Ahmad",
    email: "najmuddin.ahmad@university.edu",
    rollNo: "23SCSE1011445",
    avatarColor: "from-amber-500 to-orange-500",
    role: "Student",
  },
  {
    id: "anurag",
    name: "Anurag Kashyap",
    email: "anurag.kashyap@university.edu",
    rollNo: "23SCSE1012308",
    avatarColor: "from-emerald-500 to-teal-500",
    role: "Student",
  },
  {
    id: "teacher_anita",
    name: "Prof. Anita Sharma",
    email: "anita.sharma@university.edu",
    avatarColor: "from-rose-500 to-purple-600",
    role: "Teacher",
  }
];

export const initialProjects: Project[] = [
  {
    id: "proj_tracker",
    title: "Student Task & Project Tracker",
    description: "A centralized, web-based platform for managing student academic projects. Combines task allocation, automatic progress calculation, individual contribution charts, and real-time teacher evaluation matrices to solve college teamwork imbalances.",
    leaderId: "piyush",
    teamMembers: ["piyush", "najmuddin", "anurag"],
    startDate: "2026-05-10",
    endDate: "2026-06-25",
    status: "In_Progress",
    category: "Software Engineering Capstone"
  },
  {
    id: "proj_attendance",
    title: "EcoSmart Campus Waste System",
    description: "An IoT and React-based routing application to optimize regional campus waste collection based on load sensors. Ensures bin locations maintain eco-limits.",
    leaderId: "najmuddin",
    teamMembers: ["najmuddin", "anurag"],
    startDate: "2026-04-12",
    endDate: "2026-05-30",
    status: "In_Progress",
    category: "IoT & Hardware Concepts"
  }
];

export const initialTasks: Task[] = [
  {
    id: "task_1",
    projectId: "proj_tracker",
    title: "UI Theme & CSS Setup",
    description: "Develop a premium, interactive dashboard layout matching Tailwind specifications. Implement dark-accent cards and fluid sidebar transitions.",
    assignedTo: "piyush",
    status: "Completed",
    priority: "High",
    dueDate: "2026-05-18",
    progressPercentage: 100,
    weight: 3,
    hoursLogged: 12,
    attachments: ["UI_Colors_Draft.png"]
  },
  {
    id: "task_2",
    projectId: "proj_tracker",
    title: "Feasibility Analysis Documentation",
    description: "Synthesize operational, schedule, technical, economic, and legal feasibility profiles into a multi-page structured review. (Completed for LAB 3).",
    assignedTo: "anurag",
    status: "Completed",
    priority: "High",
    dueDate: "2026-05-24",
    progressPercentage: 100,
    weight: 4,
    hoursLogged: 16,
    attachments: ["Feasibility_Report_V1.pdf"]
  },
  {
    id: "task_3",
    projectId: "proj_tracker",
    title: "Dynamic Google Authorization Integration",
    description: "Implement interactive login mechanics including Google Popups, recovery codes with animated mock validation screens, and password forget flows.",
    assignedTo: "piyush",
    status: "In_Progress",
    priority: "High",
    dueDate: "2026-05-30",
    progressPercentage: 60,
    weight: 5,
    hoursLogged: 20
  },
  {
    id: "task_4",
    projectId: "proj_tracker",
    title: "Task CRUD & Contribution Calculations",
    description: "Build robust state management for adding tasks, calculating overall project metrics dynamically, and rendering personal breakdown indicators.",
    assignedTo: "najmuddin",
    status: "In_Progress",
    priority: "High",
    dueDate: "2026-05-28",
    progressPercentage: 75,
    weight: 4,
    hoursLogged: 15
  },
  {
    id: "task_5",
    projectId: "proj_tracker",
    title: "Teacher Evaluation Controls",
    description: "Create an isolated teacher viewport displaying performance distributions across multiple student teams with dynamic comment capability.",
    assignedTo: "anurag",
    status: "Todo",
    priority: "Medium",
    dueDate: "2026-06-05",
    progressPercentage: 0,
    weight: 4,
    hoursLogged: 0
  },
  {
    id: "task_6",
    projectId: "proj_tracker",
    title: "Generate PDF/Excel Reports",
    description: "Export full team contribution breakdown, logged hours, completed items, and teacher review scores into copyable or printable structures.",
    assignedTo: "najmuddin",
    status: "Todo",
    priority: "Low",
    dueDate: "2026-06-10",
    progressPercentage: 0,
    weight: 2,
    hoursLogged: 0
  },
  // Waste management tasks
  {
    id: "task_7",
    projectId: "proj_attendance",
    title: "IoT Node Schematics",
    description: "Design pin-diagram mappings for Ultrasonic sensors connecting to NodeMCU boards transmitting via MQTT protocols.",
    assignedTo: "najmuddin",
    status: "Completed",
    priority: "High",
    dueDate: "2026-04-28",
    progressPercentage: 100,
    weight: 4,
    hoursLogged: 24,
    attachments: ["NodeMCU_BOM.xlsx"]
  },
  {
    id: "task_8",
    projectId: "proj_attendance",
    title: "Dashboard Map Visualization",
    description: "Plot coordinates of regional bins using SVG mappings and color-code indicators based on fill percentages.",
    assignedTo: "anurag",
    status: "In_Progress",
    priority: "Medium",
    dueDate: "2026-05-26",
    progressPercentage: 40,
    weight: 3,
    hoursLogged: 8
  }
];

export const initialFeedback: ProjectFeedback[] = [
  {
    id: "feed_1",
    projectId: "proj_tracker",
    teacherId: "teacher_anita",
    teacherName: "Prof. Anita Sharma",
    comment: "This is excellent initial progress! The feasibility study (LAB 3) was highly comprehensive and the proposed core features match real needs in student development tracks. Keep focus on refining progress calculations.",
    rating: 5,
    timestamp: "2026-05-24T10:00:00Z"
  }
];

export const initialActivityLogs: ActivityLog[] = [
  {
    id: "log_1",
    userName: "Anurag Kashyap",
    action: "completed the task 'Feasibility Analysis Documentation'",
    projectName: "Student Task & Project Tracker",
    timestamp: "2026-05-24T09:12:00Z",
    type: "task"
  },
  {
    id: "log_2",
    userName: "Prof. Anita Sharma",
    action: "posted assessment feedback & approved LAB 3",
    projectName: "Student Task & Project Tracker",
    timestamp: "2026-05-24T10:00:00Z",
    type: "comment"
  },
  {
    id: "log_3",
    userName: "Piyush Kumar",
    action: "updated progress to 60% on 'Dynamic Google Authorization Integration'",
    projectName: "Student Task & Project Tracker",
    timestamp: "2026-05-25T08:30:00Z",
    type: "status"
  }
];

export const initialAttachedFiles: AttachedFile[] = [
  {
    id: "file_1",
    taskId: "task_1",
    projectId: "proj_tracker",
    name: "UI_Colors_Draft.png",
    size: "1.4 MB",
    uploadedBy: "Piyush Kumar",
    timestamp: "2026-05-15T14:20:00Z"
  },
  {
    id: "file_2",
    taskId: "task_2",
    projectId: "proj_tracker",
    name: "Feasibility_Report_V1.pdf",
    size: "2.8 MB",
    uploadedBy: "Anurag Kashyap",
    timestamp: "2026-05-24T09:10:00Z"
  },
  {
    id: "file_3",
    taskId: "task_7",
    projectId: "proj_attendance",
    name: "NodeMCU_BOM.xlsx",
    size: "420 KB",
    uploadedBy: "Najmuddin Ahmad",
    timestamp: "2026-04-27T11:05:00Z"
  }
];
