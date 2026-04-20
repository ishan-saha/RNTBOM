import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { signupUser } from "../api/auth";
import toast from "react-hot-toast";
import Loader from "../components/ui/Loader";
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  User,
  Building2,
  Globe,
  ChevronDown,
  UserCog,
} from "lucide-react";

const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Argentina",
  "Australia",
  "Austria",
  "Bangladesh",
  "Belgium",
  "Brazil",
  "Canada",
  "Chile",
  "China",
  "Colombia",
  "Croatia",
  "Czech Republic",
  "Denmark",
  "Egypt",
  "Ethiopia",
  "Finland",
  "France",
  "Germany",
  "Ghana",
  "Greece",
  "Hungary",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Japan",
  "Jordan",
  "Kenya",
  "Malaysia",
  "Mexico",
  "Morocco",
  "Netherlands",
  "New Zealand",
  "Nigeria",
  "Norway",
  "Pakistan",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Romania",
  "Russia",
  "Saudi Arabia",
  "South Africa",
  "South Korea",
  "Spain",
  "Sri Lanka",
  "Sweden",
  "Switzerland",
  "Taiwan",
  "Thailand",
  "Turkey",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Venezuela",
  "Vietnam",
  "Zimbabwe",
];

// eslint-disable-next-line no-unused-vars
const InputField = ({
  id,
  label,
  icon: Icon,
  error,
  children,
  required,
  isDark,
}) => (
  <div>
    <label
      htmlFor={id}
      className={`block text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"} mb-1.5`}
    >
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <div className="relative">
      <Icon
        className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"} z-10`}
      />
      {children}
    </div>
    {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
  </div>
);

const PUBLIC_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.in",
  "yahoo.co.in",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "mail.com",
  "ymail.com",
  "rediffmail.com",
  "zohomail.com",
  "tutanota.com",
  "gmx.com",
  "gmx.net",
]);

