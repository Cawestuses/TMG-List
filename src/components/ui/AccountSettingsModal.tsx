import { useState, FormEvent } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "react-i18next";
import { X, KeyRound, User, CheckCircle2, AlertCircle, ShieldAlert } from "lucide-react";

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountSettingsModal({ isOpen, onClose }: AccountSettingsModalProps) {
  const { user, updateUserLogin, updateUserPassword } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<"login" | "password">("login");

  // Login form state
  const [newLogin, setNewLogin] = useState("");
  const [loginCurrentPassword, setLoginCurrentPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState("");

  // Password form state
  const [passCurrentPassword, setPassCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");

  if (!isOpen || !user) return null;

  const currentUsername = user.username || (user.email ? user.email.split('@')[0] : "");

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginSuccess("");

    if (!newLogin.trim()) {
      setLoginError(t("account.loginEmpty", "Пожалуйста, введите новый логин"));
      return;
    }

    if (!loginCurrentPassword) {
      setLoginError(t("account.currentPasswordRequired", "Введите текущий пароль для подтверждения"));
      return;
    }

    setLoginLoading(true);
    const updatedUsername = newLogin.trim().includes('@') ? newLogin.trim().split('@')[0] : newLogin.trim();
    try {
      const res = await updateUserLogin(loginCurrentPassword, newLogin);
      if (res.verificationSent) {
        setLoginSuccess(t("account.verificationSentMsg", `Профиль обновлен! На адрес ${res.newEmail} отправлено письмо с подтверждением.`));
      } else if (res.firebaseAuthUpdateBlocked) {
        setLoginSuccess(t("account.profileUpdatedMsg", "Профиль TMG List успешно обновлён!"));
      } else {
        setLoginSuccess(t("account.loginSuccess", "Логин успешно изменён!"));
      }
      setNewLogin("");
      setLoginCurrentPassword("");

      setTimeout(() => {
        onClose();
        if (location.pathname.startsWith("/player/")) {
          navigate(`/player/${encodeURIComponent(updatedUsername)}`);
          window.location.reload();
        } else {
          window.location.reload();
        }
      }, 1500);
    } catch (err: any) {
      console.error(err);
      let msg = err.message || t("account.loginError", "Не удалось изменить логин.");
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        msg = t("account.wrongPassword", "Неверный текущий пароль.");
      } else if (err.code === "auth/email-already-in-use" || msg.includes("already taken")) {
        msg = t("account.loginTaken", "Этот логин уже занят другим пользователем.");
      } else if (err.code === "auth/requires-recent-login") {
        msg = t("account.reauthRequired", "Требуется повторный вход в аккаунт.");
      } else if (err.code === "auth/operation-not-allowed") {
        msg = t("account.operationNotAllowed", "Профиль обновился, но Firebase требует подтверждения почты.");
      }
      setLoginError(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");

    if (!passCurrentPassword) {
      setPassError(t("account.currentPasswordRequired", "Введите текущий пароль"));
      return;
    }

    if (newPassword.length < 6) {
      setPassError(t("account.passwordTooShort", "Новый пароль должен содержать минимум 6 символов"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError(t("account.passwordsDontMatch", "Пароли не совпадают"));
      return;
    }

    setPassLoading(true);
    try {
      await updateUserPassword(passCurrentPassword, newPassword);
      setPassSuccess(t("account.passwordSuccess", "Пароль успешно изменён!"));
      setPassCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error(err);
      let msg = err.message || t("account.passwordError", "Не удалось изменить пароль.");
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        msg = t("account.wrongPassword", "Неверный текущий пароль.");
      } else if (err.code === "auth/weak-password") {
        msg = t("account.weakPassword", "Пароль слишком слабый.");
      } else if (err.code === "auth/requires-recent-login") {
        msg = t("account.reauthRequired", "Требуется повторный вход в аккаунт.");
      }
      setPassError(msg);
    } finally {
      setPassLoading(false);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[99999] p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-lg my-auto shadow-2xl relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#d8d0b6]/10 text-[#d8d0b6] rounded-xl border border-[#d8d0b6]/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight font-heading">
                {t("account.settingsTitle", "Безопасность и аккаунт")}
              </h2>
              <p className="text-xs text-zinc-400">
                {t("account.settingsSubtitle", "Управление логином и паролем аккаунта")}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/10 bg-black/40 p-2 gap-2 shrink-0">
          <button
            onClick={() => { setActiveTab("login"); setLoginError(""); setLoginSuccess(""); }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === "login" 
                ? "bg-[#d8d0b6]/15 text-[#d8d0b6] border border-[#d8d0b6]/30 shadow-md" 
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <User className="w-4 h-4" />
            {t("account.changeLoginTab", "Смена логина")}
          </button>
          <button
            onClick={() => { setActiveTab("password"); setPassError(""); setPassSuccess(""); }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === "password" 
                ? "bg-[#d8d0b6]/15 text-[#d8d0b6] border border-[#d8d0b6]/30 shadow-md" 
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <KeyRound className="w-4 h-4" />
            {t("account.changePasswordTab", "Смена пароля")}
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto">
          {activeTab === "login" ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs">
                <span className="text-zinc-400 block mb-1 uppercase font-bold text-[10px] tracking-wider">
                  {t("account.currentLoginLabel", "Текущий логин:")}
                </span>
                <span className="font-mono text-white text-sm font-bold bg-black/50 px-2.5 py-1 rounded inline-block border border-white/5">
                  @{currentUsername}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                  {t("account.newLoginLabel", "Новый логин / email")}
                </label>
                <input 
                  type="text" 
                  value={newLogin}
                  onChange={e => setNewLogin(e.target.value)}
                  placeholder="e.g. MyNewUsername" 
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#d8d0b6]/50 transition-colors font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                  {t("account.currentPasswordLabel", "Текущий пароль (для подтверждения)")}
                </label>
                <input 
                  type="password" 
                  value={loginCurrentPassword}
                  onChange={e => setLoginCurrentPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#d8d0b6]/50 transition-colors font-mono"
                  required
                />
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {loginSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{loginSuccess}</span>
                </div>
              )}

              <button 
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 bg-gradient-to-r from-[#bfae7d] to-[#cfbe94] text-black font-bold rounded-xl shadow-lg hover:brightness-110 transition-all text-xs uppercase tracking-wider disabled:opacity-50 mt-2"
              >
                {loginLoading ? t("common.saving", "Сохранение...") : t("account.saveLoginBtn", "Обновить логин")}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                  {t("account.currentPasswordLabel", "Текущий пароль")}
                </label>
                <input 
                  type="password" 
                  value={passCurrentPassword}
                  onChange={e => setPassCurrentPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#d8d0b6]/50 transition-colors font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                  {t("account.newPasswordLabel", "Новый пароль (мин. 6 символов)")}
                </label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#d8d0b6]/50 transition-colors font-mono"
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                  {t("account.confirmPasswordLabel", "Подтвердите новый пароль")}
                </label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#d8d0b6]/50 transition-colors font-mono"
                  required
                  minLength={6}
                />
              </div>

              {passError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passError}</span>
                </div>
              )}

              {passSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{passSuccess}</span>
                </div>
              )}

              <button 
                type="submit"
                disabled={passLoading}
                className="w-full py-3 bg-gradient-to-r from-[#bfae7d] to-[#cfbe94] text-black font-bold rounded-xl shadow-lg hover:brightness-110 transition-all text-xs uppercase tracking-wider disabled:opacity-50 mt-2"
              >
                {passLoading ? t("common.saving", "Сохранение...") : t("account.savePasswordBtn", "Обновить пароль")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
