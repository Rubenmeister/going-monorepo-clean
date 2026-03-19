import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const es = {
  translation: {
    nav: {
      home: 'Inicio',
      search: 'Buscar',
      bookings: 'Reservas',
      admin: 'Admin',
      profile: 'Perfil',
      logout: 'Cerrar Sesión',
    },
    pages: {
      dashboard: 'Panel de Control',
      bookings: 'Gestión de Reservas',
      users: 'Gestión de Usuarios',
      payments: 'Gestión de Pagos',
      analytics: 'Analytics',
    },
    booking: {
      create: 'Crear Reserva',
      confirm: 'Confirmar Reserva',
      cancel: 'Cancelar Reserva',
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      cancelled: 'Cancelada',
      completed: 'Completada',
    },
    payment: {
      amount: 'Monto',
      currency: 'Moneda',
      status: 'Estado',
      succeeded: 'Exitoso',
      pending: 'Pendiente',
      failed: 'Fallido',
    },
    auth: {
      login: 'Iniciar Sesión',
      register: 'Registrarse',
      email: 'Correo Electrónico',
      password: 'Contraseña',
      firstName: 'Nombre',
      lastName: 'Apellido',
    },
    errors: {
      required: 'Este campo es requerido',
      invalidEmail: 'Email inválido',
      passwordMismatch: 'Las contraseñas no coinciden',
      unauthorized: 'No autorizado',
      notFound: 'No encontrado',
    },
  },
};

const en = {
  translation: {
    nav: {
      home: 'Home',
      search: 'Search',
      bookings: 'Bookings',
      admin: 'Admin',
      profile: 'Profile',
      logout: 'Logout',
    },
    pages: {
      dashboard: 'Dashboard',
      bookings: 'Bookings Management',
      users: 'Users Management',
      payments: 'Payments Management',
      analytics: 'Analytics',
    },
    booking: {
      create: 'Create Booking',
      confirm: 'Confirm Booking',
      cancel: 'Cancel Booking',
      pending: 'Pending',
      confirmed: 'Confirmed',
      cancelled: 'Cancelled',
      completed: 'Completed',
    },
    payment: {
      amount: 'Amount',
      currency: 'Currency',
      status: 'Status',
      succeeded: 'Succeeded',
      pending: 'Pending',
      failed: 'Failed',
    },
    auth: {
      login: 'Login',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      firstName: 'First Name',
      lastName: 'Last Name',
    },
    errors: {
      required: 'This field is required',
      invalidEmail: 'Invalid email',
      passwordMismatch: 'Passwords do not match',
      unauthorized: 'Unauthorized',
      notFound: 'Not found',
    },
  },
};

i18n.use(initReactI18next).init({
  resources: { es, en },
  lng: localStorage.getItem('language') || 'es',
  fallbackLng: 'es',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