const SignupPage = () => {
  const { login } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    organization: "",
    role: "user",
    country: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Name is required";
    else if (formData.name.length < 2)
      errs.name = "Name must be at least 2 characters";

    if (!formData.email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      errs.email = "Invalid email address";
    else {
      const domain = formData.email.split("@").pop().toLowerCase();
      if (PUBLIC_EMAIL_DOMAINS.has(domain))
        errs.email =
          "Please use your company email address (e.g. you@yourcompany.com)";
    }

    if (!formData.password) errs.password = "Password is required";
    else if (formData.password.length < 6)
      errs.password = "Password must be at least 6 characters";

    if (!formData.confirmPassword)
      errs.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword)
      errs.confirmPassword = "Passwords do not match";

    if (!formData.organization.trim())
      errs.organization = "Organization is required";
    if (!formData.country) errs.country = "Country is required";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword: _confirmPassword, ...payload } = formData;
      const res = await signupUser(payload);
      const user = res.data.data.user;
      const token = res.data.data.token;
      login(user, token);
      toast.success(`Account created! Welcome, ${user.name}! 🎉`);
      navigate(user.role === "admin" ? "/admin/dashboard" : "/dashboard");
    } catch (err) {
      const msg =
        err.response?.data?.message || "Signup failed. Please try again.";
      toast.error(msg);
      if (err.response?.data?.errors) {
        const fieldErrors = {};
        err.response.data.errors.forEach((e) => {
          fieldErrors[e.field] = e.message;
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full pl-10 pr-4 py-3 ${isDark ? "bg-white/5 text-white placeholder-slate-500 border-white/10" : "bg-gray-50 text-gray-900 placeholder-gray-400 border-black/10"} border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm ${
      errors[field]
        ? "border-red-500/70"
        : isDark
          ? "border-white/10"
          : "border-black/10"
    }`;

  return (
    // Reduced vertical padding on mobile (≤480px) to ensure short-viewport devices can scroll the form comfortably.
    <div
      className={`min-h-screen ${isDark ? "bg-[#0f0f1a]" : "bg-[#f1f5f9]"} flex items-center justify-center p-3 sm:p-4 py-6 sm:py-12 relative overflow-hidden`}
    >
      {loading && <Loader />}
      {/* Background blobs */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-3xl pointer-events-none" />

      {/* Full-width on mobile; capped at max-lg on 769px+ so the two-column field rows have comfortable space. */}
      <div className="w-full max-w-lg relative z-10">
        {/* Card */}
        {/* Use tighter inner padding on mobile so form fields aren't crowded against a narrow viewport. */}
        <div
          className={`${isDark ? "bg-[#13131f]/80 border-white/8" : "bg-white border-black/10"} backdrop-blur-xl border rounded-2xl p-4 sm:p-8 shadow-2xl`}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600/20 rounded-2xl mb-4">
              <Shield className="w-7 h-7 text-indigo-400" />
            </div>
            <h1
              className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"} mb-1`}
            >
              Create your account
            </h1>
            <p
              className={`${isDark ? "text-slate-400" : "text-slate-600"} text-sm`}
            >
              Join us today — it's completely free
            </p>
          </div>

          <form
            id="signup-form"
            onSubmit={handleSubmit}
            className="space-y-4"
            noValidate
          >
            {/* Name & Email row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <InputField
                id="name"
                label="Full Name"
                icon={User}
                error={errors.name}
                required
                isDark={isDark}
              >
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={inputClass("name")}
                />
              </InputField>

              {/* Email */}
              <InputField
                id="email"
                label="Email Address"
                icon={Mail}
                error={errors.email}
                required
                isDark={isDark}
              >
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={inputClass("email")}
                />
              </InputField>
            </div>

            {/* Password & Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <InputField
                id="password"
                label="Password"
                icon={Lock}
                error={errors.password}
                required
                isDark={isDark}
              >
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  className={`${inputClass("password")} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </InputField>

              {/* Confirm Password */}
              <InputField
                id="confirmPassword"
                label="Confirm Password"
                icon={Lock}
                error={errors.confirmPassword}
                required
                isDark={isDark}
              >
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  className={`${inputClass("confirmPassword")} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </InputField>
            </div>

            {/* Organization */}
            <InputField
              id="organization"
              label="Organization"
              icon={Building2}
              error={errors.organization}
              required
              isDark={isDark}
            >
              <input
                id="organization"
                type="text"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                placeholder="Your company or institution"
                className={inputClass("organization")}
              />
            </InputField>

            {/* Role & Country row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Role */}
              <div>
                <label
                  htmlFor="role"
                  className={`block text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"} mb-1.5`}
                >
                  Role <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <UserCog
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  />
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-10 py-3 ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-black/10 text-gray-900"} border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm appearance-none cursor-pointer`}
                  >
                    <option
                      value="user"
                      className={`${isDark ? "bg-[#1a1a2e]" : "bg-white"}`}
                    >
                      User
                    </option>
                    <option
                      value="admin"
                      className={`${isDark ? "bg-[#1a1a2e]" : "bg-white"}`}
                    >
                      Admin
                    </option>
                  </select>
                  <ChevronDown
                    className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"} pointer-events-none`}
                  />
                </div>
              </div>

              {/* Country */}
              <div>
                <label
                  htmlFor="country"
                  className={`block text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"} mb-1.5`}
                >
                  Country <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Globe
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  />
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-10 py-3 ${isDark ? "bg-white/5 border-white/10" : "bg-gray-50 border-black/10"} border rounded-xl text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all ${
                      formData.country
                        ? isDark
                          ? "text-white"
                          : "text-gray-900"
                        : isDark
                          ? "text-slate-500"
                          : "text-slate-400"
                    } ${errors.country ? "border-red-500/70" : isDark ? "border-white/10" : "border-black/10"}`}
                  >
                    <option
                      value=""
                      disabled
                      className={`${isDark ? "bg-[#1a1a2e] text-slate-400" : "bg-white text-slate-400"}`}
                    >
                      Select country
                    </option>
                    {COUNTRIES.map((c) => (
                      <option
                        key={c}
                        value={c}
                        className={`${isDark ? "bg-[#1a1a2e] text-white" : "bg-white text-gray-900"}`}
                      >
                        {c}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"} pointer-events-none`}
                  />
                </div>
                {errors.country && (
                  <p className="text-red-400 text-xs mt-1.5">
                    {errors.country}
                  </p>
                )}
              </div>
            </div>

            {/* Role badge indicator */}
            <div
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm transition-all ${
                formData.role === "admin"
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                  : "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${formData.role === "admin" ? "bg-amber-400" : "bg-indigo-400"}`}
              />
              {formData.role === "admin"
                ? "⚙️ Admin accounts have full platform access and user management capabilities."
                : "👤 User accounts have standard access to dashboard features."}
            </div>

            {/* Submit */}
            <button
              id="signup-btn"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 text-sm mt-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating
                  account...
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p
            className={`text-center ${isDark ? "text-slate-400" : "text-slate-600"} text-sm mt-6`}
          >
            Already have an account?{" "}
            <Link
              to="/login"
              className={`${isDark ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-600 hover:text-indigo-700"} font-medium transition-colors`}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
