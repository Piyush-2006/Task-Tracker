import React, { useState } from "react";
import { Mail, ShieldAlert, KeyRound, CheckCircle2, ArrowLeft } from "lucide-react";

interface ForgotPasswordModalProps {
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export default function ForgotPasswordModal({ onClose, onSuccess }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Email Input, 2: Code verification, 3: Reset Password
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sentCode, setSentCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage("Please enter your academic email address.");
      return;
    }
    setErrorMessage("");
    setIsLoading(true);

    // Simulate sending code
    setTimeout(() => {
      // Create a random code
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      setSentCode(generatedCode);
      setIsLoading(false);
      setStep(2);
      // Give a friendly visual prompt with the sent code so the user doesn't get stuck!
      console.log(`[PASS_RESET] Mock verification code sent: ${generatedCode}`);
    }, 1500);
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (code !== sentCode) {
      setErrorMessage("Incorrect 6-digit confirmation code. Try the code shown in the hint box below.");
      return;
    }
    setErrorMessage("");
    setStep(3);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 5) {
      setErrorMessage("Password must contain at least 5 alphanumeric characters for security.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      
      const emailLower = email.trim().toLowerCase();
      try {
        const saved = localStorage.getItem("tracker_auth_users_v1");
        const defaultUsers = {
          "piyushorps2006@gmail.com": { name: "Piyush Kumar", password: "piyush123", role: "Student" },
          "anita.sharma@university.edu": { name: "Prof. Anita Sharma", password: "anita123", role: "Teacher" }
        };
        const usersList = saved ? JSON.parse(saved) : defaultUsers;
        if (usersList[emailLower]) {
          usersList[emailLower].password = newPassword;
        } else {
          usersList[emailLower] = {
            name: emailLower.split("@")[0],
            password: newPassword,
            role: "Student"
          };
        }
        localStorage.setItem("tracker_auth_users_v1", JSON.stringify(usersList));
      } catch (err) {
        console.error("Local recovery storage error", err);
      }

      onSuccess(`Password successfully reset for ${email}! You can now log in with your new password.`);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div 
        id="forgot-password-dialog" 
        className="bg-white text-gray-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 transition-all transform scale-100"
      >
        {/* Banner */}
        <div className="bg-indigo-600 px-6 py-4 text-white flex items-center space-x-3">
          <KeyRound className="w-6 h-6 text-indigo-200" />
          <div>
            <h3 className="font-semibold text-lg leading-tight">Password Security Manager</h3>
            <p className="text-xs text-indigo-100">Student Task & Project Tracker Credentials</p>
          </div>
        </div>

        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 bg-rose-50 border-l-4 border-rose-500 p-3 text-rose-700 text-xs flex items-start space-x-2 rounded-r-md">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="text-sm text-gray-600 leading-relaxed">
                Enter your registered academic email address below. We'll generate a secure mock verification code immediately.
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">
                  Academic Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    id="recovery-email-input"
                    type="email"
                    required
                    placeholder="e.g. piyushorps2006@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                id="send-recovery-code-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium text-sm rounded-md transition-colors shadow-xs flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Sending code...</span>
                  </>
                ) : (
                  <span>Request verification code</span>
                )}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="text-sm text-gray-600 leading-relaxed">
                We sent a 6-digit confirmation code to <strong className="text-gray-900">{email}</strong>. 
                Please enter the code to verify ownership.
              </div>

              {/* Code hint drawer to prevent frustration! */}
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-800">
                  <p className="font-semibold">Simulated Verification Inbox:</p>
                  <p className="mt-1">
                    Code: <strong className="text-sm bg-white px-2 py-0.5 rounded-sm tracking-widest border border-indigo-200">{sentCode}</strong>
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">
                  Verification Code
                </label>
                <input
                  id="recovery-code-input"
                  type="text"
                  required
                  placeholder="e.g. 123456"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-center font-mono tracking-widest outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  id="go-back-recovery-btn"
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-xs text-gray-600 hover:bg-gray-50 flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  id="verify-recovery-code-btn"
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-md transition-colors shadow-xs"
                >
                  Verify Code
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded border border-emerald-200">
                ✔️ Identity verified. Please set your new secure account password below.
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">
                  New Password
                </label>
                <input
                  id="recovery-newpass"
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">
                  Confirm Password
                </label>
                <input
                  id="recovery-newpass-confirm"
                  type="password"
                  required
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                id="do-reset-password-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium text-sm rounded-md transition-colors shadow-xs flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Updating password...</span>
                  </>
                ) : (
                  <span>Reset password & return</span>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Modal Close Action Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            id="close-forgot-pwd"
            type="button"
            onClick={onClose}
            className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
          >
            Cancel and Return
          </button>
        </div>
      </div>
    </div>
  );
}
