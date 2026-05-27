import React, { useState, useEffect } from "react";
import { UserRole, TeamMember, Project, Task, ProjectFeedback, AttachedFile, ActivityLog, TaskStatus } from "./types";
import { 
  initialTeamMembers, initialProjects, initialTasks, 
  initialFeedback, initialActivityLogs, initialAttachedFiles 
} from "./data";
import RegistrationLogin from "./components/RegistrationLogin";
import StudentDashboard from "./components/StudentDashboard";
import TeacherDashboard from "./components/TeacherDashboard";
import GoogleSignInPopup from "./components/GoogleSignInPopup";
import ForgotPasswordModal from "./components/ForgotPasswordModal";

export default function App() {
  // Authentication & session state
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  
  // Modals visible selectors
  const [isGooglePopupOpen, setIsGooglePopupOpen] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState("");

  // Persistent Core States
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem("tracker_members_v1");
    return saved ? JSON.parse(saved) : initialTeamMembers;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem("tracker_projects_v1");
    return saved ? JSON.parse(saved) : initialProjects;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("tracker_tasks_v1");
    return saved ? JSON.parse(saved) : initialTasks;
  });

  const [feedback, setFeedback] = useState<ProjectFeedback[]>(() => {
    const saved = localStorage.getItem("tracker_feedback_v1");
    return saved ? JSON.parse(saved) : initialFeedback;
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem("tracker_activity_v1");
    return saved ? JSON.parse(saved) : initialActivityLogs;
  });

  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>(() => {
    const saved = localStorage.getItem("tracker_files_v1");
    return saved ? JSON.parse(saved) : initialAttachedFiles;
  });

  // Automatically sync variables to localStorage to prevent data loss on edits
  useEffect(() => {
    localStorage.setItem("tracker_members_v1", JSON.stringify(teamMembers));
  }, [teamMembers]);

  useEffect(() => {
    localStorage.setItem("tracker_projects_v1", JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem("tracker_tasks_v1", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("tracker_feedback_v1", JSON.stringify(feedback));
  }, [feedback]);

  useEffect(() => {
    localStorage.setItem("tracker_activity_v1", JSON.stringify(activityLogs));
  }, [activityLogs]);

  useEffect(() => {
    localStorage.setItem("tracker_files_v1", JSON.stringify(attachedFiles));
  }, [attachedFiles]);

  // LOGIN SUCCESS CALLS
  const handleLoginSuccess = (email: string, name: string, role: UserRole) => {
    // Check if user already exists in the team roster, or create them
    let found = teamMembers.find(m => m.email.toLowerCase() === email.toLowerCase());
    
    if (!found) {
      const isTeacher = role === UserRole.Teacher;
      const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
      
      const newMember: TeamMember = {
        id: email.split("@")[0].replace(/\W/g, ""),
        name: name,
        email: email,
        rollNo: isTeacher ? undefined : `26SCSE${Math.floor(1000000 + Math.random() * 900000)}`,
        avatarColor: isTeacher ? "from-rose-500 to-purple-600" : "from-emerald-500 to-teal-500",
        role: isTeacher ? "Teacher" : "Student"
      };

      setTeamMembers(prev => [...prev, newMember]);
      found = newMember;
    }

    setCurrentUser(found);
    setCurrentRole(role);
    setIsGooglePopupOpen(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentRole(null);
    setSuccessBanner("Successfully signed out of the current session.");
  };

  // Switch role inside sandbox for ease of evaluation
  const handleQuickSwitchRole = () => {
    if (currentRole === UserRole.Student) {
      // Find Prof Anita Sharma or create her
      let grader = teamMembers.find(m => m.id === "teacher_anita");
      if (!grader) {
        grader = teamMembers.find(m => m.role === "Teacher") || teamMembers[3];
      }
      setCurrentUser(grader);
      setCurrentRole(UserRole.Teacher);
    } else {
      // Find Piyush Kumar
      let piyush = teamMembers.find(m => m.id === "piyush");
      if (!piyush) {
        piyush = teamMembers.find(m => m.role === "Student") || teamMembers[0];
      }
      setCurrentUser(piyush);
      setCurrentRole(UserRole.Student);
    }
  };

  // CORE METRIC ENGINE MUTATORS
  const handleAddTask = (newTaskData: Omit<Task, "id" | "hoursLogged" | "progressPercentage">) => {
    const generatedId = `task_${Date.now()}`;
    const formattedTask: Task = {
      ...newTaskData,
      id: generatedId,
      progressPercentage: 0,
      hoursLogged: 0,
    };

    setTasks(prev => [formattedTask, ...prev]);

    // Create activity log
    const userDisplay = currentUser ? currentUser.name : "System";
    const proj = projects.find(p => p.id === newTaskData.projectId);
    const newLog: ActivityLog = {
      id: `log_${Date.now()}`,
      userName: userDisplay,
      action: `allocated new task: "${newTaskData.title}"`,
      projectName: proj ? proj.title : "Workspace",
      timestamp: new Date().toISOString(),
      type: "task"
    };

    setActivityLogs(prev => [newLog, ...prev]);
  };

  const handleUpdateTask = (id: string, progress: number, hours: number, status: TaskStatus) => {
    const oldTask = tasks.find(t => t.id === id);
    if (!oldTask) return;

    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          progressPercentage: progress,
          hoursLogged: hours,
          status: status
        };
      }
      return t;
    }));

    // Generate dynamic activity logs if properties changed
    if (oldTask.progressPercentage !== progress || oldTask.status !== status) {
      const userDisplay = currentUser ? currentUser.name : "System";
      const proj = projects.find(p => p.id === oldTask.projectId);
      const actionText = oldTask.status !== status 
        ? `shifted status on "${oldTask.title}" to ${status.replace("_", " ")}` 
        : `defined completion rate as ${progress}% on "${oldTask.title}"`;

      const newLog: ActivityLog = {
        id: `log_${Date.now()}`,
        userName: userDisplay,
        action: actionText,
        projectName: proj ? proj.title : "Workspace",
        timestamp: new Date().toISOString(),
        type: "status"
      };

      setActivityLogs(prev => [newLog, ...prev]);
    }
  };

  const handleDeleteTask = (id: string) => {
    const oldTask = tasks.find(t => t.id === id);
    if (!oldTask) return;

    setTasks(prev => prev.filter(t => t.id !== id));

    const userDisplay = currentUser ? currentUser.name : "System";
    const proj = projects.find(p => p.id === oldTask.projectId);
    const newLog: ActivityLog = {
      id: `log_${Date.now()}`,
      userName: userDisplay,
      action: `omitted task item: "${oldTask.title}"`,
      projectName: proj ? proj.title : "Workspace",
      timestamp: new Date().toISOString(),
      type: "task"
    };

    setActivityLogs(prev => [newLog, ...prev]);
  };

  // FILE ATTACHMENTS ENGINE MUTATORS
  const handleUploadFile = (projectId: string, name: string, size: string, taskId?: string) => {
    const fileId = `file_${Date.now()}`;
    const userDisplay = currentUser ? currentUser.name : "System Member";
    
    const newFile: AttachedFile = {
      id: fileId,
      projectId: projectId,
      name: name,
      size: size,
      uploadedBy: userDisplay,
      timestamp: new Date().toISOString(),
      taskId: taskId
    };

    setAttachedFiles(prev => [newFile, ...prev]);

    // Feed file attachment to target task card directly
    if (taskId) {
      setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          const currentAtt = t.attachments || [];
          return {
            ...t,
            attachments: [...currentAtt, name]
          };
        }
        return t;
      }));
    }

    // Dynamic Activity Logger
    const targetProj = projects.find(p => p.id === projectId);
    const newLog: ActivityLog = {
      id: `log_${Date.now()}`,
      userName: userDisplay,
      action: `uploaded document: "${name}" to project assets`,
      projectName: targetProj ? targetProj.title : "Workspace Assets",
      timestamp: new Date().toISOString(),
      type: "upload"
    };

    setActivityLogs(prev => [newLog, ...prev]);
  };

  const handleDeleteFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  };

  // FACULTY FEEDBACK RECORDER
  const handleAddTeacherFeedback = (projectId: string, comment: string, rating: number) => {
    const teacherName = currentUser ? currentUser.name : "Prof. Anita Sharma";
    const teacherId = currentUser ? currentUser.id : "teacher_anita";

    const newFeedback: ProjectFeedback = {
      id: `feed_${Date.now()}`,
      projectId: projectId,
      teacherId: teacherId,
      teacherName: teacherName,
      comment: comment,
      rating: rating,
      timestamp: new Date().toISOString()
    };

    // Keep only latest feedback for visual cleanliness, or prepend
    setFeedback(prev => [newFeedback, ...prev]);

    // Active Activity Logger
    const targetProj = projects.find(p => p.id === projectId);
    const newLog: ActivityLog = {
      id: `log_${Date.now()}`,
      userName: teacherName,
      action: `published an academic assessment review rating at ${rating}/5 stars`,
      projectName: targetProj ? targetProj.title : "Team Capstone",
      timestamp: new Date().toISOString(),
      type: "comment"
    };

    setActivityLogs(prev => [newLog, ...prev]);
  };

  // NEW PROJECT CREATOR
  const handleAddProject = (title: string, description: string, category: string, endDate: string, teamMembersIn: string[]) => {
    const newId = `proj_${Date.now()}`;
    const newProj: Project = {
      id: newId,
      title,
      description,
      leaderId: currentUser ? currentUser.id : "piyush",
      teamMembers: teamMembersIn.length > 0 ? teamMembersIn : [currentUser ? currentUser.id : "piyush"],
      startDate: new Date().toISOString().split("T")[0],
      endDate,
      status: "Planning",
      category
    };

    setProjects(prev => [...prev, newProj]);

    const userDisplay = currentUser ? currentUser.name : "System Member";
    const newLog: ActivityLog = {
      id: `log_${Date.now()}`,
      userName: userDisplay,
      action: `initiated a new capstone project: "${title}"`,
      projectName: title,
      timestamp: new Date().toISOString(),
      type: "project"
    };

    setActivityLogs(prev => [newLog, ...prev]);
  };

  // NEW TEAM MEMBER CREATOR
  const handleAddTeamMember = (name: string, email: string, rollNo: string) => {
    // Check duplication
    const emailLower = email.trim().toLowerCase();
    const exists = teamMembers.some(m => m.email.toLowerCase() === emailLower);
    if (exists) return;

    const colors = [
      "from-teal-500 to-emerald-500",
      "from-indigo-500 to-violet-500",
      "from-pink-500 to-rose-500",
      "from-blue-500 to-cyan-500",
      "from-amber-500 to-orange-500",
      "from-fuchsia-500 to-pink-600"
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newMember: TeamMember = {
      id: email.split("@")[0].replace(/\W/g, "") || `student_${Date.now()}`,
      name,
      email,
      rollNo,
      avatarColor: randomColor,
      role: "Student"
    };

    setTeamMembers(prev => [...prev, newMember]);

    const userDisplay = currentUser ? currentUser.name : "System Member";
    const newLog: ActivityLog = {
      id: `log_${Date.now()}`,
      userName: userDisplay,
      action: `registered coworker "${name}" to global capstone roster`,
      projectName: "Classroom",
      timestamp: new Date().toISOString(),
      type: "project"
    };

    setActivityLogs(prev => [newLog, ...prev]);
  };

  // UPDATE PROJECT
  const handleUpdateProject = (projectId: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          ...updates
        };
      }
      return p;
    }));

    const targetProj = projects.find(p => p.id === projectId);
    const userDisplay = currentUser ? currentUser.name : "System Member";
    const actionText = updates.status 
      ? `shifted status on project to: ${updates.status.replace("_", " ")}` 
      : `updated core configurations for project`;

    const newLog: ActivityLog = {
      id: `log_${Date.now()}`,
      userName: userDisplay,
      action: actionText,
      projectName: targetProj ? targetProj.title : "Workspace",
      timestamp: new Date().toISOString(),
      type: "project"
    };

    setActivityLogs(prev => [newLog, ...prev]);
  };

  return (
    <div className="bg-slate-900 min-h-screen text-slate-100 selection:bg-indigo-650 selection:text-white">
      
      {/* 1. USER AUTHENTICATION STATE */}
      {!currentUser && (
        <RegistrationLogin
          onLoginSuccess={handleLoginSuccess}
          onOpenGoogleSignIn={() => setIsGooglePopupOpen(true)}
          onOpenForgotPassword={() => setIsForgotModalOpen(true)}
          successMessage={successBanner}
          setSuccessMessage={setSuccessBanner}
        />
      )}

      {/* 2. LOGGED IN STUDENT HUB VIEW */}
      {(currentUser && currentRole === UserRole.Student) && (
        <StudentDashboard
          currentUser={currentUser}
          teamMembers={teamMembers}
          projects={projects}
          tasks={tasks}
          feedback={feedback}
          activityLogs={activityLogs}
          attachedFiles={attachedFiles}
          onAddTask={handleAddTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onUploadFile={handleUploadFile}
          onDeleteFile={handleDeleteFile}
          onSwitchToTeacher={handleQuickSwitchRole}
          onLogout={handleLogout}
          onAddProject={handleAddProject}
          onAddTeamMember={handleAddTeamMember}
          onUpdateProject={handleUpdateProject}
        />
      )}

      {/* 3. LOGGED IN TEACHER DASHBOARD VIEW */}
      {(currentUser && currentRole === UserRole.Teacher) && (
        <TeacherDashboard
          currentUser={currentUser}
          teamMembers={teamMembers}
          projects={projects}
          tasks={tasks}
          feedback={feedback}
          onAddTeacherFeedback={handleAddTeacherFeedback}
          onAddTask={handleAddTask}
          onSwitchToStudent={handleQuickSwitchRole}
          onLogout={handleLogout}
          onAddProject={handleAddProject}
          onAddTeamMember={handleAddTeamMember}
          onUpdateProject={handleUpdateProject}
        />
      )}

      {/* ==================== MODALS INJECTIONS ==================== */}
      
      {/* Google Pop-up authentication */}
      {isGooglePopupOpen && (
        <GoogleSignInPopup
          onClose={() => setIsGooglePopupOpen(false)}
          onSuccess={handleLoginSuccess}
        />
      )}

      {/* Forgot credentials modal reset */}
      {isForgotModalOpen && (
        <ForgotPasswordModal
          onClose={() => setIsForgotModalOpen(false)}
          onSuccess={(msg) => setSuccessBanner(msg)}
        />
      )}

    </div>
  );
}
