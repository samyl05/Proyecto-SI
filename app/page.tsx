'use client';

import { useState, useEffect } from 'react';
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
  ChevronRight,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

// Paleta de colores para gráficos
const COLORS = {
  A: '#95B300', // Esmeralda
  B: '#7627c4', // Indigo
  C: '#f755f7d4', // Purpura
  D: '#f59e0b', // Ámbar
  F: '#3fdff4e1', // Rosa/Rojo
};

const PIE_COLORS = ['#95B300', '#7627c4', '#f755f7d4', '#f59e0b', '#3fdff4e1'];

export default function Home() {
  // Estado de Autenticación
  const [user, setUser] = useState<any>(null);
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
  const [regError, setRegError] = useState('');
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  // Estado del Dashboard
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState('');

  // Filtros del Dashboard
  const [filterGrades, setFilterGrades] = useState<string[]>(['A', 'B', 'C', 'D', 'F']);
  const [filterStudyMin, setFilterStudyMin] = useState(0);
  const [filterStudyMax, setFilterStudyMax] = useState(50);
  const [filterAttendanceMin, setFilterAttendanceMin] = useState(0);
  const [filterAttendanceMax, setFilterAttendanceMax] = useState(100);
  const [filterParticipationMin, setFilterParticipationMin] = useState(1);
  const [filterParticipationMax, setFilterParticipationMax] = useState(10);

  // Simulador de Proyección Individual
  const [simHours, setSimHours] = useState('15');
  const [simAttendance, setSimAttendance] = useState('85');
  const [simParticipation, setSimParticipation] = useState('6');
  const [simResult, setSimResult] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);

  // Estado del Tema
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Inicializar tema al montar
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'dark';
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

  // Verificar sesión al montar
  useEffect(() => {
    checkSession();
  }, []);

  // Recargar datos cuando cambian los filtros (con debounce simulado al soltar el ratón o directamente al cambiar)
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [
    user,
    filterGrades,
    filterStudyMin,
    filterStudyMax,
    filterAttendanceMin,
    filterAttendanceMax,
    filterParticipationMin,
    filterParticipationMax,
  ]);

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.loggedIn) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('Error verificando sesión:', err);
    } finally {
      setAuthLoading(false);
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
    } catch (err) {
      setLoginError('Error de red al intentar iniciar sesión');
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName, email: regEmail, password: regPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRegSuccess(true);
        setLoginEmail(regEmail);
        setLoginPassword(regPassword);
        // Esperar 1.5s y cambiar a pestaña de login precompletada
        setTimeout(() => {
          setAuthTab('login');
          setRegSuccess(false);
          setRegName('');
          setRegEmail('');
          setRegPassword('');
        }, 1500);
      } else {
        setRegError(data.error || 'Error al registrar el usuario');
      }
    } catch (err) {
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
      // Limpiar filtros
      setFilterGrades(['A', 'B', 'C', 'D', 'F']);
      setFilterStudyMin(0);
      setFilterStudyMax(50);
      setFilterAttendanceMin(0);
      setFilterAttendanceMax(100);
      setFilterParticipationMin(1);
      setFilterParticipationMax(10);
    } catch (err) {
      console.error('Error cerrando sesión:', err);
    }
  };

  const fetchDashboardData = async () => {
    setDashboardLoading(true);
    setDashboardError('');
    try {
      const res = await fetch('/api/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grades: filterGrades,
          studyHoursMin: filterStudyMin,
          studyHoursMax: filterStudyMax,
          attendanceMin: filterAttendanceMin,
          attendanceMax: filterAttendanceMax,
          participationMin: filterParticipationMin,
          participationMax: filterParticipationMax,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDashboardData(data.data);
      } else {
        setDashboardError(data.error || 'Error al obtener datos');
      }
    } catch (err) {
      setDashboardError('Error de red al conectar con el servidor de BI');
    } finally {
      setDashboardLoading(false);
    }
  };

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

  const toggleGradeFilter = (grade: string) => {
    if (filterGrades.includes(grade)) {
      setFilterGrades(filterGrades.filter((g) => g !== grade));
    } else {
      setFilterGrades([...filterGrades, grade]);
    }
  };

  const selectAllGrades = () => setFilterGrades(['A', 'B', 'C', 'D', 'F']);
  const clearGrades = () => setFilterGrades([]);

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
              Redimiento Estudiantil <span className="text-indigo-600 dark:text-indigo-400 font-medium text-lg px-2 py-0.5 bg-indigo-550/10 dark:bg-indigo-500/10 rounded-md border border-indigo-100 dark:border-indigo-500/20">BI</span>
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
                authTab === 'login' ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
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
                authTab === 'register' ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-555 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
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
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 italic mt-1 block">
                    * Nota: Las contraseñas se almacenan en texto plano en la BD.
                  </p>
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
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-655 dark:text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>¡Registro exitoso! Redirigiendo a Iniciar Sesión...</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider block">
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
                  <label className="text-[11px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider block">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <Mail className="w-4.5 h-4.5" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="usuario@bi.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 outline-none transition-colors duration-200"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider block">
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
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 outline-none transition-colors duration-200"
                    />
                  </div>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 italic mt-1 block">
                    * Nota: La contraseña será almacenada sin encriptar, tal como se solicitó.
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
              Redimiento Estudiantil <span className="text-[10px] px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-650 dark:text-indigo-400 font-bold rounded border border-indigo-100 dark:border-indigo-500/20">BI</span>
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
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
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
                <span className="text-slate-350 dark:text-slate-700 text-[9px] font-bold">|</span>
                <button
                  onClick={clearGrades}
                  className="text-[9px] font-bold text-slate-500 dark:text-slate-400 hover:underline cursor-pointer"
                >
                  Limpiar
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {['A', 'B', 'C', 'D', 'F'].map((g) => {
                const active = filterGrades.includes(g);
                return (
                  <button
                    key={g}
                    onClick={() => toggleGradeFilter(g)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all duration-200 cursor-pointer ${
                      active
                        ? 'bg-indigo-55 dark:bg-indigo-600/20 border-indigo-500 dark:border-indigo-500 text-indigo-600 dark:text-indigo-300 shadow'
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
              <span className="text-xs font-bold text-indigo-655 dark:text-indigo-400">
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
                  onChange={(e) => setFilterStudyMin(Number(e.target.value))}
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
                  onChange={(e) => setFilterStudyMax(Number(e.target.value))}
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
                  onChange={(e) => setFilterAttendanceMin(Number(e.target.value))}
                  className="w-full accent-emerald-600 dark:accent-emerald-500 h-1.5 bg-slate-100 dark:bg-slate-950 border-none rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-550 dark:text-slate-500 font-bold uppercase">Máximo</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filterAttendanceMax}
                  onChange={(e) => setFilterAttendanceMax(Number(e.target.value))}
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
              <span className="text-xs font-bold text-purple-650 dark:text-purple-400">
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
                  onChange={(e) => setFilterParticipationMin(Number(e.target.value))}
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
                  onChange={(e) => setFilterParticipationMax(Number(e.target.value))}
                  className="w-full accent-purple-600 dark:accent-purple-500 h-1.5 bg-slate-100 dark:bg-slate-950 border-none rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Indicación de Auto-Aplicación */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-450 dark:text-slate-500 flex items-center gap-1.5 italic justify-center text-center">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Los filtros se aplican automáticamente
          </div>
        </aside>

        {/* Zona del Dashboard Principal */}
        <main className="lg:col-span-3 space-y-6">
          {/* Sección de Simulación Condicional */}
          {showSimulator && (
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-indigo-500/20 rounded-3xl p-6 shadow-sm dark:shadow-xl relative overflow-hidden transition-all duration-300">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-indigo-650 dark:text-indigo-400 animate-pulse" />
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
                      {Number(simResult.predictedScore) < 60 ? (
                        <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-100 dark:border-rose-500/20 text-left flex items-start gap-2.5 text-rose-700 dark:text-rose-300">
                          <AlertTriangle className="w-4.5 h-4.5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block mb-0.5">Alerta de Riesgo Académico:</span>
                            El alumno está bajo el umbral mínimo aprobatorio. Requiere tutorías.
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20 text-left flex items-start gap-2.5 text-emerald-700 dark:text-emerald-300">
                          <GraduationCap className="w-4.5 h-4.5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block mb-0.5">Estado Aceptable:</span>
                            Las proyecciones indican un rendimiento académico seguro.
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
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-500/15">
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
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-500/15">
                    <Percent className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">
                      Aprobación %
                    </p>
                    <p className="text-xl font-black text-emerald-650 dark:text-emerald-400 mt-0.5">
                      {dashboardData.kpis.passRate}%
                    </p>
                  </div>
                </div>

                {/* KPI 3 */}
                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 hover:border-purple-500/30 transition duration-300 shadow-sm dark:shadow flex items-center gap-4">
                  <div className="p-3 bg-purple-50 dark:bg-purple-500/10 text-purple-650 dark:text-purple-400 rounded-2xl border border-purple-100 dark:border-purple-500/15">
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
                          {dashboardData.gradeDistribution.map((entry: any, index: number) => (
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
                          {dashboardData.gradeDistribution.map((entry: any, index: number) => (
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
                    {['A', 'B', 'C', 'D', 'F'].map((g) => (
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
                            <stop offset="5%" stopColor="#7627c4" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#7627c4" stopOpacity={0.0} />
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
                          labelStyle={{ fontWeight: 'bold', color: '#f755f7d4' }}
                          formatter={(value) => [`${value} / 100`, 'Nota Promedio']}
                        />
                        <Area type="monotone" dataKey="avgScore" stroke="#7627c4" strokeWidth={3} fillOpacity={1} fill="url(#scoreGrad)" />
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
                        <Bar dataKey="avgAttendance" fill="#95B300" radius={[6, 6, 0, 0]} barSize={25} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>

            </div>
          )}
        </main>
      </div>

      {/* Footer Fino */}
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-500 font-medium transition-colors duration-300">
        © 2026 Redimiento Estudiantil Analytics BI Platform. Desarrollado para hosting en Vercel.
      </footer>
    </div>
  );
}