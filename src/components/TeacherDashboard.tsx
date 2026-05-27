import React, { useState } from "react";
import { UserRole, TeamMember, Project, Task, ProjectFeedback, TaskStatus } from "../types";
import { 
  ProjectFeedback as ProjectFeedbackType 
} from "../types";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as ChartTooltip, Legend as ChartLegend 
} from "recharts";
import { 
  GraduationCap, Users, FolderKanban, ShieldCheck, FileCheck, Star, ArrowRight,
  TrendingUp, Clock, AlertTriangle, MessageSquare, PlusCircle, CheckCircle, 
  HelpCircle, Sheet, Sparkles, Copy, Printer, LogOut, Maximize2, Minimize2
} from "lucide-react";

interface TeacherDashboardProps {
  currentUser: TeamMember;
  teamMembers: TeamMember[];
  projects: Project[];
  tasks: Task[];
  feedback: ProjectFeedbackType[];
  onAddTeacherFeedback: (projectId: string, comment: string, rating: number) => void;
  onAddTask: (task: Omit<Task, "id" | "hoursLogged" | "progressPercentage">) => void;
  onSwitchToStudent: () => void;
  onLogout: () => void;
  onAddProject: (title: string, description: string, category: string, endDate: string, teamMembers: string[]) => void;
  onAddTeamMember: (name: string, email: string, rollNo: string) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
}

