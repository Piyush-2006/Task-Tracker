import React, { useState } from "react";
import { UserRole } from "../types";
import { BookOpen, FolderCheck, Users, ShieldAlert, KeyRound, LogIn } from "lucide-react";

interface RegistrationLoginProps {
  onLoginSuccess: (email: string, name: string, role: UserRole) => void;
  onOpenGoogleSignIn: () => void;
  onOpenForgotPassword: () => void;
  successMessage?: string;
  setSuccessMessage: (msg: string) => void;
}

export default function RegistrationLogin({
  onLoginSuccess,
  onOpenGoogleSignIn,
  onOpenForgotPassword,
  successMessage,
  setSuccessMessage
}: RegistrationLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.Student);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [showSupabaseGuide, setShowSupabaseGuide] = useState(false);

  // Storing/getting users in local credentials db
  const getStoredUsers = (): Record<string, { name: string; password: string; role: UserRole }> => {
    const defaultUsers = {
      "piyushorps2006@gmail.com": { name: "Piyush Kumar", password: "piyush123", role: UserRole.Student },
      "anita.sharma@university.edu": { name: "Prof. Anita Sharma", password: "anita123", role: UserRole.Teacher }
    };
    const saved = localStorage.getItem("tracker_auth_users_v1");
    if (!saved) {
      localStorage.setItem("tracker_auth_users_v1", JSON.stringify(defaultUsers));
      return defaultUsers;
    }
    try {
      return JSON.parse(saved);
    } catch (e) {
      return defaultUsers;
    }
  };

  const saveStoredUsers = (users: Record<string, { name: string; password: string; role: UserRole }>) => {
    localStorage.setItem("tracker_auth_users_v1", JSON.stringify(users));
  };

  const handleQuickLogin = (selectedRole: UserRole) => {
    const defaultEmail = selectedRole === UserRole.Student ? "piyushorps2006@gmail.com" : "anita.sharma@university.edu";
    const users = getStoredUsers();
    const matched = users[defaultEmail];
    
    if (matched) {
      onLoginSuccess(defaultEmail, matched.name, selectedRole);
    } else {
      const defaultName = selectedRole === UserRole.Student ? "Piyush Kumar" : "Prof. Anita Sharma";
      onLoginSuccess(defaultEmail, defaultName, selectedRole);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!email || !password) {
      setError("Please fill in all layout credentials.");
      return;
    }

    if (isSignUp && !fullName.trim()) {
      setError("Please enter your Full Name for registration.");
      return;
    }

    if (password.length < 5) {
      setError("Password must contain at least 5 alphanumeric characters.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const emailLower = email.trim().toLowerCase();
      const usersList = getStoredUsers();

      if (isSignUp) {
        if (usersList[emailLower]) {
          setError("An account with this email address already exists. Please Sign In.");
          return;
        }

        usersList[emailLower] = {
          name: fullName.trim(),
          password: password,
          role: role
        };
        saveStoredUsers(usersList);
        setSuccessMessage("Account created successfully! Welcome to LAB Tracker Core.");
        onLoginSuccess(emailLower, fullName.trim(), role);
      } else {
        const matchedUser = usersList[emailLower];
        if (!matchedUser) {
          setError("Email not registered! Enter a preset detail or switch to 'Sign Up' below to register a custom account.");
          return;
        }

        if (matchedUser.password !== password) {
          setError("Password incorrect! Try again or click 'Forgot Password?' to generate a mock recovery code.");
          return;
        }

        onLoginSuccess(emailLower, matchedUser.name, role);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-500">
      
      {/* Container Card with Layout Splits */}
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700/80 mb-6 relative">
        
        {/* Left Panel: Branding & Concept Intro (5 cols) */}
        <div className="md:col-span-5 bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 p-8 flex flex-col justify-between text-white border-b md:border-b-0 md:border-r border-slate-700">
          <div>
            <div className="flex items-center space-x-2 bg-indigo-900/40 p-2 rounded-lg border border-indigo-500/20 w-fit">
              <FolderCheck className="w-5 h-5 text-indigo-300" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">LAB Tracker Core</span>
            </div>
            
            <h1 className="text-2xl font-bold mt-6 tracking-tight leading-snug">
              Student Task &<br/>Project Tracker
            </h1>
            <p className="text-xs text-indigo-200/80 mt-3 leading-relaxed">
              Academic project execution is often plagued by uneven team participation and lack of visibility. Our platform calculates precise individual contribution percentage index automatically based on assigned tasks, difficulty weight, and hours logged.
            </p>
          </div>

          {/* Academic features showcase */}
          <div className="space-y-4 mt-8">
            <div className="flex items-start space-x-3">
              <div className="p-1.5 bg-indigo-500/20 rounded-md border border-indigo-500/30">
                <Users className="w-4 h-4 text-indigo-300" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Equal Team Contribution</h4>
                <p className="text-[10px] text-indigo-200/70">Automatic balance metrics showing Najmuddin, Piyush, and Anurag contributions.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-1.5 bg-indigo-500/20 rounded-md border border-indigo-500/30">
                <BookOpen className="w-4 h-4 text-indigo-300" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Teacher Productivity Auditing</h4>
                <p className="text-[10px] text-indigo-200/70">Professors assign grades, comment reviews, and monitor timelines effortlessly.</p>
              </div>
            </div>
          </div>

          <div className="border-t border-indigo-700/40 pt-4 mt-6 text-[10px] text-indigo-200/50 flex justify-between">
            <span>Engineering Labs Capstone</span>
            <span>Est. 2026</span>
          </div>
        </div>

        {/* Right Panel: Active Authentication Fields (7 cols) */}
        <div className="md:col-span-7 p-8 flex flex-col justify-center">
          
          {/* Messages Alert Block */}
          {error && (
            <div className="mb-4 bg-rose-950/50 border border-rose-800 p-3 text-rose-300 text-xs flex items-start space-x-2 rounded-md">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{error}</p>
                {error.includes("Password incorrect") && (
                  <p className="text-[10px] text-rose-400/90 mt-1">
                    Forgot your password? Click <strong className="underline text-rose-300 cursor-pointer" onClick={onOpenForgotPassword}>Forgot Password?</strong> to reset your secure key.
                  </p>
                )}
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 bg-emerald-950/50 border border-emerald-800 p-3 text-emerald-300 text-xs flex items-start space-x-2 rounded-md">
              <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1 animate-pulse"></div>
              <span>{successMessage}</span>
            </div>
          )}

          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {isSignUp ? "Generate Custom Account" : "Portal Authentication"}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isSignUp ? "Register your university credentials below." : "Enter your credential values or use Google Secure Login."}
              </p>
            </div>
            
            {/* Supabase Button Badge */}
            <button
              type="button"
              onClick={() => setShowSupabaseGuide(!showSupabaseGuide)}
              className="px-2 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500 text-[10px] text-indigo-300 font-mono rounded-lg transition-colors flex items-center space-x-1 shrink-0 ml-2"
            >
              <span>⚡ Supabase</span>
            </button>
          </div>

          {/* Form layout */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Toggle Switch between Sign In & Sign Up */}
            <div className="flex justify-end text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                }}
                className="text-indigo-400 hover:text-indigo-300 underline font-semibold transition-all"
              >
                {isSignUp ? "Already have an account? Sign In" : "Need to register? Sign Up"}
              </button>
            </div>

            {/* Selected Role Slider */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Signing {isSignUp ? "Up" : "In"} As:
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1.5 rounded-lg border border-slate-700">
                <button
                  id="tab-student"
                  type="button"
                  onClick={() => setRole(UserRole.Student)}
                  className={`py-2 px-3 rounded-md text-xs font-medium transition-all ${
                    role === UserRole.Student
                      ? "bg-indigo-600 text-white shadow-md font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  🎓 Student Member
                </button>
                <button
                  id="tab-teacher"
                  type="button"
                  onClick={() => setRole(UserRole.Teacher)}
                  className={`py-2 px-3 rounded-md text-xs font-medium transition-all ${
                    role === UserRole.Teacher
                      ? "bg-indigo-600 text-white shadow-md font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  🏫 Faculty / Evaluator
                </button>
              </div>
            </div>

            {/* Full Name field if Signing Up */}
            {isSignUp && (
              <div className="animate-fade-in">
                <label htmlFor="login-fullname" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  id="login-fullname"
                  type="text"
                  required
                  placeholder="e.g. Piyush Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="login-email" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                University Email Address
              </label>
              <input
                id="login-email"
                type="email"
                required
                placeholder={role === UserRole.Student ? "e.g. piyushorps2006@gmail.com" : "e.g. anita.sharma@university.edu"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="login-password" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Secure Password
                </label>
                {!isSignUp && (
                  <button
                    id="forgot-password-link"
                    type="button"
                    onClick={onOpenForgotPassword}
                    className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 underline transition-colors"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <input
                id="login-password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Submit Email Account */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-750 text-white text-sm font-semibold rounded-lg shadow-md transition-all flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>{isSignUp ? "Register Custom Account" : "Sign In Securely"}</span>
                </>
              )}
            </button>
          </form>

          {/* Spacer / Or */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-800 px-3 text-[10px] font-bold text-slate-400 tracking-wider">Or Use Third Party ID</span>
            </div>
          </div>

          {/* Google SSO Login */}
          <button
            id="google-authenticate-btn"
            type="button"
            onClick={onOpenGoogleSignIn}
            className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg flex items-center justify-center space-x-2 shadow-xs hover:shadow-md transition-all"
          >
            {/* Google Vector Icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continue with Google Secure Login</span>
          </button>

          {/* Quick Graders' Sandbox Mode */}
          <div className="mt-6 border-t border-slate-700/60 pt-4 text-center">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-2">🔑 Account Presets</span>
            <div className="flex justify-center space-x-2">
              <button
                id="preset-student-btn"
                type="button"
                onClick={() => {
                  setEmail("piyushorps2006@gmail.com");
                  setPassword("piyush123");
                  setRole(UserRole.Student);
                  setIsSignUp(false);
                }}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-700 text-slate-300 text-[10px] border border-slate-700 rounded-md transition-all font-mono"
              >
                🎓 Student (piyush123)
              </button>
              <button
                id="preset-teacher-btn"
                type="button"
                onClick={() => {
                  setEmail("anita.sharma@university.edu");
                  setPassword("anita123");
                  setRole(UserRole.Teacher);
                  setIsSignUp(false);
                }}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-700 text-slate-300 text-[10px] border border-slate-700 rounded-md transition-all font-mono"
              >
                🏫 Teacher (anita123)
              </button>
            </div>
            <p className="text-[9px] text-slate-500 mt-2">
              Auto-fills defaults into coordinates above. Entering incorrect password triggers standard auth alert checks!
            </p>
          </div>

        </div>
      </div>

      {/* Supabase Integration Drawer */}
      {showSupabaseGuide && (
        <div className="max-w-4xl w-full bg-slate-800 border-l-4 border-indigo-500 p-6 rounded-xl shadow-xl border border-slate-700/80 animate-fade-in text-slate-200">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🔌</span>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono">Supabase Auth & Database Setup Protocol</h3>
                <p className="text-[10px] text-slate-400">Step-by-step instructions for production-ready integration.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSupabaseGuide(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕ Close Guide
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <h4 className="font-bold text-indigo-300 mb-2">1. Install Supabase Client</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                First, run this package command in your project terminal directory to add the JavaScript Client package:
              </p>
              <pre className="bg-slate-900 p-2.5 rounded-lg border border-slate-700 font-mono text-[10px] text-emerald-400 overflow-x-auto mb-4">
                npm install @supabase/supabase-js
              </pre>

              <h4 className="font-bold text-indigo-300 mb-2">2. Instantiate Client (`src/supabase.ts`)</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed mb-2">
                Paste this into a new initialization file to handle environment variables safely in your deployment container:
              </p>
              <pre className="bg-slate-900 p-2.5 rounded-lg border border-slate-700 font-mono text-[9px] text-slate-300 overflow-x-auto leading-normal">
{`import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "YOUR_URL";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "YOUR_KEY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);`}
              </pre>
            </div>

            <div>
              <h4 className="font-bold text-indigo-300 mb-2">3. Replace Registration & Login Methods</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed mb-2">
                Update the authentication submission block inside your login component file like this:
              </p>
              <pre className="bg-slate-900 p-2.5 rounded-lg border border-slate-700 font-mono text-[9px] text-indigo-200 overflow-x-auto leading-normal">
{`// To Sign In with email and password
const { data, error } = await supabase.auth.signInWithPassword({
  email: emailLower,
  password: password,
});

if (error) {
  setError("Supabase Auth failure: " + error.message);
  return;
}

// To Sign Up with email and metadata
const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
  email: emailLower,
  password: password,
  options: {
    data: {
      full_name: fullName,
      role: role
    }
  }
});`}
              </pre>

              <div className="mt-4 p-2.5 bg-indigo-950/40 border border-indigo-900 rounded-lg text-[10px] text-indigo-200">
                <p className="font-semibold mb-1">💡 Live Production Deployment Hint:</p>
                <p className="leading-snug">
                  By executing this swap, you connect this app directly to the Supabase Cloud user schema. Password verification is performed directly by the Postgres server securely, and the forgot password redirect emails are handled dynamically.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
