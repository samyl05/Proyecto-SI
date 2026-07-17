'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  BarChart3,
  Brain,
  GraduationCap,
  Users,
  Clock,
  AlertTriangle,
  LogOut,
  SlidersHorizontal,
  Mail,
  Lock,
  User as UserIcon,
  BookOpen,
  PieChart as PieIcon,
  TrendingUp,
  Percent,
  Check,
  Sparkles,
  Sun,
  Moon,
  Trash2
} from 'lucide-react';
import {
  EMAIL_PATTERN,
  isAllowedRegistrationEmail,
  normalizeEmail,
} from '@/lib/validation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

// Paleta de colores para gráficos
const LIGHT_COLORS = {
  A: '#10b981', // Emerald-500
  B: '#6366f1', // Indigo-500
  C: '#a855f7', // Purple-500
  D: '#f59e0b', // Amber-500
  F: '#ef4444', // Red-500
};

const DARK_COLORS = {
  A: '#34d399', // Emerald-400
  B: '#818cf8', // Indigo-400
  C: '#c084fc', // Purple-400
  D: '#fbbf24', // Amber-400
  F: '#f87171', // Red-400
};

type UserRole = 'ADMIN' | 'PROFESOR' | 'ESTUDIANTE';
type GradeLetter = 'A' | 'B' | 'C' | 'D' | 'F';

type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  studentId: number | null;
  approved: boolean;
};

type GradeDistributionItem = {
  grade: GradeLetter;
  count: number;
  percentage: number;
};

type DashboardData = {
  kpis: {
    totalStudents: number;
    avgStudyHours: number;
    avgAttendance: number;
    avgParticipation: number;
    avgScore: number;
    passRate: number;
  };
  gradeDistribution: GradeDistributionItem[];
  averageMetricsByGrade: Array<{
    grade: GradeLetter;
    avgAttendance: number;
    avgParticipation: number;
    avgScore: number;
  }>;
  studyHoursData: Array<{
    range: string;
    count: number;
    avgScore: number;
  }>;
  analyzedAt?: string;
};

type PredictionResult = {
  success: boolean;
  predictedScore?: string;
  predictedGrade?: GradeLetter;
  comment?: string;
  error?: string;
};

type PendingRequest = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  studentId: number | null;
  createdAt: string;
};

type RegisteredAccount = {
  id: string;
  name: string;
  email: string;
  role: Exclude<UserRole, 'ADMIN'>;
  studentId: number | null;
  approved: boolean;
  createdAt: string;
};

type StudentInfo = {
  studentId: number;
  weeklySelfStudyHours: number;
  attendancePercentage: number;
  classParticipation: number;
  totalScore: number;
  grade: GradeLetter;
};

type DashboardFilters = {
  grades: GradeLetter[];
  studyHoursMin: number;
  studyHoursMax: number;
  attendanceMin: number;
  attendanceMax: number;
  participationMin: number;
  participationMax: number;
};

const DEFAULT_DASHBOARD_FILTERS: DashboardFilters = {
  grades: ['A', 'B', 'C', 'D', 'F'],
  studyHoursMin: 0,
  studyHoursMax: 50,
  attendanceMin: 0,
  attendanceMax: 100,
  participationMin: 1,
  participationMax: 10,
};

function SystemDescriptionFooter() {
  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 py-7 px-6 text-center transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-2">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
          Rendimiento Estudiantil Analytics — Plataforma de Business Intelligence Académico
        </p>
        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          El sistema transforma datos históricos de estudiantes en indicadores, filtros y visualizaciones para apoyar la toma de decisiones docentes. También permite simular una nota proyectada a partir de las horas de estudio, la asistencia y la participación en clase.
        </p>
        <p className="text-[10px] text-slate-400 dark:text-slate-600 font-medium">
          © 2026 Rendimiento Estudiantil Analytics. Aplicación Next.js preparada para Vercel y PostgreSQL en Neon.
        </p>
      </div>
    </footer>
  );
}