export default function TeacherDashboard({
  currentUser,
  teamMembers,
  projects,
  tasks,
  feedback,
  onAddTeacherFeedback,
  onAddTask,
  onSwitchToStudent,
  onLogout,
  onAddProject,
  onAddTeamMember,
  onUpdateProject
}: TeacherDashboardProps) {
  // Select active team/project being reviewed
  const [selectedProjectId, setSelectedProjectId] = useState<string>("proj_tracker");

  // Full Screen & Widescreen states
  const [isWidescreen, setIsWidescreen] = useState(() => {
    return localStorage.getItem("tracker_widescreen_teacher") === "true";
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleWidescreen = () => {
    const nextVal = !isWidescreen;
    setIsWidescreen(nextVal);
    localStorage.setItem("tracker_widescreen_teacher", String(nextVal));
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

  // Interaction forms state
  const [gradeScore, setGradeScore] = useState<string>("A");
  const [starsRating, setStarsRating] = useState<number>(5);
  const [teacherReviewComment, setTeacherReviewComment] = useState("");
  const [isSubmitSuccessAlert, setIsSubmitSuccessAlert] = useState(false);

  // Professor task injector flow
  const [directorTaskTitle, setDirectorTaskTitle] = useState("");
  const [directorTaskAssignee, setDirectorTaskAssignee] = useState<string>("piyush");
  const [directorTaskPriority, setDirectorTaskPriority] = useState<"Medium" | "High">("High");
  const [directorTaskWeight, setDirectorTaskWeight] = useState<number>(4);
  const [isInjectorOpen, setIsInjectorOpen] = useState(false);

  const [hasCopiedReport, setHasCopiedReport] = useState(false);

  // Find project under evaluation
  const activeProj = projects.find(p => p.id === selectedProjectId) || projects[0];
  const activeTasks = tasks.filter(t => t.projectId === selectedProjectId);
  const activeFeedback = feedback.filter(f => f.projectId === selectedProjectId);

  // CALCULATIONS (Automatic progress indexes & imbalances)
  const calculateOverviewStats = () => {
    const totalW = activeTasks.reduce((acc, t) => acc + t.weight, 0);
    const doneW = activeTasks.reduce((acc, t) => acc + (t.progressPercentage / 100) * t.weight, 0);
    const progress = totalW > 0 ? Math.round((doneW / totalW) * 100) : 0;
    const hours = activeTasks.reduce((acc, t) => acc + t.hoursLogged, 0);
    const doneCount = activeTasks.filter(t => t.status === "Completed").length;

    return { progress, hours, doneCount, totalCount: activeTasks.length };
  };

  const currentStats = calculateOverviewStats();

  // Classroom-wide general calculations 
  const classAvgProgress = Math.round(
    projects.reduce((acc, proj) => {
      const projTasks = tasks.filter(t => t.projectId === proj.id);
      const totalW = projTasks.reduce((acu, t) => acu + t.weight, 0);
      const doneW = projTasks.reduce((acu, t) => acu + (t.progressPercentage / 100) * t.weight, 0);
      return acc + (totalW > 0 ? (doneW / totalW) * 100 : 0);
    }, 0) / projects.length
  );

  // Calculate workloads for standard imbalance checker
  const calculateWorkloadLogs = () => {
    const students = teamMembers.filter(m => m.role === "Student");
    let imbalanceDetected = false;
    let maxHours = 0;
    let minHours = 9999;

    const data = students.map(m => {
      const studentTasks = activeTasks.filter(t => t.assignedTo === m.id);
      const hours = studentTasks.reduce((acc, t) => acc + t.hoursLogged, 0);
      const count = studentTasks.length;
      const completedCount = studentTasks.filter(t => t.status === "Completed").length;

      if (hours > maxHours) maxHours = hours;
      if (hours < minHours && count > 0) minHours = hours;

      return {
        name: m.name,
        hours,
        tasksCount: count,
        completedCount,
        studentId: m.id
      };
    });

    // If gap between max working student and min exceeds 15 hours, flag alert!
    if (maxHours - minHours > 15 && minHours !== 9999) {
      imbalanceDetected = true;
    }

    return { data, imbalanceDetected, workloadGap: maxHours - minHours };
  };

  const workloadLogs = calculateWorkloadLogs();

  // Recharts payload structure
  const barPayload = workloadLogs.data.map(w => ({
    name: w.name.split(" ")[0],
    Hours: w.hours,
    Tasks: w.tasksCount
  }));

  // Handle assessment submit
  const handleAssessmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherReviewComment.trim()) return;

    onAddTeacherFeedback(selectedProjectId, teacherReviewComment, starsRating);
    setTeacherReviewComment("");
    setIsSubmitSuccessAlert(true);
    setTimeout(() => {
      setIsSubmitSuccessAlert(false);
    }, 3000);
  };

  // Handle instructor directed task injection
  const handleTaskInjectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directorTaskTitle.trim()) return;

    onAddTask({
      projectId: selectedProjectId,
      title: `[INSTRUCTOR TASK] ${directorTaskTitle}`,
      description: `Targeted task assigned directly by Prof. Anita Sharma during project assessment reviews. Complete thoroughly for grade approval indices.`,
      assignedTo: directorTaskAssignee,
      priority: directorTaskPriority,
      status: "Todo",
      dueDate: "2026-06-12",
      weight: directorTaskWeight,
      attachments: []
    });

    setDirectorTaskTitle("");
    setIsInjectorOpen(false);
    alert(`✔️ Success: Instructor Task has been directly appended to student board!`);
  };

  // Generate audit copy report text
  const generateAuditReportText = () => {
    let text = `====================================================\n`;
    text += `STUDENT TASK & PROJECT TRACKER AUDIT CARD REPORT\n`;
    text += `University Capstone Review Team Assessment\n`;
    text += `Date: ${new Date().toLocaleDateString()}\n`;
    text += `====================================================\n\n`;
    text += `Project Title: ${activeProj.title}\n`;
    text += `Category: ${activeProj.category}\n`;
    text += `Calculated Weighted Progress: ${currentStats.progress}%\n`;
    text += `Total Effort Logged: ${currentStats.hours} Hours\n`;
    text += `Current Grader Assigned Score: Grade ${gradeScore} (${starsRating}/5 Stars)\n\n`;
    text += `----------------------------------------------------\n`;
    text += `INDIVIDUAL WORKLOAD LEDGER BREAKDOWN\n`;
    text += `----------------------------------------------------\n`;
    
    workloadLogs.data.forEach(w => {
      text += `Student: ${w.name}\n`;
      text += `- Total Hours Logged: ${w.hours} Hrs\n`;
      text += `- Assigned/Completed Tasks: ${w.tasksCount} / ${w.completedCount}\n\n`;
    });

    text += `----------------------------------------------------\n`;
    text += `ACTIVE PROJECT FEEDBACK HISTORY\n`;
    text += `----------------------------------------------------\n`;
    const hist = activeFeedback.map((f, i) => `${i+1}. Stars: ${f.rating}/5 | Comment: ${f.comment}`).join("\n");
    text += hist || "No active history reviews posted yet";
    
    return text;
  };

  const handleCopyReportToClipboard = () => {
    navigator.clipboard.writeText(generateAuditReportText());
    setHasCopiedReport(true);
    setTimeout(() => setHasCopiedReport(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col md:flex-row">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 shrink-0 p-5 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Logo Brand */}
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-800/85">
            <div className="w-9 h-9 rounded-lg bg-pink-600 flex items-center justify-center font-bold text-white text-lg tracking-wide shadow-pink-500/10 shadow-lg">
              Faculty
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-tight text-white leading-none">Prof. Hub Panel</h2>
              <span className="text-[10px] text-pink-400 font-bold tracking-wider uppercase">Classroom reviewer</span>
            </div>
          </div>

          {/* Current Authorized Faculty */}
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/65">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-pink-500/40 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                AS
              </div>
              <div>
                <h4 className="text-xs font-bold text-white leading-tight">{currentUser.name}</h4>
                <p className="text-[9px] text-slate-400 font-mono mt-0.5">Project Coordinator</p>
                <span className="inline-block bg-pink-500/10 text-pink-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full mt-2 border border-pink-500/10 uppercase">
                  🏫 Faculty Grader
                </span>
              </div>
            </div>
          </div>

          {/* Sprints Group Toggle Panel */}
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Select student groups
            </label>
            <div className="space-y-1">
              {projects.map(proj => (
                <button
                  id={`eval-select-${String(proj.id)}`}
                  key={proj.id}
                  onClick={() => setSelectedProjectId(proj.id)}
                  className={`w-full text-left p-2.5 rounded-md text-xs font-semibold cursor-pointer transition-colors block border ${
                    selectedProjectId === proj.id
                      ? "bg-slate-800 text-white border-pink-500/40 shadow-sm"
                      : "bg-transparent text-slate-400 border-transparent hover:bg-slate-900 hover:text-slate-200"
                  }`}
                >
                  <p className="truncate leading-normal">{proj.title}</p>
                  <p className="text-[9px] text-slate-500 font-mono font-normal uppercase mt-1">
                    Team Leader: {proj.leaderId === "piyush" ? "Piyush" : "Najmuddin"}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-slate-900 bg-slate-950 text-center space-y-2 pt-4">
          <button
            id="sidebar-switch-student-btn"
            onClick={onSwitchToStudent}
            className="w-full py-1.5 bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white text-[10px] font-bold rounded-md transition-colors"
          >
            🎓 View active Student Hub
          </button>
          
          <button
            id="sidebar-logout-teacher-btn"
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-[10px] font-semibold rounded-md border border-slate-800/80 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN HUB INTERFACE */}
      <main className={`flex-1 p-6 md:p-8 overflow-y-auto w-full space-y-6 transition-all duration-300 ${
        isWidescreen ? "max-w-none" : "max-w-7xl mx-auto"
      }`}>
        
        {/* Course Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-pink-400 tracking-wider uppercase mb-1">
              <span>Classroom Evaluation Dashboard</span>
              <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse"></span>
              {isWidescreen && <span className="text-[9px] bg-pink-500/15 text-pink-300 font-mono px-1 py-0.5 rounded border border-pink-500/20 uppercase tracking-widest ml-2">Ultra Wide</span>}
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Capstone Lab Evaluation Panel
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Monitoring individual contributions, balanced labor metrics, project timelines, and academic logs for multiple registered groups.
            </p>
          </div>

          <div className="flex items-center space-x-2 self-start md:self-center shrink-0">
            {/* Widescreen Toggle Button */}
            <button
              id="widescreen-toggle-teacher-btn"
              onClick={toggleWidescreen}
              className={`py-1.5 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all flex items-center space-x-1 ${
                isWidescreen 
                  ? "bg-slate-700 border-pink-500 text-pink-300" 
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
              }`}
              title="Toggle Full Width / Widescreen Layout"
            >
              <span className="text-[10px] font-mono leading-none">Wide Layout</span>
            </button>

            {/* Fullscreen Button */}
            <button
              id="fullscreen-toggle-teacher-btn"
              onClick={toggleFullscreen}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg cursor-pointer transition-all flex items-center justify-center h-8 w-8"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Immersive Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              id="switch-student-mode-top"
              onClick={onSwitchToStudent}
              className="py-1.5 px-3 bg-indigo-650 hover:bg-indigo-600 font-bold text-xs text-white rounded-lg flex items-center space-x-1 transition-all"
            >
              <span>🎓 Student Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Global Classroom Key Metrics KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">My Groups</span>
            <span className="text-2xl font-extrabold text-white">2 Registered Teams</span>
            <p className="text-[10px] text-slate-500 mt-1">CSE Capstone Section A</p>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Classroom progress average</span>
            <span className="text-2xl font-extrabold text-white">{classAvgProgress}% Avg</span>
            <p className="text-[10px] text-slate-500 mt-1">Calculated from overall tasks weights</p>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Team alpha completion</span>
            <span className="text-2xl font-extrabold text-white">{currentStats.progress}%</span>
            <p className="text-[10px] text-slate-500 mt-1">Weighted project accomplishment index</p>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Workload gap indicators</span>
            <span className={`text-2xl font-extrabold ${workloadLogs.imbalanceDetected ? "text-amber-400" : "text-white"}`}>
              {workloadLogs.workloadGap} Hours Gap
            </span>
            <p className="text-[10px] text-slate-500 mt-1">
              {workloadLogs.imbalanceDetected ? "⚠️ Potential imbalance flagged" : "✔️ Log hours balanced"}
            </p>
          </div>

        </div>

        {/* Imbalance check alerting drawer */}
        {workloadLogs.imbalanceDetected && (
          <div id="imbalance-alert-banner" className="bg-amber-950/40 p-4 rounded-xl border border-amber-800 text-amber-300 text-xs flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">⚠️ Dynamic Labor Audit Alert: High Workload Imbalance Detected</p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                The hours logged by the highest active student contributor (e.g. Piyush or Najmuddin) exceeds the lowest active contributor by more than 15 hours. To prevent uneven grading indices, please leave evaluation guidance or inject an additional directed task below to balance workload allocations.
              </p>
            </div>
          </div>
        )}

        {/* Main auditing panel splits */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Workload balance chart visualization (7 cols) */}
          <div className="lg:col-span-7 bg-slate-800/60 rounded-xl p-5 border border-slate-700/70 space-y-4 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Active Student Contribution Metrics</h3>
              <p className="text-[11px] text-slate-400">Comparing active efforts logged (hours) vs tasks count assigned to teach. (LAB 1 Problem Resolution)</p>
            </div>

            <div className="h-60 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barPayload} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <ChartTooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }} />
                  <ChartLegend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="Hours" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={18} />
                  <Bar dataKey="Tasks" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="border-t border-slate-700/60 pt-4 grid grid-cols-3 gap-2 text-center text-xs">
              {workloadLogs.data.map((w, index) => (
                <div key={index} className="bg-slate-900/50 p-2.5 rounded border border-slate-750">
                  <span className="block font-bold text-slate-200 truncate">{w.name}</span>
                  <p className="font-mono text-[10px] text-slate-500 mt-1">{w.hours} Hrs logged</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{w.completedCount}/{w.tasksCount} Compl</p>
                </div>
              ))}
            </div>
          </div>

          {/* Grader active scoring controls (5 cols) */}
          <div className="lg:col-span-5 bg-slate-800/60 rounded-xl p-5 border border-slate-700/70 shadow-sm flex flex-col justify-between">
            <form onSubmit={handleAssessmentSubmit} className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Milestone Grading Assessment</h3>
                <p className="text-[11px] text-slate-400 mb-4">Set stars ratings, overall grades, and leaves instructions for current student group.</p>
              </div>

              {isSubmitSuccessAlert && (
                <div className="bg-emerald-950/40 border border-emerald-800 p-2.5 text-emerald-300 text-xs rounded-md">
                  ✔️ Grade and comment published successfully! Updates student's log in real-time.
                </div>
              )}

              {/* STARS SELECTOR CARD */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">
                  Rating of LABs Milestone Progress:
                </label>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      id={`grade-star-select-${String(i+1)}`}
                      key={i}
                      type="button"
                      onClick={() => setStarsRating(i + 1)}
                      className="text-amber-400 hover:scale-110 transition-transform cursor-pointer p-0.5"
                    >
                      <Star 
                        className={`w-6 h-6 ${
                          i < starsRating ? "fill-amber-400" : "text-slate-650"
                        }`} 
                      />
                    </button>
                  ))}
                  <span className="text-xs text-slate-400 font-mono font-bold ml-2">({starsRating} Stars)</span>
                </div>
              </div>

              {/* GRADE SCORE DROPDOWN */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Grading Quotient
                  </label>
                  <select
                    id="teacher-grade-select"
                    value={gradeScore}
                    onChange={(e) => setGradeScore(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-md py-1.5 px-2 outline-hidden focus:border-indigo-500"
                  >
                    <option value="A">Grade A (Exemplary)</option>
                    <option value="A-">Grade A- (Highly Competent)</option>
                    <option value="B+">Grade B+ (Merit Progress)</option>
                    <option value="B">Grade B (Satisfactory)</option>
                    <option value="C">Grade C (Inadequate Efforts)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Inject Instructor Task
                  </label>
                  <button
                    id="open-instructor-injector-btn"
                    type="button"
                    onClick={() => setIsInjectorOpen(true)}
                    className="w-full py-1.5 bg-pink-905 border border-pink-700/30 text-pink-300 hover:bg-pink-905/70 text-xs font-semibold rounded-md transition-colors"
                  >
                    🚀 Assign Directed Task
                  </button>
                </div>
              </div>

              {/* COMMENTS FORM */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Comments or Core Grader Recommendations
                </label>
                <textarea
                  id="teacher-comments-input"
                  required
                  rows={3}
                  value={teacherReviewComment}
                  onChange={(e) => setTeacherReviewComment(e.target.value)}
                  placeholder="e.g. Ensure Anurag completed remaining tasks. Excellent progress Piyush."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-xs text-slate-200 outline-hidden"
                />
              </div>

              <button
                id="submit-teacher-grade-comment"
                type="submit"
                className="w-full py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
              >
                Publish Grading and Comments
              </button>
            </form>
          </div>

        </div>

        {/* Dynamic active feedback listing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Printable Report card spreadsheet summary sheet */}
          <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/70 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-755 mb-4">
                <div className="flex items-center space-x-2.5">
                  <Sheet className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white">Academic Performance Auditor</h3>
                </div>
                <span className="text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                  Ready to Copy
                </span>
              </div>

              <p className="text-xs text-slate-400 mt-2 mb-4 leading-normal">
                Formatted data matrix showing detailed hours logged, completion rates, and instructor reviews. Easily copy reports to Excel sheets.
              </p>

              {/* Simulated Sheet text preview */}
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-755 font-mono text-[9px] leading-relaxed text-slate-350 max-h-36 overflow-y-auto whitespace-pre-wrap">
                {generateAuditReportText()}
              </div>
            </div>

            <div className="flex items-center space-x-3 mt-4 pt-4 border-t border-slate-700/60 font-semibold text-xs">
              <button
                id="copy-audit-report-btn"
                onClick={handleCopyReportToClipboard}
                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{hasCopiedReport ? "Copied Draft!" : "Copy Report to Clipboard"}</span>
              </button>
              
              <button
                id="print-audit-report-btn"
                onClick={() => window.print()}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-md border border-slate-700 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sprints Tasks Ledger under audit */}
          <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/70 shadow-sm">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-755 mb-4">
              <div className="flex items-center space-x-2.5">
                <FolderKanban className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm text-white">Assigned Lab Task Balance Sheet</h3>
              </div>
              <span className="text-[9px] font-mono font-semibold text-slate-500 bg-slate-900 px-2 py-0.5 rounded-sm">
                {activeTasks.length} total tasks
              </span>
            </div>

            <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
              {activeTasks.map(t => {
                const partner = teamMembers.find(m => m.id === t.assignedTo) || teamMembers[0];
                return (
                  <div key={t.id} className="flex items-center justify-between p-2.5 bg-slate-905 rounded border border-slate-755 text-xs">
                    <div className="truncate max-w-[200px]">
                      <span className="block font-bold text-slate-200 truncate leading-tight">{t.title}</span>
                      <span className="text-[9.5px] text-slate-400 mt-1 block">Assignee: {partner.name}</span>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <span className="font-mono text-slate-500 font-semibold">{t.progressPercentage}% done</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        t.status === "Completed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        t.status === "In_Progress" ? "bg-amber-500/10 text-amber-300 border border-amber-500/20" :
                        "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}>
                        {t.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Directed Instructor Task Injector Dialog Overlay popup */}
        {isInjectorOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 text-slate-100 rounded-xl max-w-sm w-full border border-slate-700 shadow-2xl p-6 space-y-4">
              
              <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                <span className="text-white font-bold text-sm flex items-center space-x-1.5">
                  <PlusCircle className="w-5 h-5 text-pink-400" />
                  <span>Assign Directed Task Prompt</span>
                </span>
                <button 
                  id="close-injector-modal"
                  onClick={() => setIsInjectorOpen(false)} 
                  className="text-slate-400 hover:text-white font-bold leading-none text-xl"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleTaskInjectionSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">
                    Describe targeted task or revision
                  </label>
                  <input
                    id="injector-task-title"
                    type="text"
                    required
                    placeholder="e.g. LAB 3: Correct cash flows under Economic analysis"
                    value={directorTaskTitle}
                    onChange={(e) => setDirectorTaskTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">
                      Assignee Partner
                    </label>
                    <select
                      id="injector-assignee"
                      value={directorTaskAssignee}
                      onChange={(e) => setDirectorTaskAssignee(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-2 text-slate-200"
                    >
                      {teamMembers.filter(m => m.role === "Student").map(m => (
                        <option key={m.id} value={m.id}>{m.name.split(" ")[0]} ({m.name.split(" ")[1]})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">
                      Grading Impact Weight
                    </label>
                    <select
                      id="injector-weight"
                      value={directorTaskWeight}
                      onChange={(e) => setDirectorTaskWeight(parseInt(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-2 text-slate-200 font-mono"
                    >
                      <option value="1">1x Simple fix</option>
                      <option value="3">3x Standard LAB weight</option>
                      <option value="5">5x Core Milestone criteria</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5 pt-3 justify-end border-t border-slate-700/60 font-semibold text-xs">
                  <button
                    id="cancel-injector-btn"
                    type="button"
                    onClick={() => setIsInjectorOpen(false)}
                    className="px-3 py-1.5 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="submit-injector-btn"
                    type="submit"
                    className="px-4 py-1.5 bg-pink-600 hover:bg-pink-500 text-white rounded transition-all cursor-pointer"
                  >
                    Assign Instantly
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </main>

    </div>
  );
}
