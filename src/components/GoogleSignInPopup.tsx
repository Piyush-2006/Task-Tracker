import React, { useState } from "react";
import { UserRole } from "../types";
import { Chrome, Lock, AlertCircle, ArrowRight } from "lucide-react";

interface GoogleSignInPopupProps {
  onClose: () => void;
  onSuccess: (email: string, name: string, role: UserRole) => void;
  defaultEmail?: string;
}

export default function GoogleSignInPopup({ onClose, onSuccess, defaultEmail = "piyushorps2006@gmail.com" }: GoogleSignInPopupProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.Student);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleSelectAccount = (email: string, name: string) => {
    setIsConnecting(true);
    setTimeout(() => {
      onSuccess(email, name, selectedRole);
      setIsConnecting(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div 
        id="google-signin-dialog" 
        className="bg-white text-gray-800 rounded-lg shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 transition-all transform scale-100"
      >
        {/* Google Pop-up Header Bar (mimics Chrome window) */}
        <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center space-x-2 text-xs font-semibold text-gray-600">
            <Chrome className="w-4 h-4 text-blue-500" />
            <span>Sign in with Google</span>
          </div>
          <button 
            id="close-google-signin"
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 font-bold text-lg leading-none"
          >
            &times;
          </button>
        </div>

        {/* Google Consent Brand Canvas */}
        <div className="p-6">
          <div className="flex flex-col items-center text-center">
            {/* Google Logo (styled standard typography colors) */}
            <h1 className="text-2xl font-bold tracking-tight mb-2 flex items-center justify-center">
              <span className="text-blue-600">G</span>
              <span className="text-red-500">o</span>
              <span className="text-yellow-500">o</span>
              <span className="text-blue-600">g</span>
              <span className="text-green-500">l</span>
              <span className="text-red-500">e</span>
            </h1>
            <h2 className="text-lg font-medium text-gray-900 mt-1">Sign in with Google</h2>
            <p className="text-xs text-gray-500 mt-1">
              to continue to <strong className="text-indigo-600">Task & Project Tracker</strong>
            </p>
          </div>

          {/* Role selector BEFORE choosing account for simulation setup */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
              1. Choose User Authorization Role:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="select-role-student"
                type="button"
                onClick={() => setSelectedRole(UserRole.Student)}
                className={`flex items-center justify-center py-2 px-3 rounded-md text-xs font-medium border transition-colors ${
                  selectedRole === UserRole.Student
                    ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                🎓 Student Account
              </button>
              <button
                id="select-role-teacher"
                type="button"
                onClick={() => setSelectedRole(UserRole.Teacher)}
                className={`flex items-center justify-center py-2 px-3 rounded-md text-xs font-medium border transition-colors ${
                  selectedRole === UserRole.Teacher
                    ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                🏫 Teacher / Grader
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-2 text-center">
              This determines whether you will see the Student Hub or Teacher Dashboard.
            </p>
          </div>

          {/* Account Selection Section */}
          <div className="mt-5">
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
              2. Select Google Account:
            </label>

            {isConnecting ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-3">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-gray-600">Verifying session token...</p>
                <p className="text-xs text-gray-400">Communicating with Google OAuth Servers</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Default User item */}
                <button
                  id="google-acc-first"
                  onClick={() => handleSelectAccount(defaultEmail, selectedRole === UserRole.Student ? "Piyush Kumar" : "Prof. Anita Sharma")}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-indigo-200 transition-all text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                      {selectedRole === UserRole.Student ? "PK" : "AS"}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800 group-hover:text-indigo-600 transition-colors">
                        {selectedRole === UserRole.Student ? "Piyush Kumar (Your Account)" : "Prof. Anita Sharma (Mock Teacher)"}
                      </div>
                      <div className="text-xs text-gray-500">{selectedRole === UserRole.Student ? defaultEmail : "anita.sharma@university.edu"}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </button>

                {/* Simulated Alternative mock accounts */}
                <button
                  id="google-acc-second"
                  onClick={() => handleSelectAccount(
                    selectedRole === UserRole.Student ? "najmuddin.ahmad@university.edu" : "coordinator@university.edu", 
                    selectedRole === UserRole.Student ? "Najmuddin Ahmad" : "External Industry Evaluator"
                  )}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-indigo-200 transition-all text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white font-semibold text-sm">
                      {selectedRole === UserRole.Student ? "NA" : "EE"}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">
                        {selectedRole === UserRole.Student ? "Najmuddin Ahmad (Partner)" : "External Industry Grader"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {selectedRole === UserRole.Student ? "najmuddin.ahmad@university.edu" : "evaluator.external@university.edu"}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  id="google-acc-third"
                  onClick={() => handleSelectAccount(
                    selectedRole === UserRole.Student ? "anurag.kashyap@university.edu" : "dean.cse@university.edu", 
                    selectedRole === UserRole.Student ? "Anurag Kashyap" : "Dean of CSE"
                  )}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-indigo-200 transition-all text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white font-semibold text-sm">
                      {selectedRole === UserRole.Student ? "AK" : "DS"}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">
                        {selectedRole === UserRole.Student ? "Anurag Kashyap (Partner)" : "Project Review Dean"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {selectedRole === UserRole.Student ? "anurag.kashyap@university.edu" : "dean.cse@university.edu"}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Google Popup Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex flex-col space-y-2">
          <div className="flex items-center space-x-1">
            <Lock className="w-3.5 h-3.5 text-gray-400" />
            <span>Secure 256-bit encrypted authentication by Google Identity services.</span>
          </div>
          <p>
            To continue, Google will share your name, email address, language preference, and profile picture with 
            the Student Task & Project Tracker. Verify the app credentials before connecting.
          </p>
        </div>
      </div>
    </div>
  );
}