export default function Home() {
  // Estado de Autenticación
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  // Formulario de Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Formulario de Registro
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'PROFESOR' | 'ESTUDIANTE'>('PROFESOR');
  const [regStudentId, setRegStudentId] = useState('');
  const [regError, setRegError] = useState('');
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  // Estado del Dashboard
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState('');
  const dashboardAbortRef = useRef<AbortController | null>(null);
  const dashboardRequestIdRef = useRef(0);

  // Filtros editables. La consulta solo se ejecuta al pulsar "Aplicar filtros".
  const [filterGrades, setFilterGrades] = useState<GradeLetter[]>(DEFAULT_DASHBOARD_FILTERS.grades);
  const [filterStudyMin, setFilterStudyMin] = useState(DEFAULT_DASHBOARD_FILTERS.studyHoursMin);
  const [filterStudyMax, setFilterStudyMax] = useState(DEFAULT_DASHBOARD_FILTERS.studyHoursMax);
  const [filterAttendanceMin, setFilterAttendanceMin] = useState(DEFAULT_DASHBOARD_FILTERS.attendanceMin);
  const [filterAttendanceMax, setFilterAttendanceMax] = useState(DEFAULT_DASHBOARD_FILTERS.attendanceMax);
  const [filterParticipationMin, setFilterParticipationMin] = useState(DEFAULT_DASHBOARD_FILTERS.participationMin);
  const [filterParticipationMax, setFilterParticipationMax] = useState(DEFAULT_DASHBOARD_FILTERS.participationMax);
  const [filterValidationError, setFilterValidationError] = useState('');

  // Simulador de Proyección Individual
  const [simHours, setSimHours] = useState('15');
  const [simAttendance, setSimAttendance] = useState('85');
  const [simParticipation, setSimParticipation] = useState('6');
  const [simResult, setSimResult] = useState<PredictionResult | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);

  // Estado de Tab para la navegación (Profesor/Admin)
  const [activeTab, setActiveTab] = useState<'analysis' | 'requests' | 'accounts'>('analysis');
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState('');

  // Administración de cuentas registradas
  const [registeredAccounts, setRegisteredAccounts] = useState<RegisteredAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState('');
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);

  // Estado para Estudiantes
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [studentInfoLoading, setStudentInfoLoading] = useState(false);
  const [studentInfoError, setStudentInfoError] = useState('');

  const getGradeComment = (score: number) => {
    if (score >= 90) return 'Excelente (Máxima nota)';
    if (score >= 80) return 'Muy Bueno';
    if (score >= 70) return 'Aprobado (Mínimo para pasar)';
    if (score >= 60) return 'A punto de perder / Reprobado por poco';
    if (score >= 50) return 'Deficiente / Reprobado';
    return 'Insuficiente / Perdido totalmente';
  };

  const fetchRequests = async () => {
    setRequestsLoading(true);
    setRequestsError('');
    try {
      const res = await fetch('/api/admin/requests');
      const data = await res.json();
      if (res.ok && data.success) {
        setPendingRequests(data.requests);
      } else {
        setRequestsError(data.error || 'Error al obtener solicitudes');
      }
    } catch {
      setRequestsError('Error de red al obtener solicitudes');
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleRequestAction = async (userId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/admin/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchRequests();
      } else {
        alert(data.error || 'Error al procesar la solicitud');
      }
    } catch {
      alert('Error de red al procesar la solicitud');
    }
  };

  const fetchAccounts = async () => {
    setAccountsLoading(true);
    setAccountsError('');
    try {
      const res = await fetch('/api/admin/accounts');
      const data = await res.json();

      if (res.ok && data.success) {
        setRegisteredAccounts(data.accounts);
      } else {
        setAccountsError(data.error || 'Error al obtener las cuentas registradas');
      }
    } catch {
      setAccountsError('Error de red al obtener las cuentas registradas');
    } finally {
      setAccountsLoading(false);
    }
  };

  const handleDeleteAccount = async (account: RegisteredAccount) => {
    const confirmed = window.confirm(
      `¿Está seguro de eliminar la cuenta de ${account.name} (${account.email})? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    setDeletingAccountId(account.id);
    setAccountsError('');

    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: account.id }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setRegisteredAccounts((current) => current.filter((item) => item.id !== account.id));
        setPendingRequests((current) => current.filter((item) => item.id !== account.id));
      } else {
        setAccountsError(data.error || 'Error al eliminar la cuenta');
      }
    } catch {
      setAccountsError('Error de red al eliminar la cuenta');
    } finally {
      setDeletingAccountId(null);
    }
  };

  const fetchStudentInfo = async () => {
    setStudentInfoLoading(true);
    setStudentInfoError('');
    try {
      const res = await fetch('/api/student/info');
      const data = await res.json();
      if (res.ok && data.success) {
        setStudentInfo(data.student);
        setSimHours(data.student.weeklySelfStudyHours.toString());
        setSimAttendance(data.student.attendancePercentage.toString());
        setSimParticipation(data.student.classParticipation.toString());
        
        // Simulación automática para el estudiante
        const predictRes = await fetch('/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hours: data.student.weeklySelfStudyHours,
            attendance: data.student.attendancePercentage,
            participation: data.student.classParticipation,
          }),
        });
        const predictData = await predictRes.json();
        setSimResult(predictData);
      } else {
        setStudentInfoError(data.error || 'Error al obtener información de estudiante');
      }
    } catch {
      setStudentInfoError('Error de red al obtener información de estudiante');
    } finally {
      setStudentInfoLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'ADMIN' && activeTab === 'requests') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchRequests();
    }
  }, [user, activeTab]);

  useEffect(() => {
    if (user && user.role === 'ADMIN' && activeTab === 'accounts') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchAccounts();
    }
  }, [user, activeTab]);

  useEffect(() => {
    if (user && user.role === 'ESTUDIANTE') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchStudentInfo();
    }
  }, [user]);

  // Estado del Tema
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const COLORS = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  // Inicializar tema al montar
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'dark';
    // El tema se recupera del almacenamiento del navegador después de hidratar la página.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
      } else {
        setLoginError(data.error || 'Credenciales incorrectas');
      }
    } catch {
      setLoginError('Error de red al intentar iniciar sesión');
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    const normalizedName = regName.trim();
    const normalizedEmail = normalizeEmail(regEmail);

    if (normalizedName.length < 3 || normalizedName.length > 100) {
      setRegError('El nombre debe contener entre 3 y 100 caracteres');
      return;
    }

    if (!isAllowedRegistrationEmail(normalizedEmail)) {
      setRegError('Solo se permiten correos con dominio @gmail.com, @outlook.com o @hotmail.com');
      return;
    }

    if (regPassword.length < 6 || regPassword.length > 100) {
      setRegError('La contraseña debe contener entre 6 y 100 caracteres');
      return;
    }

    if (regRole === 'ESTUDIANTE' && (!/^\d+$/.test(regStudentId) || Number(regStudentId) <= 0)) {
      setRegError('El ID del estudiante debe ser un número entero positivo');
      return;
    }

    setRegName(normalizedName);
    setRegEmail(normalizedEmail);
    setRegSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: normalizedName,
          email: normalizedEmail,
          password: regPassword,
          role: regRole,
          studentId: regRole === 'ESTUDIANTE' ? regStudentId : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRegSuccess(true);
        setLoginEmail(normalizedEmail);
        setLoginPassword(regPassword);
        // Esperar 4s para que lean el aviso de aprobación y cambiar a pestaña de login
        setTimeout(() => {
          setAuthTab('login');
          setRegSuccess(false);
          setRegName('');
          setRegEmail('');
          setRegPassword('');
          setRegRole('PROFESOR');
          setRegStudentId('');
        }, 4000);
      } else {
        setRegError(data.error || 'Error al registrar el usuario');
      }
    } catch {
      setRegError('Error de red al intentar registrarse');
    } finally {
      setRegSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setDashboardData(null);
      dashboardAbortRef.current?.abort();
      // Limpiar filtros
      setFilterGrades(DEFAULT_DASHBOARD_FILTERS.grades);
      setFilterStudyMin(DEFAULT_DASHBOARD_FILTERS.studyHoursMin);
      setFilterStudyMax(DEFAULT_DASHBOARD_FILTERS.studyHoursMax);
      setFilterAttendanceMin(DEFAULT_DASHBOARD_FILTERS.attendanceMin);
      setFilterAttendanceMax(DEFAULT_DASHBOARD_FILTERS.attendanceMax);
      setFilterParticipationMin(DEFAULT_DASHBOARD_FILTERS.participationMin);
      setFilterParticipationMax(DEFAULT_DASHBOARD_FILTERS.participationMax);
      setFilterValidationError('');
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  };

  const fetchDashboardData = useCallback(async (filters: DashboardFilters) => {
    dashboardAbortRef.current?.abort();
    const controller = new AbortController();
    dashboardAbortRef.current = controller;
    const requestId = ++dashboardRequestIdRef.current;

    setDashboardLoading(true);
    setDashboardError('');
    try {
      const res = await fetch('/api/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        signal: controller.signal,
        body: JSON.stringify(filters),
      });
      const data = await res.json();

      // Impide que una respuesta anterior sobrescriba la muestra más reciente.
      if (requestId !== dashboardRequestIdRef.current) return;

      if (res.ok && data.success) {
        setDashboardData(data.data);
      } else {
        setDashboardError(data.error || 'Error al obtener datos');
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (requestId === dashboardRequestIdRef.current) {
        setDashboardError('Error de red al conectar con el servidor de BI');
      }
    } finally {
      if (requestId === dashboardRequestIdRef.current) {
        setDashboardLoading(false);
      }
    }
  }, []);

  const getCurrentDashboardFilters = (): DashboardFilters => ({
    grades: filterGrades,
    studyHoursMin: filterStudyMin,
    studyHoursMax: filterStudyMax,
    attendanceMin: filterAttendanceMin,
    attendanceMax: filterAttendanceMax,
    participationMin: filterParticipationMin,
    participationMax: filterParticipationMax,
  });

  const handleApplyFilters = () => {
    if (filterGrades.length === 0) {
      setFilterValidationError('Seleccione al menos una calificación antes de analizar.');
      return;
    }

    if (
      filterStudyMin > filterStudyMax ||
      filterAttendanceMin > filterAttendanceMax ||
      filterParticipationMin > filterParticipationMax
    ) {
      setFilterValidationError('El valor mínimo no puede ser mayor que el máximo.');
      return;
    }

    setFilterValidationError('');
    fetchDashboardData(getCurrentDashboardFilters());
  };

  const handleResetFilters = () => {
    setFilterGrades(DEFAULT_DASHBOARD_FILTERS.grades);
    setFilterStudyMin(DEFAULT_DASHBOARD_FILTERS.studyHoursMin);
    setFilterStudyMax(DEFAULT_DASHBOARD_FILTERS.studyHoursMax);
    setFilterAttendanceMin(DEFAULT_DASHBOARD_FILTERS.attendanceMin);
    setFilterAttendanceMax(DEFAULT_DASHBOARD_FILTERS.attendanceMax);
    setFilterParticipationMin(DEFAULT_DASHBOARD_FILTERS.participationMin);
    setFilterParticipationMax(DEFAULT_DASHBOARD_FILTERS.participationMax);
    setFilterValidationError('');
    fetchDashboardData(DEFAULT_DASHBOARD_FILTERS);
  };

  // Verificar la sesión una sola vez al montar la aplicación.
  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (active && data.loggedIn) {
          setUser(data.user as SessionUser);
        }
      } catch (error) {
        console.error('Error verificando sesión:', error);
      } finally {
        if (active) setAuthLoading(false);
      }
    };

    loadSession();
    return () => {
      active = false;
    };
  }, []);

  const currentUserId = user?.id;
  const currentUserRole = user?.role;

  // Carga inicial. Las perillas no generan consultas mientras se arrastran.
  useEffect(() => {
    if (currentUserId && currentUserRole !== 'ESTUDIANTE') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchDashboardData(DEFAULT_DASHBOARD_FILTERS);
    }

    return () => dashboardAbortRef.current?.abort();
  }, [currentUserId, currentUserRole, fetchDashboardData]);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimLoading(true);
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hours: Number(simHours),
          attendance: Number(simAttendance),
          participation: Number(simParticipation),
        }),
      });
      const data = await res.json();
      setSimResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSimLoading(false);
    }
  };

  const toggleGradeFilter = (grade: GradeLetter) => {
    if (filterGrades.includes(grade)) {
      setFilterGrades(filterGrades.filter((g) => g !== grade));
    } else {
      setFilterGrades([...filterGrades, grade]);
    }
  };

  const selectAllGrades = () => setFilterGrades(DEFAULT_DASHBOARD_FILTERS.grades);
  const clearGrades = () => setFilterGrades([]);

  const changeStudyMin = (value: number) => setFilterStudyMin(Math.min(value, filterStudyMax));
  const changeStudyMax = (value: number) => setFilterStudyMax(Math.max(value, filterStudyMin));
  const changeAttendanceMin = (value: number) => setFilterAttendanceMin(Math.min(value, filterAttendanceMax));
  const changeAttendanceMax = (value: number) => setFilterAttendanceMax(Math.max(value, filterAttendanceMin));
  const changeParticipationMin = (value: number) => setFilterParticipationMin(Math.min(value, filterParticipationMax));
  const changeParticipationMax = (value: number) => setFilterParticipationMax(Math.max(value, filterParticipationMin));

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-800 dark:text-slate-100 transition-colors duration-300">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-500/20 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-pulse" />
          </div>
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase animate-pulse">
          Cargando Sistema BI...
        </p>
      </div>
    );
  }

  // Vista de Autenticación (Login/Registro)
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans transition-colors duration-300">
        {/* Botón flotante de selección de tema en Login */}
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={toggleTheme}
            className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 shadow transition duration-200 cursor-pointer"
            title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Diseños decorativos de fondo */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-200/20 dark:bg-indigo-900/10 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-100/30 dark:bg-emerald-950/20 blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-md bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl dark:shadow-2xl transition-all duration-300">
          {/* Encabezado */}
          <div className="p-8 pb-4 text-center border-b border-slate-200 dark:border-slate-800/80">
            <div className="inline-flex p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400 mb-4 border border-indigo-100 dark:border-indigo-500/20 shadow-inner">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex justify-center items-center gap-2">
              Rendimiento Estudiantil <span className="text-indigo-600 dark:text-indigo-400 font-medium text-lg px-2 py-0.5 bg-indigo-500/10 dark:bg-indigo-500/10 rounded-md border border-indigo-100 dark:border-indigo-500/20">BI</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Plataforma de soporte analítico y predictivo de rendimiento académico
            </p>
          </div>

          {/* Pestañas */}
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => {
                setAuthTab('login');
                setLoginError('');
              }}
              className={`flex-1 py-4 text-sm font-semibold tracking-wide transition relative cursor-pointer ${
                authTab === 'login' ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Iniciar Sesión
              {authTab === 'login' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500"></span>
              )}
            </button>
            <button
              onClick={() => {
                setAuthTab('register');
                setRegError('');
              }}
              className={`flex-1 py-4 text-sm font-semibold tracking-wide transition relative cursor-pointer ${
                authTab === 'register' ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Registrarse
              {authTab === 'register' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500"></span>
              )}
            </button>
          </div>

          <div className="p-8">
            {/* Pestaña Login */}
            {authTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                {loginError && (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <Mail className="w-4.5 h-4.5" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="admin@bi.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 outline-none transition-colors duration-200"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <Lock className="w-4.5 h-4.5" />
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="Contraseña"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 outline-none transition-colors duration-200"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginSubmitting}
                  className="w-full mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {loginSubmitting ? 'Iniciando Sesión...' : 'Entrar al Dashboard'}
                </button>
              </form>
            )}

            {/* Pestaña Registro */}
            {authTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-5">
                {regError && (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                {regSuccess && (
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 dark:text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>¡Registro exitoso! Redirigiendo a Iniciar Sesión...</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <UserIcon className="w-4.5 h-4.5" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Dra. Samantha Lozada"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 outline-none transition-colors duration-200"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <Mail className="w-4.5 h-4.5" />
                    </div>
                    <input
                      type="email"
                      required
                      maxLength={254}
                      pattern={EMAIL_PATTERN}
                      title="Use un correo terminado en @gmail.com, @outlook.com o @hotmail.com"
                      autoComplete="email"
                      inputMode="email"
                      placeholder="usuario@gmail.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value.toLowerCase())}
                      onBlur={() => setRegEmail(normalizeEmail(regEmail))}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 outline-none transition-colors duration-200"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    Dominios permitidos: @gmail.com, @outlook.com y @hotmail.com.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                    Tipo de Usuario (Rol)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRegRole('PROFESOR')}
                      className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition duration-200 cursor-pointer ${
                        regRole === 'PROFESOR'
                          ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                          : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-500 dark:text-slate-400 hover:bg-slate-100/50'
                      }`}
                    >
                      Profesor
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegRole('ESTUDIANTE')}
                      className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition duration-200 cursor-pointer ${
                        regRole === 'ESTUDIANTE'
                          ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                          : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-500 dark:text-slate-400 hover:bg-slate-100/50'
                      }`}
                    >
                      Estudiante
                    </button>
                  </div>
                </div>

                {regRole === 'ESTUDIANTE' && (
                  <div className="space-y-1.5 transition-all duration-200">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                      ID del Estudiante
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                        <GraduationCap className="w-4.5 h-4.5" />
                      </div>
                      <input
                        type="number"
                        required
                        min={1}
                        step={1}
                        inputMode="numeric"
                        placeholder="Ej. 65"
                        value={regStudentId}
                        onChange={(e) => setRegStudentId(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 outline-none transition-colors duration-200"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 dark:text-slate-500 italic mt-1 block">
                      * Debe coincidir con su ID asignado en la base de datos de rendimiento académico.
                    </p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <Lock className="w-4.5 h-4.5" />
                    </div>
                    <input
                      type="password"
                      required
                      minLength={6}
                      maxLength={100}
                      autoComplete="new-password"
                      placeholder="Mínimo 6 caracteres"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 outline-none transition-colors duration-200"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 italic mt-1 block">
                    Use al menos 6 caracteres. Evite utilizar la misma contraseña de su correo.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={regSubmitting || regSuccess}
                  className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {regSubmitting ? 'Registrando...' : 'Crear Cuenta'}
                </button>
              </form>
            )}
          </div>
        </div>
        <p className="relative z-10 mt-5 max-w-2xl text-center text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          Plataforma académica de Business Intelligence para analizar rendimiento, visualizar indicadores y realizar simulaciones de nota con datos de estudio, asistencia y participación.
        </p>
      </div>
    );
  }

  // Vista de Estudiante - Retorno Temprano
  if (user && user.role === 'ESTUDIANTE') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
        {/* Header para Estudiantes */}
        <header className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 sticky top-0 z-40 px-6 py-4 flex items-center justify-between gap-4 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-500 text-white rounded-xl shadow-lg shadow-emerald-500/10">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 uppercase">
                Mi Rendimiento Académico <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 dark:text-emerald-400 font-bold rounded border border-emerald-100 dark:border-emerald-500/20">ESTUDIANTE</span>
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Portal de rendimiento y simulador predictivo individual
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Botón Selector de Tema */}
            <button
              onClick={toggleTheme}
              className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 shadow transition duration-200 cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Perfil del Usuario */}
            <div className="flex items-center gap-3 bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/85 px-4 py-1.5 rounded-2xl shadow-sm">
              <div className="w-7 h-7 bg-emerald-600 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-inner">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.name}</p>
                <p className="text-[9px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">
                  Estudiante (ID: {user.studentId})
                </p>
              </div>
              <button
                onClick={handleLogout}
                title="Cerrar Sesión"
                className="text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition pl-2 border-l border-slate-200 dark:border-slate-800 ml-1 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
          {studentInfoLoading && (
            <div className="h-[300px] flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
              <div className="w-10 h-10 border-4 border-emerald-200 dark:border-emerald-500/20 border-t-emerald-600 dark:border-t-emerald-505 rounded-full animate-spin mb-3"></div>
              <span className="text-xs uppercase tracking-wider font-semibold">Cargando tus datos académicos...</span>
            </div>
          )}

          {studentInfoError && (
            <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-sm rounded-3xl flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{studentInfoError}</span>
            </div>
          )}

          {studentInfo && (
            <div className="space-y-6">
              {/* Sección superior: Datos Reales del Estudiante */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Info Card */}
                <div className="md:col-span-1 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm dark:shadow-xl relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Ficha de Estudiante</h3>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white mb-1">{user.name}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Correo: {user.email}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 font-medium">Estudiante ID: <span className="font-bold text-slate-900 dark:text-white">{user.studentId}</span></p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Estado de Calificación</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-xs font-black px-3 py-1 rounded-full ${
                        studentInfo.totalScore >= 70
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20'
                          : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20'
                      }`}>
                        {studentInfo.totalScore >= 70 ? 'APROBADO' : 'REPROBADO'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score and Comment Card */}
                <div className="md:col-span-2 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm dark:shadow-xl relative overflow-hidden flex flex-col justify-center">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="text-center md:text-left shrink-0">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                        Tu Calificación Actual
                      </p>
                      <div className="flex items-baseline justify-center md:justify-start gap-1">
                        <span className="text-5xl font-black text-slate-900 dark:text-white">{studentInfo.totalScore}</span>
                        <span className="text-slate-500 dark:text-slate-400 font-bold text-sm">/ 100 pts</span>
                      </div>
                      <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/20 px-3.5 py-1 rounded-full font-black text-xs mt-2.5">
                        Letra: <span className="text-sm font-black text-slate-800 dark:text-white">{studentInfo.grade}</span>
                      </div>
                    </div>

                    <div className="flex-1 w-full">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                        Comentario de Rendimiento
                      </p>
                      <div className={`p-4 rounded-2xl border ${
                        studentInfo.totalScore >= 70
                          ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/15 text-emerald-800 dark:text-emerald-500 dark:text-emerald-400'
                          : 'bg-rose-50/50 dark:bg-rose-500/5 border-rose-100 dark:border-rose-500/15 text-rose-800 dark:text-rose-500 dark:text-rose-400'
                      }`}>
                        <p className="text-sm font-bold flex items-center gap-2">
                          {studentInfo.totalScore >= 70 ? (
                            <GraduationCap className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-rose-500" />
                          )}
                          {getGradeComment(studentInfo.totalScore)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                          {studentInfo.totalScore >= 70
                            ? '¡Buen trabajo! Sigues superando el umbral de aprobación establecido del 70%.'
                            : 'Atención: Tu nota actual está por debajo del umbral mínimo de aprobación del 70%. Recuerda que puedes mejorar tus hábitos de estudio y participación.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Grid de métricas actuales */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-500/15">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-505 dark:text-slate-500 uppercase tracking-widest">
                      Horas de Auto-Estudio
                    </p>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white mt-0.5">
                      {studentInfo.weeklySelfStudyHours} <span className="text-xs text-slate-500 dark:text-slate-400">hrs/semana</span>
                    </h3>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-teal-50 dark:bg-teal-500/10 text-teal-650 dark:text-teal-400 rounded-2xl border border-teal-100 dark:border-teal-500/15">
                    <Percent className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-505 dark:text-slate-500 uppercase tracking-widest">
                      Porcentaje Asistencia
                    </p>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white mt-0.5">
                      {studentInfo.attendancePercentage}%
                    </h3>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-650 dark:text-amber-400 rounded-2xl border border-amber-100 dark:border-amber-500/15">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-505 dark:text-slate-500 uppercase tracking-widest">
                      Participación en Clase
                    </p>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white mt-0.5">
                      {studentInfo.classParticipation} <span className="text-xs text-slate-500 dark:text-slate-400">/ 10</span>
                    </h3>
                  </div>
                </div>
              </section>

              {/* Simulador Personal */}
              <section className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-indigo-500/20 rounded-3xl p-6 shadow-sm dark:shadow-xl relative overflow-hidden transition-all duration-300">
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400 dark:text-indigo-400 animate-pulse" />
                  <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                    Simulador Personal Predictivo: Modifica tus Métricas
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <form onSubmit={handlePredict} className="md:col-span-1 space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wide mb-1">
                        Horas de Estudio Semanales
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="50"
                        required
                        value={simHours}
                        onChange={(e) => setSimHours(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none transition-colors duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wide mb-1">
                        Porcentaje de Asistencia (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={simAttendance}
                        onChange={(e) => setSimAttendance(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none transition-colors duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wide mb-1">
                        Participación (1-10)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        required
                        value={simParticipation}
                        onChange={(e) => setSimParticipation(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none transition-colors duration-200"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={simLoading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition text-xs shadow-md shadow-emerald-600/10 active:scale-[0.98] cursor-pointer"
                    >
                      {simLoading ? 'Simulando...' : 'Re-Proyectar Mi Nota'}
                    </button>
                  </form>

                  <div className="md:col-span-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 min-h-[180px] flex items-center justify-center text-center">
                    {simResult?.success ? (
                      <div className="w-full max-w-sm">
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                          Tu Puntaje Proyectado
                        </p>
                        <div className="flex items-baseline justify-center gap-1 mb-2">
                          <span className="text-5xl font-black text-slate-900 dark:text-white">{simResult.predictedScore}</span>
                          <span className="text-slate-500 dark:text-slate-400 font-bold text-sm">/ 100 pts</span>
                        </div>
                        <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/20 px-3.5 py-1.5 rounded-full font-black text-xs mb-3.5">
                          Letra Estimada: <span className="text-sm font-black text-slate-800 dark:text-white">{simResult.predictedGrade}</span>
                        </div>
                        {Number(simResult.predictedScore) < 70 ? (
                          <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-100 dark:border-rose-500/20 text-left flex items-start gap-2.5 text-rose-700 dark:text-rose-300">
                            <AlertTriangle className="w-4.5 h-4.5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold block mb-0.5">Alerta de Riesgo Académico:</span>
                              {simResult.comment || 'El alumno está bajo el umbral mínimo aprobatorio. Requiere tutorías.'}
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20 text-left flex items-start gap-2.5 text-emerald-700 dark:text-emerald-300">
                            <GraduationCap className="w-4.5 h-4.5 text-emerald-500 dark:text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold block mb-0.5">Rendimiento Aprobatorio:</span>
                              {simResult.comment || 'Las proyecciones indican un rendimiento académico seguro.'}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-slate-400 dark:text-slate-500 text-xs max-w-xs">
                        <Sparkles className="w-8 h-8 text-slate-400 dark:text-slate-500 dark:text-slate-700 mx-auto mb-3" />
                        Modifica los valores del formulario izquierdo para recalcular y predecir tu rendimiento académico simulado en tiempo real.
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}
        </main>
        <SystemDescriptionFooter />
      </div>
    );
  }

  // Vista Principal del Dashboard de BI
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      {/* Header Premium */}
      <header className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 sticky top-0 z-40 px-6 py-4 flex flex-wrap items-center justify-between gap-4 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-purple-500 text-white rounded-xl shadow-lg shadow-indigo-500/10">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 uppercase">
              Rendimiento Estudiantil <span className="text-[10px] px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 dark:text-indigo-400 font-bold rounded border border-indigo-100 dark:border-indigo-500/20">BI</span>
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Plataforma de soporte analítico de datos educativos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Botón Selector de Tema */}
          <button
            onClick={toggleTheme}
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 shadow transition duration-200 cursor-pointer"
            title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Botón para alternar el simulador */}
          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 shadow cursor-pointer ${
              showSimulator
                ? 'bg-indigo-50 dark:bg-indigo-500/15 border-indigo-200 dark:border-indigo-500/40 text-indigo-600 dark:text-indigo-300'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Brain className="w-4 h-4" />
            {showSimulator ? 'Ocultar Simulador' : 'Simular Alumno'}
          </button>

          {/* Perfil del Usuario */}
          <div className="flex items-center gap-3 bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/85 px-4 py-1.5 rounded-2xl shadow-sm">
            <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-inner">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.name}</p>
              <p className="text-[9px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">
                {user.role}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar Sesión"
              className="text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition pl-2 border-l border-slate-200 dark:border-slate-800 ml-1 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Grid Principal */}
      <div className="flex-1 p-6">
        {/* Tabs de Admin */}
        {user.role === 'ADMIN' && (
          <div className="flex flex-wrap gap-3 border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                activeTab === 'analysis'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              Análisis de Datos
            </button>
            <button
              onClick={() => {
                setActiveTab('requests');
                fetchRequests();
              }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer relative ${
                activeTab === 'requests'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              Solicitudes de Registro
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px] font-black animate-pulse shadow-md">
                  {pendingRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('accounts');
                fetchAccounts();
              }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'accounts'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              Administrar Cuentas
            </button>
          </div>
        )}

        {activeTab === 'requests' && user.role === 'ADMIN' ? (
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm dark:shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Mail className="w-5 h-5 text-indigo-500 animate-bounce" />
                  Solicitudes de Registro Pendientes
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Aprueba o rechaza el registro de nuevos usuarios en el sistema.
                </p>
              </div>
              <button
                onClick={fetchRequests}
                className="px-3.5 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl transition cursor-pointer"
              >
                Refrescar
              </button>
            </div>

            {requestsLoading && (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                <div className="w-8 h-8 border-4 border-indigo-200 dark:border-indigo-500/20 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin mb-2.5"></div>
                <span className="text-xs uppercase tracking-wider font-semibold">Cargando solicitudes...</span>
              </div>
            )}

            {requestsError && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>{requestsError}</span>
              </div>
            )}

            {!requestsLoading && !requestsError && pendingRequests.length === 0 && (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400 dark:text-slate-500 text-xs">
                <Check className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                No hay solicitudes de registro pendientes de aprobación.
              </div>
            )}

            {!requestsLoading && !requestsError && pendingRequests.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black">
                      <th className="py-3 px-4">Usuario</th>
                      <th className="py-3 px-4">Correo</th>
                      <th className="py-3 px-4">Rol</th>
                      <th className="py-3 px-4">ID Estudiante</th>
                      <th className="py-3 px-4">Registro</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-medium">
                    {pendingRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition duration-155">
                        <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">{req.name}</td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">{req.email}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            req.role === 'PROFESOR'
                              ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 dark:text-indigo-400'
                              : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:text-emerald-400'
                          }`}>
                            {req.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300 font-mono">
                          {req.studentId || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 dark:text-slate-500">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleRequestAction(req.id, 'approve')}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition active:scale-95 cursor-pointer"
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() => handleRequestAction(req.id, 'reject')}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition active:scale-95 cursor-pointer"
                          >
                            Rechazar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeTab === 'accounts' && user.role === 'ADMIN' ? (
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm dark:shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500" />
                  Administración de Cuentas
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Consulta las cuentas de profesores y estudiantes registradas y elimina las que ya no deban acceder al sistema.
                </p>
              </div>
              <button
                onClick={fetchAccounts}
                disabled={accountsLoading}
                className="px-3.5 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                {accountsLoading ? 'Actualizando...' : 'Refrescar'}
              </button>
            </div>

            {accountsError && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{accountsError}</span>
              </div>
            )}

            {accountsLoading && (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                <div className="w-8 h-8 border-4 border-indigo-200 dark:border-indigo-500/20 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin mb-2.5"></div>
                <span className="text-xs uppercase tracking-wider font-semibold">Cargando cuentas...</span>
              </div>
            )}

            {!accountsLoading && !accountsError && registeredAccounts.length === 0 && (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
                <Users className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
                No existen cuentas de profesores o estudiantes registradas.
              </div>
            )}

            {!accountsLoading && registeredAccounts.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black">
                      <th className="py-3 px-4">Usuario</th>
                      <th className="py-3 px-4">Correo</th>
                      <th className="py-3 px-4">Rol</th>
                      <th className="py-3 px-4">ID Estudiante</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4">Registro</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-medium">
                    {registeredAccounts.map((account) => (
                      <tr key={account.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition duration-155">
                        <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                          {account.name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                          {account.email}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            account.role === 'PROFESOR'
                              ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                              : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {account.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300 font-mono">
                          {account.studentId ?? '-'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            account.approved
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}>
                            {account.approved ? 'APROBADA' : 'PENDIENTE'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 dark:text-slate-500">
                          {new Date(account.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeleteAccount(account)}
                            disabled={deletingAccountId === account.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {deletingAccountId === account.id ? 'Eliminando...' : 'Eliminar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Barra Lateral de Filtros (Columna 1 en desktop) */}
            <aside className="lg:col-span-1 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 space-y-6 self-start shadow-sm dark:shadow-xl backdrop-blur-md transition-colors duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              Filtros de Análisis
            </h2>
          </div>

          {/* Filtro de Calificaciones */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Letra Calificación
              </span>
              <div className="flex gap-2">
                <button
                  onClick={selectAllGrades}
                  className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Todos
                </button>
                <span className="text-slate-400 dark:text-slate-500 dark:text-slate-700 text-[9px] font-bold">|</span>
                <button
                  onClick={clearGrades}
                  className="text-[9px] font-bold text-slate-500 dark:text-slate-400 hover:underline cursor-pointer"
                >
                  Limpiar
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {(['A', 'B', 'C', 'D', 'F'] as GradeLetter[]).map((g) => {
                const active = filterGrades.includes(g);
                return (
                  <button
                    key={g}
                    onClick={() => toggleGradeFilter(g)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all duration-200 cursor-pointer ${
                      active
                        ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-500 dark:border-indigo-500 text-indigo-600 dark:text-indigo-300 shadow'
                        : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    Nota {g}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtro: Horas de Estudio Semanal */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Horas de Estudio Semanales
              </span>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 dark:text-indigo-400">
                {filterStudyMin} - {filterStudyMax} hrs
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Mínimo</label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={filterStudyMin}
                  onChange={(e) => changeStudyMin(Number(e.target.value))}
                  className="w-full accent-indigo-600 dark:accent-indigo-500 h-1.5 bg-slate-100 dark:bg-slate-950 border-none rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Máximo</label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={filterStudyMax}
                  onChange={(e) => changeStudyMax(Number(e.target.value))}
                  className="w-full accent-indigo-600 dark:accent-indigo-500 h-1.5 bg-slate-100 dark:bg-slate-950 border-none rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Filtro: Porcentaje de Asistencia */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Porcentaje de Asistencia
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {filterAttendanceMin}% - {filterAttendanceMax}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Mínimo</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filterAttendanceMin}
                  onChange={(e) => changeAttendanceMin(Number(e.target.value))}
                  className="w-full accent-emerald-600 dark:accent-emerald-500 h-1.5 bg-slate-100 dark:bg-slate-950 border-none rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 dark:text-slate-500 font-bold uppercase">Máximo</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filterAttendanceMax}
                  onChange={(e) => changeAttendanceMax(Number(e.target.value))}
                  className="w-full accent-emerald-600 dark:accent-emerald-500 h-1.5 bg-slate-100 dark:bg-slate-950 border-none rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Filtro: Participación */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Participación (1-10)
              </span>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 dark:text-purple-400">
                {filterParticipationMin} - {filterParticipationMax} pts
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Mínimo</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={filterParticipationMin}
                  onChange={(e) => changeParticipationMin(Number(e.target.value))}
                  className="w-full accent-purple-600 dark:accent-purple-500 h-1.5 bg-slate-100 dark:bg-slate-950 border-none rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Máximo</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={filterParticipationMax}
                  onChange={(e) => changeParticipationMax(Number(e.target.value))}
                  className="w-full accent-purple-600 dark:accent-purple-500 h-1.5 bg-slate-100 dark:bg-slate-950 border-none rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Aplicación controlada de filtros */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            {filterValidationError && (
              <div className="text-[10px] text-rose-600 dark:text-rose-400 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{filterValidationError}</span>
              </div>
            )}
            <button
              type="button"
              onClick={handleApplyFilters}
              disabled={dashboardLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl transition text-xs shadow-md shadow-indigo-600/10 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {dashboardLoading ? 'Analizando muestra...' : 'Aplicar filtros y analizar'}
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              disabled={dashboardLoading}
              className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-60 text-slate-700 dark:text-slate-200 font-bold py-2.5 rounded-xl transition text-xs cursor-pointer"
            >
              Restablecer filtros
            </button>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center leading-relaxed">
              Mueva las perillas libremente y aplique los cambios una sola vez. La muestra permanecerá estable hasta el siguiente análisis.
            </p>
          </div>
        </aside>

        {/* Zona del Dashboard Principal */}
        <main className="lg:col-span-3 space-y-6">
          {/* Sección de Simulación Condicional */}
          {showSimulator && (
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-indigo-500/20 rounded-3xl p-6 shadow-sm dark:shadow-xl relative overflow-hidden transition-all duration-300">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400 dark:text-indigo-400 animate-pulse" />
                <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  Simulador de Rendimiento Individual (Algoritmo Predictivo)
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <form onSubmit={handlePredict} className="md:col-span-1 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wide mb-1">
                      Horas de Estudio Semanales
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="50"
                      required
                      value={simHours}
                      onChange={(e) => setSimHours(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none transition-colors duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wide mb-1">
                      Porcentaje de Asistencia (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={simAttendance}
                      onChange={(e) => setSimAttendance(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none transition-colors duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wide mb-1">
                      Participación (1-10)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      required
                      value={simParticipation}
                      onChange={(e) => setSimParticipation(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none transition-colors duration-200"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={simLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition text-xs shadow-md shadow-indigo-600/10 active:scale-[0.98] cursor-pointer"
                  >
                    {simLoading ? 'Simulando...' : 'Proyectar Nota Alumno'}
                  </button>
                </form>

                <div className="md:col-span-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 min-h-[180px] flex items-center justify-center text-center">
                  {simResult?.success ? (
                    <div className="w-full max-w-sm">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                        Puntaje Proyectado del Alumno
                      </p>
                      <div className="flex items-baseline justify-center gap-1 mb-2">
                        <span className="text-5xl font-black text-slate-900 dark:text-white">{simResult.predictedScore}</span>
                        <span className="text-slate-500 dark:text-slate-400 font-bold text-sm">/ 100 pts</span>
                      </div>
                      <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/20 px-3.5 py-1.5 rounded-full font-black text-xs mb-3.5">
                        Letra Estimada: <span className="text-sm font-black text-slate-800 dark:text-white">{simResult.predictedGrade}</span>
                      </div>
                      {Number(simResult.predictedScore) < 70 ? (
                        <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-100 dark:border-rose-500/20 text-left flex items-start gap-2.5 text-rose-700 dark:text-rose-300">
                          <AlertTriangle className="w-4.5 h-4.5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block mb-0.5">Alerta de Riesgo Académico:</span>
                            {simResult.comment || 'El alumno está bajo el umbral mínimo aprobatorio. Requiere tutorías.'}
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20 text-left flex items-start gap-2.5 text-emerald-700 dark:text-emerald-300">
                          <GraduationCap className="w-4.5 h-4.5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block mb-0.5">Rendimiento Aprobatorio:</span>
                            {simResult.comment || 'Las proyecciones indican un rendimiento académico seguro.'}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-400 dark:text-slate-500 text-xs max-w-xs">
                      <Sparkles className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                      Ingresa los datos en el simulador izquierdo y proyecta los resultados de desempeño académico de manera instantánea.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Estado de Error del Dashboard */}
          {dashboardError && (
            <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-sm rounded-3xl flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{dashboardError}</span>
            </div>
          )}

          {/* Cargador del Dashboard */}
          {dashboardLoading && !dashboardData && (
            <div className="h-[400px] flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/80 rounded-3xl transition-colors duration-350">
              <div className="w-10 h-10 border-4 border-indigo-200 dark:border-indigo-500/20 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin mb-3"></div>
              <span className="text-xs uppercase tracking-wider font-semibold">Consultando base de datos (1M registros)...</span>
            </div>
          )}

          {/* Contenido del Dashboard */}
          {dashboardData && (
            <div className={`space-y-6 transition-all duration-300 ${dashboardLoading ? 'opacity-55' : 'opacity-100'}`}>
              
              {/* Tarjetas KPI de impacto */}
              <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* KPI 1 */}
                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 hover:border-indigo-500/30 transition duration-300 shadow-sm dark:shadow flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-500/15">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">
                      Muestra Alumnos
                    </p>
                    <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                      {dashboardData.kpis.totalStudents.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* KPI 2 */}
                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 hover:border-emerald-500/30 transition duration-300 shadow-sm dark:shadow flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-500/15">
                    <Percent className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">
                      Aprobación %
                    </p>
                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 dark:text-emerald-400 mt-0.5">
                      {dashboardData.kpis.passRate}%
                    </p>
                  </div>
                </div>

                {/* KPI 3 */}
                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 hover:border-purple-500/30 transition duration-300 shadow-sm dark:shadow flex items-center gap-4">
                  <div className="p-3 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 dark:text-purple-400 rounded-2xl border border-purple-100 dark:border-purple-500/15">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">
                      Media Horas
                    </p>
                    <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                      {dashboardData.kpis.avgStudyHours} <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">h/sem</span>
                    </p>
                  </div>
                </div>

                {/* KPI 4 */}
                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 hover:border-amber-500/30 transition duration-300 shadow-sm dark:shadow flex items-center gap-4">
                  <div className="p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-650 dark:text-amber-400 rounded-2xl border border-amber-100 dark:border-amber-500/15">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">
                      Nota Promedio
                    </p>
                    <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                      {dashboardData.kpis.avgScore} <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">/100</span>
                    </p>
                  </div>
                </div>
              </section>

              {/* Zona de Gráficos - Fila 1 */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Gráfico 1: Barras - Cantidad de alumnos por calificación */}
                <div className="md:col-span-2 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm dark:shadow-xl backdrop-blur-md transition-colors duration-300">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                    Distribución de Calificaciones Académicas
                  </h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardData.gradeDistribution} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} vertical={false} />
                        <XAxis dataKey="grade" stroke="#64748b" tickLine={false} style={{ fontSize: 11, fontWeight: 'bold' }} />
                        <YAxis stroke="#64748b" tickLine={false} style={{ fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                            borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                            borderRadius: 12,
                            color: theme === 'dark' ? '#f8fafc' : '#0f172a'
                          }}
                          labelStyle={{ fontWeight: 'bold', color: theme === 'dark' ? '#818cf8' : '#4f46e5' }}
                          formatter={(value) => [`${Number(value).toLocaleString()} alumnos`, 'Cantidad']}
                        />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                          {dashboardData.gradeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[entry.grade as keyof typeof COLORS] || '#7627c4'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Gráfico 2: Pastel (Dona) - Distribución Porcentual */}
                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm dark:shadow-xl backdrop-blur-md flex flex-col transition-colors duration-300">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                    <PieIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    Porcentaje de Calificaciones
                  </h3>
                  <div className="h-[200px] w-full relative flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dashboardData.gradeDistribution}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="count"
                          nameKey="grade"
                        >
                          {dashboardData.gradeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[entry.grade as keyof typeof COLORS] || '#7627c4'} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                            borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                            borderRadius: 12,
                            color: theme === 'dark' ? '#f8fafc' : '#0f172a'
                          }}
                          formatter={(value, name) => [`${((Number(value) / dashboardData.kpis.totalStudents) * 100).toFixed(1)}%`, `Nota ${name}`]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Aprobados</span>
                      <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{dashboardData.kpis.passRate}%</span>
                    </div>
                  </div>
                  {/* Leyenda Personalizada */}
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800/80 mt-1">
                    {(['A', 'B', 'C', 'D', 'F'] as GradeLetter[]).map((g) => (
                      <div key={g} className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[g as keyof typeof COLORS] }} />
                        <span>{g}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Zona de Gráficos - Fila 2 */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Gráfico 3: Área - Horas de estudio vs Rendimiento Promedio */}
                <div className="md:col-span-2 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm dark:shadow-xl backdrop-blur-md transition-colors duration-300">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                    Impacto del Tiempo de Estudio en la Nota Final
                  </h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dashboardData.studyHoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={theme === 'dark' ? '#c084fc' : '#a855f7'} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={theme === 'dark' ? '#c084fc' : '#a855f7'} stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} vertical={false} />
                        <XAxis dataKey="range" stroke="#64748b" tickLine={false} style={{ fontSize: 11, fontWeight: 'bold' }} />
                        <YAxis domain={[50, 100]} stroke="#64748b" tickLine={false} style={{ fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                            borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                            borderRadius: 12,
                            color: theme === 'dark' ? '#f8fafc' : '#0f172a'
                          }}
                          labelStyle={{ fontWeight: 'bold', color: theme === 'dark' ? '#c084fc' : '#a855f7' }}
                          formatter={(value) => [`${value} / 100`, 'Nota Promedio']}
                        />
                        <Area type="monotone" dataKey="avgScore" stroke={theme === 'dark' ? '#c084fc' : '#a855f7'} strokeWidth={3} fillOpacity={1} fill="url(#scoreGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Gráfico 4: Barras - Asistencia y Participación por Calificación */}
                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm dark:shadow-xl backdrop-blur-md flex flex-col justify-between transition-colors duration-300">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    Asistencia Promedio según Calificación
                  </h3>
                  <div className="h-[230px] w-full flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardData.averageMetricsByGrade} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} vertical={false} />
                        <XAxis dataKey="grade" stroke="#64748b" tickLine={false} style={{ fontSize: 11, fontWeight: 'bold' }} />
                        <YAxis domain={[50, 100]} stroke="#64748b" tickLine={false} style={{ fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                            borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                            borderRadius: 12,
                            color: theme === 'dark' ? '#f8fafc' : '#0f172a'
                          }}
                          labelStyle={{ fontWeight: 'bold' }}
                          formatter={(value) => [`${value}%`, 'Asistencia Promedio']}
                        />
                        <Bar dataKey="avgAttendance" fill={theme === 'dark' ? '#34d399' : '#10b981'} radius={[6, 6, 0, 0]} barSize={25} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>

            </div>
          )}
        </main>
      </div>
    )}
  </div>

      <SystemDescriptionFooter />
    </div>
  );
}