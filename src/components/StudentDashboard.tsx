import React, { useState, useRef } from "react";
import { UserRole, TeamMember, Project, Task, ProjectFeedback, AttachedFile, ActivityLog, TaskStatus } from "../types";
import { 
  ProjectFeedback as ProjectFeedbackType 
} from "../types";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ChartTooltip, Legend as ChartLegend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { 
  LayoutDashboard, FolderKanban, Paperclip, ClipboardList, Clock, 
  User, CheckCircle, TrendingUp, Calendar, AlertCircle, Plus, FileText, Trash2, 
  ArrowRight, Sparkles, MessageCircle, Star, LogOut, CheckSquare, Upload, HelpCircle,
  Maximize2, Minimize2
} from "lucide-react";

interface StudentDashboardProps {
  currentUser: TeamMember;
  teamMembers: TeamMember[];
  projects: Project[];
  tasks: Task[];
  feedback: ProjectFeedbackType[];
  activityLogs: ActivityLog[];
  attachedFiles: AttachedFile[];
  onAddTask: (task: Omit<Task, "id" | "hoursLogged" | "progressPercentage">) => void;
  onUpdateTask: (id: string, progress: number, hours: number, status: TaskStatus) => void;
  onDeleteTask: (id: string) => void;
  onUploadFile: (projectId: string, name: string, size: string, taskId?: string) => void;
  onDeleteFile: (id: string) => void;
  onSwitchToTeacher: () => void;
  onLogout: () => void;
  onAddProject: (title: string, description: string, category: string, endDate: string, teamMembers: string[]) => void;
  onAddTeamMember: (name: string, email: string, rollNo: string) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
}

export default function StudentDashboard({
  currentUser,
  teamMembers,
  projects,
  tasks,
  feedback,
  activityLogs,
  attachedFiles,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onUploadFile,
  onDeleteFile,
  onSwitchToTeacher,
  onLogout,
  onAddProject,
  onAddTeamMember,
  onUpdateProject
}: StudentDashboardProps) {
  // Select active student project
  const [selectedProjectId, setSelectedProjectId] = useState<string>("proj_tracker");
  const [activeTab, setActiveTab] = useState<"dashboard" | "kanban" | "documents">("dashboard");

  // Full Screen & Widescreen states
  const [isWidescreen, setIsWidescreen] = useState(() => {
    return localStorage.getItem("tracker_widescreen_student") === "true";
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleWidescreen = () => {
    const nextVal = !isWidescreen;
    setIsWidescreen(nextVal);
    localStorage.setItem("tracker_widescreen_student", String(nextVal));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error("Native fullscreen request unsuccessful", err);
      });
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  React.useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);
  
  // New Task form state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>("piyush");
  const [newTaskPriority, setNewTaskPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [newTaskWeight, setNewTaskWeight] = useState<string>("3");
  const [newTaskDueDate, setNewTaskDueDate] = useState("2026-06-01");

  // Project Creation Modal state
  const [isProjModalOpen, setIsProjModalOpen] = useState(false);
  const [newProjTitle, setNewProjTitle] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [newProjCategory, setNewProjCategory] = useState("Software Engineering Capstone");
  const [newProjEndDate, setNewProjEndDate] = useState("2026-06-30");
  const [newProjMembers, setNewProjMembers] = useState<string[]>([currentUser.id]);

  // Team Member Creation Modal state
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [newMemName, setNewMemName] = useState("");
  const [newMemEmail, setNewMemEmail] = useState("");
  const [newMemRollNo, setNewMemRollNo] = useState("");

  // Edit Project Settings Modal state
  const [isEditProjModalOpen, setIsEditProjModalOpen] = useState(false);
  const [editProjTitle, setEditProjTitle] = useState("");
  const [editProjDesc, setEditProjDesc] = useState("");
  const [editProjCategory, setEditProjCategory] = useState("");
  const [editProjEndDate, setEditProjEndDate] = useState("");
  const [editProjStatus, setEditProjStatus] = useState<"Planning" | "In_Progress" | "Under_Review" | "Completed">("Planning");
  const [editProjMembers, setEditProjMembers] = useState<string[]>([]);

  // File Upload states
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTaskAssociation, setUploadTaskAssociation] = useState<string>("general");

  // Expanded task detail inside kanban for direct editing
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Filter project-specific records
  const currentProject = projects.find(p => p.id === selectedProjectId) || projects[0];
  const projectTasks = tasks.filter(t => t.projectId === selectedProjectId);
  const projectFeedback = feedback.filter(f => f.projectId === selectedProjectId);
  const projectFiles = attachedFiles.filter(f => f.projectId === selectedProjectId);

  // DYNAMIC CALCULATIONS (Fulfilling LAB specifications of weighted progress percentage)
  const totalWeight = projectTasks.reduce((acc, task) => acc + task.weight, 0);
  const completedWeight = projectTasks.reduce((acc, task) => acc + (task.progressPercentage / 100) * task.weight, 0);
  const calculatedProjectProgress = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;

  const totalHoursLogged = projectTasks.reduce((acc, task) => acc + task.hoursLogged, 0);
  const completedTasksCount = projectTasks.filter(t => t.status === "Completed").length;
  const totalTasksCount = projectTasks.length;

  // Individual Contribution Calculations
  const calculateContributionData = () => {
    // We map out student members assigned to this active project
    const studentsInProject = teamMembers.filter(m => m.role === "Student");
    return studentsInProject.map(m => {
      // hours logged by this student on current project
      const studentTasks = projectTasks.filter(t => t.assignedTo === m.id);
      const hours = studentTasks.reduce((acc, t) => acc + t.hoursLogged, 0);
      const count = studentTasks.length;
      const completedCount = studentTasks.filter(t => t.status === "Completed").length;

      return {
        name: m.name,
        hours: hours || 0,
        tasksAssigned: count,
        tasksCompleted: completedCount,
        color: m.id === "piyush" ? "#4F46E5" : m.id === "najmuddin" ? "#F59E0B" : "#10B981"
      };
    });
  };

  const contributionData = calculateContributionData();
  const COLORS = ["#4F46E5", "#F59E0B", "#10B981"];

  // Bar chart statistics
  const barChartData = contributionData.map(c => ({
    name: c.name.split(" ")[0], // Get first name
    Assigned: c.tasksAssigned,
    Completed: c.tasksCompleted,
    Hours: c.hours
  }));

  // Handle addition of a new task
  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    onAddTask({
      projectId: selectedProjectId,
      title: newTaskTitle,
      description: newTaskDesc,
      assignedTo: newTaskAssignee,
      priority: newTaskPriority,
      status: "Todo",
      dueDate: newTaskDueDate,
      weight: parseInt(newTaskWeight) || 3,
      attachments: []
    });

    // Reset Form
    setNewTaskTitle("");
    setNewTaskDesc("");
    setNewTaskAssignee("piyush");
    setNewTaskPriority("Medium");
    setNewTaskWeight("3");
    setIsTaskModalOpen(false);
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleManualUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    const sizeStr = parseFloat(sizeInMB) > 0.1 ? `${sizeInMB} MB` : `${Math.round(file.size / 1024)} KB`;
    
    onUploadFile(
      selectedProjectId,
      file.name,
      sizeStr,
      uploadTaskAssociation === "general" ? undefined : uploadTaskAssociation
    );
  };

  // Simulated Download Alert
  const simulateDownload = (fileName: string) => {
    alert(`💡 Simulating academic file fetch: Downloading "${fileName}" from the Student Project Vault.`);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col md:flex-row">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 shrink-0 flex flex-col justify-between">
        <div className="p-5">
          {/* Logo Brand */}
          <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-800/80">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-lg tracking-wide shadow-indigo-500/10 shadow-lg">
              Tracker
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-tight text-white leading-none">Task & Project</h2>
              <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">Team Platform</span>
            </div>
          </div>

          {/* Current Authorized Student */}
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/60 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                PK
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-white leading-tight truncate">{currentUser.name}</h4>
                <p className="text-[9px] text-slate-400 font-mono mt-0.5">{currentUser.rollNo}</p>
                <span className="inline-block bg-indigo-500/10 text-indigo-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1.5 border border-indigo-500/10">
                  🎓 Capstone Student
                </span>
              </div>
            </div>
          </div>

          {/* Project Toggle Panel */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Select Current Project
              </label>
              <button
                id="open-create-project-btn"
                onClick={() => {
                  setNewProjTitle("");
                  setNewProjDesc("");
                  setNewProjCategory("Software Engineering Capstone");
                  setNewProjEndDate("2026-06-30");
                  setNewProjMembers([currentUser.id]);
                  setIsProjModalOpen(true);
                }}
                className="text-[10px] text-indigo-400 hover:text-white font-bold cursor-pointer transition-colors px-1"
                title="Create a new capstone project"
              >
                + Create
              </button>
            </div>
            <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
              {projects.map(proj => (
                <button
                  id={`proj-select-${String(proj.id)}`}
                  key={proj.id}
                  onClick={() => {
                    setSelectedProjectId(proj.id);
                    setExpandedTaskId(null);
                  }}
                  className={`w-full text-left p-2.5 rounded-md text-xs font-medium cursor-pointer transition-colors block border ${
                    selectedProjectId === proj.id
                      ? "bg-slate-800/80 text-white border-indigo-500/50 shadow-sm font-semibold"
                      : "bg-transparent text-slate-400 border-transparent hover:bg-slate-900 hover:text-slate-200"
                  }`}
                >
                  <p className="truncate leading-normal">{proj.title}</p>
                  <span className="text-[9px] text-slate-500 block font-mono mt-1 font-normal uppercase">
                    {proj.category.split(" ")[0]} Project
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Navigation
            </label>
            <button
              id="menu-btn-overview"
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                activeTab === "dashboard"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Metrics Overview</span>
            </button>
            <button
              id="menu-btn-kanban"
              onClick={() => setActiveTab("kanban")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                activeTab === "kanban"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <FolderKanban className="w-4 h-4" />
              <span>Kanban Team Board</span>
            </button>
            <button
              id="menu-btn-docs"
              onClick={() => setActiveTab("documents")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                activeTab === "documents"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Paperclip className="w-4 h-4" />
              <span>Lab Attachments Vault</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-slate-900 bg-slate-950 text-center space-y-2">
          {/* Quick Grader toggle switch */}
          <button
            id="sidebar-switch-role-btn"
            onClick={onSwitchToTeacher}
            className="w-full py-1.5 bg-indigo-900/40 border border-indigo-700/30 text-indigo-300 hover:bg-indigo-900/70 text-[10px] font-bold rounded-md transition-colors"
          >
            🏫 Sandbox: View as Teacher
          </button>
          
          <button
            id="sidebar-logout-btn"
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-[10px] font-semibold rounded-md border border-slate-800/80 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN HUB INTERFACE */}
      <main className={`flex-1 p-6 md:p-8 overflow-y-auto w-full transition-all duration-300 ${
        isWidescreen ? "max-w-none" : "max-w-7xl mx-auto"
      }`}>
        
        {/* Dynamic header row detailing overall performance metrics */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-5 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400 tracking-wider uppercase mb-1">
              <span>ACTIVE STUDENT LOG</span>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex flex-wrap items-center gap-2">
              <span>{currentProject.title}</span>
              <button
                id="edit-project-settings-btn"
                onClick={() => {
                  setEditProjTitle(currentProject.title);
                  setEditProjDesc(currentProject.description);
                  setEditProjCategory(currentProject.category);
                  setEditProjEndDate(currentProject.endDate);
                  setEditProjStatus(currentProject.status);
                  setEditProjMembers(currentProject.teamMembers);
                  setIsEditProjModalOpen(true);
                }}
                className="text-[9px] bg-slate-800 hover:bg-slate-705 text-slate-300 hover:text-white px-2 py-0.5 rounded border border-slate-700 cursor-pointer font-extrabold tracking-wide uppercase transition-colors"
                title="Configure project details and team assignments"
              >
                ⚙️ Configure
              </button>
              {isWidescreen && <span className="text-[10px] bg-indigo-500/10 text-indigo-300 font-mono px-1.5 py-0.5 rounded border border-indigo-500/25 uppercase tracking-widest ml-1">Ultra Wide</span>}
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {currentProject.description}
            </p>
          </div>

          {/* Quick controls status bar */}
          <div className="flex items-center space-x-2 self-start md:self-center shrink-0">
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md font-mono border border-slate-700">
              📆 Labs Due: {currentProject.endDate}
            </span>
            <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border border-amber-500/20">
              🛠️ {currentProject.status === "In_Progress" ? "Working Sprint" : currentProject.status}
            </span>

            {/* Widescreen Toggle Button */}
            <button
              id="widescreen-toggle-btn"
              onClick={toggleWidescreen}
              className={`p-1.5 rounded-md border text-xs font-semibold cursor-pointer transition-all flex items-center space-x-1 ${
                isWidescreen 
                  ? "bg-slate-700 border-indigo-500 text-indigo-300" 
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
              }`}
              title="Toggle Full Width / Widescreen Layout"
            >
              <span className="text-[10px] font-mono leading-none">Wide Layout</span>
            </button>

            {/* Fullscreen Button */}
            <button
              id="fullscreen-toggle-btn"
              onClick={toggleFullscreen}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-md cursor-pointer transition-all flex items-center justify-center"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Immersive Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* ----------------- TAB 1: METRICS OVERVIEW ----------------- */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            
            {/* Project Metrics KPI Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Dynamic Progress indicator card */}
              <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/80 shadow-md">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weighted Progress</span>
                  <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-md">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl md:text-3xl font-extrabold text-white">{calculatedProjectProgress}%</span>
                  <span className="text-[10px] text-emerald-400 font-bold">Calculated</span>
                </div>
                {/* Custom Gradient ProgressBar */}
                <div className="w-full bg-slate-700 h-2.5 rounded-full mt-4 overflow-hidden relative border border-slate-800">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-700"
                    style={{ width: `${calculatedProjectProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Logged Work Hours Metrics */}
              <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/80 shadow-md">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cumulative Effort</span>
                  <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-md">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl md:text-3xl font-extrabold text-white">{totalHoursLogged} Hrs</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">
                  Sum of active workload hours logged across all team activities.
                </p>
              </div>

              {/* Tasks Count Ratio */}
              <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/80 shadow-md">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sprint Burn-down</span>
                  <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-md">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl md:text-3xl font-extrabold text-white">{completedTasksCount}/{totalTasksCount}</span>
                  <span className="text-[10px] text-slate-400">Tasks</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">
                  {totalTasksCount - completedTasksCount} remaining to fulfill capstone deadline.
                </p>
              </div>

              {/* Registered Team Partners */}
              <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/80 shadow-md">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Workspace</span>
                  <div className="p-1.5 bg-purple-500/10 text-purple-400 rounded-md">
                    <User className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl md:text-3xl font-extrabold text-white">3 Students</span>
                </div>
                <div className="flex -space-x-1.5 mt-4 items-center">
                  <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-slate-850 flex items-center justify-center text-[8px] font-bold">PK</div>
                  <div className="w-6 h-6 rounded-full bg-amber-500 border-2 border-slate-850 flex items-center justify-center text-[8px] font-bold">NA</div>
                  <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-850 flex items-center justify-center text-[8px] font-bold">AK</div>
                  <span className="text-[9px] text-slate-400 ml-2 font-mono">Assigned</span>
                </div>
              </div>

            </div>

            {/* HIGH-END INTERACTIVE CHARTS DIVISION */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Pie chart workload weight */}
              <div className="lg:col-span-5 bg-slate-800/60 rounded-xl p-5 border border-slate-700/70 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">Relative Effort Weight index</h3>
                      <p className="text-[11px] text-slate-400">Share of cumulative effort logged by active team partners.</p>
                    </div>
                    <span className="text-[9px] font-bold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/15 uppercase">
                      Lab 1 Metric
                    </span>
                  </div>

                  <div className="h-48 md:h-56 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={contributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="hours"
                        >
                          {contributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip 
                          formatter={(value, name, props) => [`${value} Hours Logged`, props.payload.name]}
                          contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "6px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Legend list Custom Layout */}
                <div className="space-y-2 mt-4 pt-4 border-t border-slate-700/60">
                  {contributionData.map((entry, index) => {
                    const pct = totalHoursLogged > 0 ? Math.round((entry.hours / totalHoursLogged) * 100) : 0;
                    return (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                          <span className="font-medium text-slate-300">{entry.name}</span>
                        </div>
                        <div className="font-mono text-slate-400 flex items-center space-x-2">
                          <span>{entry.hours} Hrs</span>
                          <span className="text-slate-500 font-semibold bg-slate-900 px-1.5 py-0.5 rounded-sm text-[9px]">
                            {pct}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bar chart representing workload items */}
              <div className="lg:col-span-7 bg-slate-800/60 rounded-xl p-5 border border-slate-700/70 shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">Individual Contribution Ledger</h3>
                    <p className="text-[11px] text-slate-400">Count of relative task items assigned vs completed per student.</p>
                  </div>
                  <span className="text-[9px] font-bold bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/15 uppercase">
                    Audit Log
                  </span>
                </div>

                <div className="h-56 md:h-64 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barChartData}
                      margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} tickLine={false} />
                      <ChartTooltip
                        contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}
                      />
                      <ChartLegend wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="Assigned" fill="#38bdf8" radius={[4, 4, 0, 0]} barSize={16} />
                      <Bar dataKey="Completed" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 p-3 bg-slate-900/60 rounded-lg border border-slate-750 flex items-start space-x-2 text-[11px] text-slate-400 leading-relaxed">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Academic Load Metric Assessment:</strong> Pivotal effort distribution looks excellent. To maintain balanced grading indices, we recommend team partners collaborate to distribute the next batch of Todo tasks evenly.
                  </span>
                </div>
              </div>

            </div>

            {/* Academic Feasibility Summary Drawer & Recent logs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Feasibility LAB summary */}
              <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/70 shadow-md">
                <div className="flex items-center space-x-2.5 mb-4 pb-2 border-b border-slate-755">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-sm text-white">Feasibility Dossier (LAB 3 Parameters)</h3>
                </div>

                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-indigo-300">Technical Feasibility</span>
                      <span className="text-slate-400 font-mono text-[10px]">HTML/CSS/React/EXPRESS</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Skills are thoroughly verified. Built-in local mocks and dynamic layout structures bypass database connection crashes during regional development.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-amber-400">Economic Feasibility</span>
                      <span className="text-slate-400 font-mono text-[10px]">Zero overhead</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Sourced purely on open-source community layers. No hosting, server-provisioning, or licensing fees incurred during academic evaluation.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-emerald-400">Operational Feasibility</span>
                      <span className="text-slate-400 font-mono text-[10px]">Highly Feasible</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Simple dashboard workflows, responsive board panels, and unified login parameters guarantee student and faculty onboarding immediately.
                    </p>
                  </div>
                </div>
              </div>

              {/* Real-time Team Activity log */}
              <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/70 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-755">
                    <div className="flex items-center space-x-2.5">
                      <ClipboardList className="w-5 h-5 text-indigo-400" />
                      <h3 className="font-bold text-sm text-white">Academic Activity Log</h3>
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono uppercase">Audit trail</span>
                  </div>

                  <div className="space-y-3 max-h-[190px] overflow-y-auto pr-1">
                    {activityLogs.map((log, index) => (
                      <div key={index} className="flex items-start space-x-2.5 text-xs">
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          log.type === "task" ? "bg-blue-500" :
                          log.type === "comment" ? "bg-rose-500" :
                          log.type === "status" ? "bg-amber-500" : "bg-purple-500"
                        }`}></span>
                        <div className="flex-1">
                          <p className="text-slate-300">
                            <strong>{log.userName}</strong> {log.action}
                          </p>
                          <span className="text-[9px] text-slate-500 block font-mono mt-0.5">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  id="dash-goto-kanban-btn"
                  onClick={() => setActiveTab("kanban")} 
                  className="w-full mt-4 py-1.5 text-center text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center justify-center space-x-1 group border border-dashed border-slate-700 hover:border-indigo-500/50 rounded-md transition-all cursor-pointer"
                >
                  <span>Go to Kanban Team Board</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-all" />
                </button>
              </div>

            </div>

            {/* Teacher Feedback Alert Module */}
            {projectFeedback.length > 0 && (
              <div className="bg-gradient-to-r from-slate-800 to-indigo-950 p-5 rounded-xl border border-indigo-500/20 shadow-lg relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-28 h-28 bg-indigo-500/5 rounded-full blur-xl pointer-events-none"></div>
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-indigo-500/10 text-indigo-300 rounded-lg border border-indigo-500/20">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-white">{projectFeedback[0].teacherName}</h4>
                        <span className="text-[9px] bg-indigo-500/25 text-indigo-300 border border-indigo-400/20 font-bold px-1.5 py-0.5 rounded-full uppercase">
                          Project Coordinator
                        </span>
                      </div>
                      
                      {/* Star Rating Render */}
                      <div className="flex items-center space-x-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3.5 h-3.5 ${
                              i < projectFeedback[0].rating 
                                ? "text-amber-400 fill-amber-400" 
                                : "text-slate-600"
                            }`} 
                          />
                        ))}
                      </div>
                    </div>
                    
                    <p className="text-xs text-slate-300 leading-relaxed mt-2 italic">
                      "{projectFeedback[0].comment}"
                    </p>
                    <span className="text-[9px] text-indigo-400 font-mono block mt-2">
                      Verified Review Score Matrix • Approved Milestone
                    </span>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ----------------- TAB 2: INTERACTIVE KANBAN ----------------- */}
        {activeTab === "kanban" && (
          <div className="space-y-6">
            
            {/* Header with Task Creator trigger */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-3">
              <div>
                <h3 className="font-bold text-md text-white">Academic Sprints Kanban Board</h3>
                <p className="text-xs text-slate-400">Click on any card to update its completion hour variables, log attachments, or change statuses dynamically.</p>
              </div>

              <button
                id="open-add-task-modal-btn"
                onClick={() => setIsTaskModalOpen(true)}
                className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create Lab Task</span>
              </button>
            </div>

            {/* Kanban Column Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Kanban Column Builder */}
              {(["Todo", "In_Progress", "Review", "Completed"] as TaskStatus[]).map((status) => {
                const statusTasks = projectTasks.filter(t => t.status === status);
                const colTitle = 
                  status === "Todo" ? "To Do" :
                  status === "In_Progress" ? "In Progress" :
                  status === "Review" ? "Under Review" : "Completed";

                const colBgBadge = 
                  status === "Todo" ? "bg-slate-800 text-slate-400 border-slate-700" :
                  status === "In_Progress" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                  status === "Review" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : 
                  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

                return (
                  <div key={status} className="bg-slate-900 rounded-xl border border-slate-800 p-3.5 flex flex-col space-y-3 min-h-[450px]">
                    
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                      <span className="text-xs font-bold text-white tracking-wide">{colTitle}</span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${colBgBadge}`}>
                        {statusTasks.length}
                      </span>
                    </div>

                    {/* Column Draggable/Interactive lists */}
                    <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                      {statusTasks.length === 0 ? (
                        <div className="py-12 text-center text-slate-600 text-xs border-2 border-dashed border-slate-800/60 rounded-lg flex flex-col items-center justify-center space-y-1">
                          <CheckCircle className="w-5 h-5 text-slate-700" />
                          <span>No tasks in this lane</span>
                        </div>
                      ) : (
                        statusTasks.map((task) => {
                          const assignee = teamMembers.find(m => m.id === task.assignedTo) || teamMembers[0];
                          const isExpanded = expandedTaskId === task.id;

                          return (
                            <div
                              id={`kanban-card-${String(task.id)}`}
                              key={task.id}
                              onClick={() => {
                                if (!isExpanded) setExpandedTaskId(task.id);
                              }}
                              className={`bg-slate-800 rounded-lg border p-3 cursor-pointer select-none relative group transition-all duration-300 hover:shadow-lg ${
                                isExpanded 
                                  ? "border-indigo-500 ring-1 ring-indigo-500/30" 
                                  : "border-slate-700 hover:border-slate-600"
                              }`}
                            >
                              {/* Task Card Header row */}
                              <div className="flex items-start justify-between gap-2.5">
                                <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-sm tracking-wider ${
                                  task.priority === "High" ? "bg-rose-500/10 text-rose-400" :
                                  task.priority === "Medium" ? "bg-amber-500/10 text-amber-300" :
                                  "bg-slate-700 text-slate-300"
                                }`}>
                                  {task.priority} Priority
                                </span>
                                <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1 py-0.5 rounded-xs">
                                  wt: {task.weight}x
                                </span>
                              </div>

                              <h4 className="text-xs font-bold text-white leading-tight mt-2 block group-hover:text-indigo-400 transition-colors">
                                {task.title}
                              </h4>
                              <p className="text-[10px] text-slate-400 leading-relaxed mt-1 line-clamp-2">
                                {task.description}
                              </p>

                              {/* Small Progress indicators */}
                              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
                                <div className="flex items-center space-x-1.5">
                                  <div className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-[7px] font-bold font-mono">
                                    {assignee.name.split(" ").map(n => n[0]).join("")}
                                  </div>
                                  <span className="font-semibold text-slate-300 max-w-[80px] truncate">{assignee.name}</span>
                                </div>
                                <div className="font-mono text-slate-400">{task.progressPercentage}% done</div>
                              </div>

                              {/* Tiny card status bar */}
                              <div className="w-full bg-slate-905 h-1 rounded-full mt-2.5 overflow-hidden">
                                <div 
                                  className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${task.progressPercentage}%` }}
                                ></div>
                              </div>

                              {/* Card attachments indicator if any */}
                              {(task.attachments && task.attachments.length > 0) && (
                                <div className="mt-2 flex items-center space-x-1 text-[9px] text-slate-400 font-mono">
                                  <Paperclip className="w-3 h-3 text-indigo-400" />
                                  <span className="truncate">{task.attachments[0]}</span>
                                </div>
                              )}

                              {/* ===================== EXPANDED DETAILS CARD ===================== */}
                              {isExpanded && (
                                <div 
                                  id={`kanban-card-editor-${String(task.id)}`}
                                  className="mt-4 pt-4 border-t border-slate-700 space-y-4"
                                  onClick={(e) => e.stopPropagation()} // Prevent closing on direct interact
                                >
                                  {/* Status Selector Dropdown */}
                                  <div>
                                    <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">
                                      Shift Completion Status:
                                    </label>
                                    <select
                                      id={`edit-status-select-${String(task.id)}`}
                                      value={task.status}
                                      onChange={(e) => onUpdateTask(task.id, task.progressPercentage, task.hoursLogged, e.target.value as TaskStatus)}
                                      className="w-full bg-slate-900 border border-slate-750 text-slate-300 text-xs rounded-md py-1 px-2 focus:ring-1 focus:ring-indigo-550"
                                    >
                                      <option value="Todo">To Do</option>
                                      <option value="In_Progress">In Progress</option>
                                      <option value="Review">Under Review</option>
                                      <option value="Completed">Completed Task</option>
                                    </select>
                                  </div>

                                  {/* Dynamic progress slider */}
                                  <div>
                                    <div className="flex justify-between items-center mb-1">
                                      <label className="block text-[9px] font-bold uppercase text-slate-400">
                                        Fulfillment Percentage:
                                      </label>
                                      <span className="text-[10px] font-mono text-indigo-400 font-bold">{task.progressPercentage}%</span>
                                    </div>
                                    <input
                                      id={`progress-slider-${String(task.id)}`}
                                      type="range"
                                      min="0"
                                      max="100"
                                      step="5"
                                      value={task.progressPercentage}
                                      onChange={(e) => {
                                        const nextProg = parseInt(e.target.value);
                                        // Auto adjust status if 100% or 0%
                                        let nextStatus = task.status;
                                        if (nextProg === 100) nextStatus = "Completed";
                                        else if (nextProg > 0 && task.status === "Todo") nextStatus = "In_Progress";
                                        onUpdateTask(task.id, nextProg, task.hoursLogged, nextStatus);
                                      }}
                                      className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                    />
                                  </div>

                                  {/* Logger workload tracker */}
                                  <div>
                                    <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">
                                      Incremental Work hours logged:
                                    </label>
                                    <div className="flex items-center space-x-2">
                                      <input
                                        id={`hours-input-${String(task.id)}`}
                                        type="number"
                                        min="0"
                                        max="200"
                                        value={task.hoursLogged}
                                        onChange={(e) => {
                                          const nextHours = parseInt(e.target.value) || 0;
                                          onUpdateTask(task.id, task.progressPercentage, nextHours, task.status);
                                        }}
                                        className="w-20 bg-slate-900 border border-slate-750 text-slate-350 text-xs rounded-md py-1 px-2 text-center"
                                      />
                                      <span className="text-[10px] text-slate-500 font-mono">Hours logged</span>
                                      
                                      <button
                                        id={`add-hour-btn-${String(task.id)}`}
                                        onClick={() => onUpdateTask(task.id, task.progressPercentage, task.hoursLogged + 2, task.status)}
                                        className="py-1 px-2.5 bg-indigo-900/40 border border-indigo-700/30 rounded-md text-[10px] text-indigo-300 hover:bg-indigo-900/60 transition-colors ml-auto cursor-pointer"
                                      >
                                        +2 Hrs Logged
                                      </button>
                                    </div>
                                  </div>

                                  {/* Task specific attachments list */}
                                  <div>
                                    <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">
                                      Task Attachments:
                                    </label>
                                    <div className="space-y-1.5">
                                      {projectFiles.filter(f => f.taskId === task.id).map(f => (
                                        <div key={f.id} className="flex justify-between items-center text-[10px] bg-slate-900 p-1.5 rounded-sm border border-slate-800">
                                          <span className="truncate max-w-[130px] font-mono text-slate-300">{f.name}</span>
                                          <button
                                            id={`del-card-file-${String(f.id)}`}
                                            onClick={() => onDeleteFile(f.id)}
                                            className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer p-0.5"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ))}

                                      <button
                                        id={`quick-upload-card-btn-${String(task.id)}`}
                                        onClick={() => {
                                          setUploadTaskAssociation(task.id);
                                          setActiveTab("documents");
                                          // brief delay then trigger uploader
                                          setTimeout(() => {
                                            fileInputRef.current?.click();
                                          }, 200);
                                        }}
                                        className="w-full py-1 text-center border border-dashed border-slate-600 rounded-md text-[10px] text-slate-400 hover:text-white hover:border-slate-400 transition-colors cursor-pointer"
                                      >
                                        📎 Attach document
                                      </button>
                                    </div>
                                  </div>

                                  {/* Delete Task and Close Drawer control panel */}
                                  <div className="flex items-center justify-between gap-2.5 pt-2">
                                    <button
                                      id={`del-task-btn-${String(task.id)}`}
                                      onClick={() => {
                                        onDeleteTask(task.id);
                                        setExpandedTaskId(null);
                                      }}
                                      className="py-1 px-2 border border-rose-500/20 hover:border-rose-500 text-rose-400 hover:bg-rose-500/10 text-[10px] rounded-md transition-colors cursor-pointer"
                                    >
                                      Delete Task
                                    </button>
                                    <button
                                      id={`close-task-editor-${String(task.id)}`}
                                      onClick={() => setExpandedTaskId(null)}
                                      className="py-1 px-2.5 bg-slate-700 hover:bg-slate-650 text-white text-[10px] rounded-md transition-colors font-semibold cursor-pointer"
                                    >
                                      Close Editor
                                    </button>
                                  </div>

                                </div>
                              )}

                            </div>
                          );
                        })
                      )}
                    </div>

                  </div>
                );
              })}

            </div>

          </div>
        )}

        {/* ----------------- TAB 3: DOCUMENTS VAULT ----------------- */}
        {activeTab === "documents" && (
          <div className="space-y-6">
            
            <div className="pb-3 border-b border-slate-800">
              <h3 className="font-bold text-md text-white">Project Attachment Repository</h3>
              <p className="text-xs text-slate-400">Collaborating partners upload project blueprints, code libraries, database schemas, and feasibilities studies for teacher reviews.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column code: Simulated Drag & Drop Area */}
              <div className="lg:col-span-4 space-y-4">
                
                <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700/80 shadow-md">
                  <span className="block text-xs font-bold text-white mb-2 uppercase tracking-wide">Fulfillment Attachment</span>
                  
                  {/* Task Selector for File Upload Association */}
                  <div className="mb-4">
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1.5">
                      Associate upload folder:
                    </label>
                    <select
                      id="upload-folder-association"
                      value={uploadTaskAssociation}
                      onChange={(e) => setUploadTaskAssociation(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-md py-1.5 px-2 outline-hidden focus:border-indigo-500"
                    >
                      <option value="general">📁 General Project Directory</option>
                      {projectTasks.map(t => (
                        <option key={t.id} value={t.id}>📋 Task: {t.title}</option>
                      ))}
                    </select>
                  </div>

                  {/* Drag drop dropzone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleManualUploadClick}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                      dragOver 
                        ? "border-indigo-500 bg-indigo-500/10" 
                        : "border-slate-650 hover:border-slate-500 hover:bg-slate-900/30"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                    <span className="text-xs font-semibold block text-slate-200">
                      Drag & Drop dynamic academic files
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-1.5">
                      or click to browse filesystem storage
                    </span>
                  </div>

                  <p className="text-[9px] text-slate-500 mt-3 text-center leading-normal">
                    Supports any lab PDF, Excel files, images up to 25MB. Uploaded files are logged directly under current student session.
                  </p>
                </div>

                {/* Helpful instructions guidelines matching LAB report issues */}
                <div className="p-4 bg-indigo-950/30 rounded-xl border border-indigo-500/10 text-xs space-y-2">
                  <div className="flex items-center space-x-2 text-indigo-300 font-semibold text-xs uppercase tracking-wide">
                    <HelpCircle className="w-4 h-4 shrink-0" />
                    <span>Lab Review Guidelines</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Make sure all file logs match the specified LAB modules! 
                    For academic submission of <strong>LAB 1 (Teams)</strong>, <strong>LAB 2 (Problem Definition)</strong>, and <strong>LAB 3 (Feasibility Report)</strong>, append files with corresponding abbreviations for grades.
                  </p>
                </div>

              </div>

              {/* Right Column code: Attachments table ledger */}
              <div className="lg:col-span-8 bg-slate-800/60 rounded-xl p-5 border border-slate-700/70 shadow-md">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-755 mb-4">
                  <h4 className="font-bold text-sm text-white">Active Milestone Documents</h4>
                  <span className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-750">
                    {projectFiles.length} files logged
                  </span>
                </div>

                {projectFiles.length === 0 ? (
                  <div className="py-24 text-center text-slate-600 font-medium">
                    No files found in directory vault. Switch association tab or upload credentials above.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead>
                        <tr className="border-b border-slate-755 text-slate-450 uppercase text-[9px] font-bold tracking-wider">
                          <th className="pb-3 pl-2">Document Name</th>
                          <th className="pb-3">Source Task</th>
                          <th className="pb-3">Logged By</th>
                          <th className="pb-3">Dimension</th>
                          <th className="pb-3 text-right pr-2">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-755/65">
                        {projectFiles.map((file) => {
                          const associatedTask = taskAssociationName(file.taskId, projectTasks);
                          return (
                            <tr key={file.id} className="hover:bg-slate-900/20 group">
                              <td className="py-3 pl-2 font-semibold text-slate-200">
                                <div className="flex items-center space-x-2">
                                  <FileText className="w-4 h-4 text-indigo-400 group-hover:text-amber-400 transition-colors" />
                                  <span className="truncate max-w-[180px]" title={file.name}>{file.name}</span>
                                </div>
                              </td>
                              <td className="py-3 text-slate-400 font-medium">
                                <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full ${
                                  associatedTask === "General Project" 
                                    ? "bg-slate-900 text-slate-500" 
                                    : "bg-indigo-900/30 text-indigo-300"
                                }`}>
                                  {associatedTask}
                                </span>
                              </td>
                              <td className="py-3 text-slate-400">{file.uploadedBy}</td>
                              <td className="py-3 font-mono text-[10px] text-slate-500">{file.size}</td>
                              <td className="py-3 text-right pr-2">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    id={`dl-file-action-${String(file.id)}`}
                                    onClick={() => simulateDownload(file.name)}
                                    className="px-2 py-1 bg-slate-900 hover:bg-slate-750 text-indigo-400 hover:text-white rounded-md text-[10px] font-semibold transition-all cursor-pointer"
                                  >
                                    Download
                                  </button>
                                  <button
                                    id={`del-file-action-${String(file.id)}`}
                                    onClick={() => onDeleteFile(file.id)}
                                    className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer p-1"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>

            </div>

          </div>
        )}

      </main>

      {/* ======================= CREATE TASK MODAL ======================= */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-slate-800 text-slate-100 rounded-xl max-w-md w-full border border-slate-700 shadow-2xl overflow-hidden p-6 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center space-x-2 text-white font-bold text-sm">
                <CheckSquare className="w-5 h-5 text-indigo-400" />
                <span>Describe New Lab Task</span>
              </div>
              <button 
                id="close-add-task-modal-top"
                onClick={() => setIsTaskModalOpen(false)} 
                className="text-slate-400 hover:text-white font-bold leading-none text-xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleTaskSubmit} className="space-y-4 text-xs">
              
              {/* Task Title */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Task Title or LAB Designation
                </label>
                <input
                  id="new-task-title-input"
                  type="text"
                  required
                  placeholder="e.g. LAB 4: Write UML Class Diagram Mappings"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-slate-200"
                />
              </div>

              {/* Task Description */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Task Task Requirements
                </label>
                <textarea
                  id="new-task-desc-input"
                  rows={3}
                  placeholder="Focus task scope, code criteria, resources to incorporate."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-slate-200"
                />
              </div>

              {/* Grid 2 column parameters */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Assignee Selection from project members list */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Assignee Partner
                  </label>
                  <select
                    id="new-task-assignee-select"
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-2.5 text-slate-200"
                  >
                    {teamMembers.filter(m => m.role === "Student").map(m => (
                      <option key={m.id} value={m.id}>{m.name.split(" ")[0]} ({m.name.split(" ")[1]})</option>
                    ))}
                  </select>
                </div>

                {/* Priority Selection */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Priority Status
                  </label>
                  <select
                    id="new-task-priority-select"
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as "Low" | "Medium" | "High")}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-2.5 text-slate-200"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                  </select>
                </div>

              </div>

              <div className="grid grid-cols-2 gap-4">
                
                {/* Weight factor index */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Impact Weight Multiplier
                  </label>
                  <select
                    id="new-task-weight-select"
                    value={newTaskWeight}
                    onChange={(e) => setNewTaskWeight(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700  rounded-lg py-2 px-2.5 text-slate-200 font-mono"
                  >
                    <option value="1">1x Simple Item</option>
                    <option value="2">2x Medium Labor</option>
                    <option value="3">3x Capstone Core</option>
                    <option value="4">4x High Complexity</option>
                    <option value="5">5x Critical Architecture</option>
                  </select>
                </div>

                {/* Due Date picker */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Deadline Date
                  </label>
                  <input
                    id="new-task-duedate-input"
                    type="date"
                    required
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-2 text-slate-200 font-mono"
                  />
                </div>

              </div>

              {/* Actions submit */}
              <div className="flex items-center space-x-3 pt-3 justify-end border-t border-slate-700/60 font-semibold">
                <button
                  id="close-add-task-modal-bottom"
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-3.5 py-2 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="submit-add-task-btn"
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/10 text-white rounded-lg transition-all cursor-pointer"
                >
                  Confirm & Alloc
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ==================== PROJECT GENERATED MODALS INJECTIONS ==================== */}

      {/* 2. CREATE NEW PROJECT MODAL */}
      {isProjModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 text-slate-100 rounded-xl max-w-md w-full border border-slate-700 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700">
              <span className="text-white font-extrabold text-sm flex items-center space-x-1.5">
                <span className="text-indigo-400 font-bold">📁</span>
                <span>Initiate Capstone Project</span>
              </span>
              <button 
                id="close-create-project-modal"
                onClick={() => setIsProjModalOpen(false)} 
                className="text-slate-400 hover:text-white font-bold leading-none text-xl cursor-pointer bg-transparent border-0"
              >
                &times;
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!newProjTitle.trim()) return;
                onAddProject(newProjTitle, newProjDesc, newProjCategory, newProjEndDate, newProjMembers);
                setIsProjModalOpen(false);
              }} 
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Project Title
                </label>
                <input
                  id="new-project-title"
                  type="text"
                  required
                  placeholder="e.g. Regional Air Quality Monitoring System"
                  value={newProjTitle}
                  onChange={(e) => setNewProjTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Project Abstract / Description
                </label>
                <textarea
                  id="new-project-desc"
                  rows={3}
                  required
                  placeholder="Summarize the core vision, architecture patterns, and what classroom imbalances this solves."
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Academic Category
                  </label>
                  <input
                    id="new-project-category"
                    type="text"
                    required
                    placeholder="e.g. Software Engineering"
                    value={newProjCategory}
                    onChange={(e) => setNewProjCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Lab Milestone Deadline
                  </label>
                  <input
                    id="new-project-enddate"
                    type="date"
                    required
                    value={newProjEndDate}
                    onChange={(e) => setNewProjEndDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">
                  Select Included Team Members ({newProjMembers.length})
                </label>
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto bg-slate-900 p-2.5 rounded border border-slate-700">
                  {teamMembers.filter(m => m.role === "Student").map(m => {
                    const selected = newProjMembers.includes(m.id);
                    return (
                      <label key={m.id} className="flex items-center space-x-2 cursor-pointer hover:text-white select-none">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => {
                            if (selected) {
                              setNewProjMembers(prev => prev.filter(mid => mid !== m.id));
                            } else {
                              setNewProjMembers(prev => [...prev, m.id]);
                            }
                          }}
                          className="rounded text-indigo-600 focus:ring-0 mr-1.5"
                        />
                        <span className="text-xs text-slate-300">{m.name} ({m.rollNo || "No RollNo"})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-3 justify-end border-t border-slate-700/60 font-semibold text-xs animate-fade-in">
                <button
                  id="cancel-create-project-btn"
                  type="button"
                  onClick={() => setIsProjModalOpen(false)}
                  className="px-3.5 py-1.5 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="confirm-create-project-btn"
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all cursor-pointer shadow-md"
                >
                  Confirm & Initiate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. REGISTER NEW TEAM MEMBER MODAL */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 text-slate-100 rounded-xl max-w-sm w-full border border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700">
              <span className="text-white font-extrabold text-sm flex items-center space-x-1.5">
                <span className="text-emerald-400 font-bold">👤</span>
                <span>Register Classmate Coworker</span>
              </span>
              <button 
                id="close-add-member-modal"
                onClick={() => setIsMemberModalOpen(false)} 
                className="text-slate-400 hover:text-white font-bold leading-none text-xl cursor-pointer bg-transparent border-0"
              >
                &times;
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!newMemName.trim() || !newMemEmail.trim() || !newMemRollNo.trim()) return;
                onAddTeamMember(newMemName, newMemEmail, newMemRollNo);
                setIsMemberModalOpen(false);
              }} 
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  id="new-member-fullname"
                  type="text"
                  required
                  placeholder="e.g. Rajesh Yadav"
                  value={newMemName}
                  onChange={(e) => setNewMemName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Institutional Email Address
                </label>
                <input
                  id="new-member-email"
                  type="email"
                  required
                  placeholder="rajesh.yadav@university.edu"
                  value={newMemEmail}
                  onChange={(e) => setNewMemEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  University Roll Number
                </label>
                <input
                  id="new-member-rollno"
                  type="text"
                  required
                  placeholder="e.g. 23SCSE1013402"
                  value={newMemRollNo}
                  onChange={(e) => setNewMemRollNo(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 outline-hidden font-mono"
                />
              </div>

              <div className="flex items-center space-x-3 pt-3 justify-end border-t border-slate-700/60 font-semibold text-xs">
                <button
                  id="cancel-add-member-btn"
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="px-3.5 py-1.5 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="confirm-add-member-btn"
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Register Coworker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. EDIT PROJECT CONFIGURATION MODAL */}
      {isEditProjModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 text-slate-100 rounded-xl max-w-md w-full border border-slate-700 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700">
              <span className="text-white font-extrabold text-sm flex items-center space-x-1.5">
                <span className="text-indigo-400 font-bold">⚙️</span>
                <span>Configure Project Settings</span>
              </span>
              <button 
                id="close-edit-project-modal"
                onClick={() => setIsEditProjModalOpen(false)} 
                className="text-slate-400 hover:text-white font-bold leading-none text-xl cursor-pointer bg-transparent border-0"
              >
                &times;
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!editProjTitle.trim()) return;
                onUpdateProject(selectedProjectId, {
                  title: editProjTitle,
                  description: editProjDesc,
                  category: editProjCategory,
                  endDate: editProjEndDate,
                  status: editProjStatus,
                  teamMembers: editProjMembers
                });
                setIsEditProjModalOpen(false);
              }} 
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Project Title
                </label>
                <input
                  id="edit-project-title"
                  type="text"
                  required
                  placeholder="e.g. Regional Air Quality Monitoring System"
                  value={editProjTitle}
                  onChange={(e) => setEditProjTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Project Abstract / Description
                </label>
                <textarea
                  id="edit-project-desc"
                  rows={3}
                  required
                  value={editProjDesc}
                  onChange={(e) => setEditProjDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Academic Category
                  </label>
                  <input
                    id="edit-project-category"
                    type="text"
                    required
                    value={editProjCategory}
                    onChange={(e) => setEditProjCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Lab Milestone Deadline
                  </label>
                  <input
                    id="edit-project-enddate"
                    type="date"
                    required
                    value={editProjEndDate}
                    onChange={(e) => setEditProjEndDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Development Phase / Status
                  </label>
                  <select
                    id="edit-project-status"
                    value={editProjStatus}
                    onChange={(e) => setEditProjStatus(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-2.5 text-slate-200 focus:outline-hidden"
                  >
                    <option value="Planning">Planning Sprint</option>
                    <option value="In_Progress">In Progress (Working Sprint)</option>
                    <option value="Under_Review">Under Review / Lab Submission</option>
                    <option value="Completed">Completed / Evaluated</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">
                  Configure Included Team Members ({editProjMembers.length})
                </label>
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto bg-slate-900 p-2.5 rounded border border-slate-700">
                  {teamMembers.filter(m => m.role === "Student").map(m => {
                    const selected = editProjMembers.includes(m.id);
                    return (
                      <label key={m.id} className="flex items-center space-x-2 cursor-pointer hover:text-white select-none">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => {
                            if (selected) {
                              if (editProjMembers.length <= 1) return; // keep at least 1 member
                              setEditProjMembers(prev => prev.filter(mid => mid !== m.id));
                            } else {
                              setEditProjMembers(prev => [...prev, m.id]);
                            }
                          }}
                          className="rounded text-indigo-600 focus:ring-0 mr-1.5"
                        />
                        <span className="text-xs text-slate-300">{m.name} ({m.rollNo || "No RollNo"})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-3 justify-end border-t border-slate-700/60 font-semibold text-xs">
                <button
                  id="cancel-edit-project-btn"
                  type="button"
                  onClick={() => setIsEditProjModalOpen(false)}
                  className="px-3.5 py-1.5 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="confirm-edit-project-btn"
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer shadow-md"
                >
                  Save Configurations
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Quick helper to determine associated task text in document Vault
function taskAssociationName(taskId: string | undefined, list: Task[]): string {
  if (!taskId || taskId === "general") return "General Project";
  const item = list.find(t => t.id === taskId);
  return item ? `Task: ${item.title}` : "Associated Task";
}
