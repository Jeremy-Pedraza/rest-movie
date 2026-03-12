import Swal from 'sweetalert2';
import type { AxiosError } from 'axios';
import {
  ALERT_TIMERS,
  ALERT_TYPE,
  CONFIRM_MESSAGES,
  HTTP_MESSAGES,
  NETWORK_ERROR,
  SUCCESS_MESSAGES,
  SWAL_DEFAULTS,
} from '../constants';

// --------------------------------------------------
// SweetAlert2 preconfigurado con defaults del proyecto
// --------------------------------------------------
const swal = Swal.mixin(SWAL_DEFAULTS);

// --------------------------------------------------
// Toast (notificación pequeña arriba a la derecha)
// --------------------------------------------------
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: ALERT_TIMERS.TOAST,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

// ============================================
// API PÚBLICA DEL SERVICIO DE ALERTAS
// ============================================

const alert = {
  // --------------------------------------------------
  // Alertas tipo modal (centro de pantalla)
  // --------------------------------------------------
  success(message?: string, title?: string) {
    return swal.fire({
      icon: ALERT_TYPE.SUCCESS,
      title: title || SUCCESS_MESSAGES.CREATED.title,
      text: message || SUCCESS_MESSAGES.CREATED.text,
      timer: ALERT_TIMERS.SUCCESS,
      showConfirmButton: false,
    });
  },

  error(message?: string, title?: string) {
    return swal.fire({
      icon: ALERT_TYPE.ERROR,
      title: title || 'Error',
      text: message,
    });
  },

  warning(message?: string, title?: string) {
    return swal.fire({
      icon: ALERT_TYPE.WARNING,
      title: title || 'Atención',
      text: message,
    });
  },

  info(message?: string, title?: string) {
    return swal.fire({
      icon: ALERT_TYPE.INFO,
      title: title || 'Información',
      text: message,
      timer: ALERT_TIMERS.INFO,
      showConfirmButton: false,
    });
  },

  // --------------------------------------------------
  // Alertas tipo toast (esquina superior derecha)
  // --------------------------------------------------
  toastSuccess(message?: string) {
    return Toast.fire({ icon: ALERT_TYPE.SUCCESS, title: message || 'Operación exitosa' });
  },

  toastError(message?: string) {
    return Toast.fire({ icon: ALERT_TYPE.ERROR, title: message || 'Ocurrió un error' });
  },

  toastWarning(message?: string) {
    return Toast.fire({ icon: ALERT_TYPE.WARNING, title: message || 'Atención' });
  },

  toastInfo(message?: string) {
    return Toast.fire({ icon: ALERT_TYPE.INFO, title: message || 'Información' });
  },

  // --------------------------------------------------
  // Confirmaciones
  // --------------------------------------------------
  confirm(options: { icon?: string; title?: string; text?: string; confirmButtonText?: string; cancelButtonText?: string } = {}) {
    const defaults = CONFIRM_MESSAGES.DELETE;
    return swal.fire({
      icon: (options.icon || defaults.icon) as 'warning' | 'question',
      title: options.title || defaults.title,
      text: options.text || defaults.text,
      showCancelButton: true,
      confirmButtonText: options.confirmButtonText || defaults.confirmButtonText,
      cancelButtonText: options.cancelButtonText || defaults.cancelButtonText,
    });
  },

  confirmDelete(customText?: string) {
    return swal.fire({
      ...CONFIRM_MESSAGES.DELETE,
      text: customText || CONFIRM_MESSAGES.DELETE.text,
      showCancelButton: true,
    });
  },

  confirmSave(customText?: string) {
    return swal.fire({
      ...CONFIRM_MESSAGES.SAVE,
      text: customText || CONFIRM_MESSAGES.SAVE.text,
      showCancelButton: true,
    });
  },

  confirmLogout() {
    return swal.fire({
      ...CONFIRM_MESSAGES.LOGOUT,
      showCancelButton: true,
    });
  },

  // --------------------------------------------------
  // Manejo global de errores HTTP
  // --------------------------------------------------
  handleHttpError(error: AxiosError<{ message?: string | string[]; details?: Record<string, string[]> }>) {
    // Error de red (sin respuesta del servidor)
    if (!error.response) {
      return swal.fire(NETWORK_ERROR);
    }

    const status = error.response.status;
    const serverMessage = error.response.data?.message;
    const serverDetails = error.response.data?.details;

    // Buscar mensaje predefinido para este código HTTP
    const predefined = HTTP_MESSAGES[status];

    if (predefined) {
      // Construir texto con detalles de validación si existen
      let text: string = (typeof serverMessage === 'string' ? serverMessage : undefined) || predefined.text;

      if (serverDetails && typeof serverDetails === 'object') {
        const detailLines = Object.values(serverDetails).flat();
        if (detailLines.length > 0) {
          text = detailLines.join('\n');
        }
      }

      // Para arrays de mensajes (NestJS validation pipe)
      if (Array.isArray(serverMessage)) {
        text = serverMessage.join('\n');
      }

      return swal.fire({
        icon: predefined.icon,
        title: predefined.title,
        text,
      });
    }

    // Fallback para códigos no mapeados
    return swal.fire({
      icon: ALERT_TYPE.ERROR,
      title: `Error ${status}`,
      text: (typeof serverMessage === 'string' ? serverMessage : undefined) || 'Ocurrió un error inesperado.',
    });
  },

  // --------------------------------------------------
  // Mensajes CRUD preconfigurados
  // --------------------------------------------------
  created(entityName?: string) {
    return Toast.fire({
      icon: ALERT_TYPE.SUCCESS,
      title: entityName ? `${entityName} creado exitosamente` : SUCCESS_MESSAGES.CREATED.text,
    });
  },

  updated(entityName?: string) {
    return Toast.fire({
      icon: ALERT_TYPE.SUCCESS,
      title: entityName ? `${entityName} actualizado exitosamente` : SUCCESS_MESSAGES.UPDATED.text,
    });
  },

  deleted(entityName?: string) {
    return Toast.fire({
      icon: ALERT_TYPE.SUCCESS,
      title: entityName ? `${entityName} eliminado exitosamente` : SUCCESS_MESSAGES.DELETED.text,
    });
  },

  loginSuccess() {
    return Toast.fire({
      icon: SUCCESS_MESSAGES.LOGIN.icon,
      title: SUCCESS_MESSAGES.LOGIN.title,
    });
  },

  registerSuccess() {
    return Toast.fire({
      icon: SUCCESS_MESSAGES.REGISTER.icon,
      title: SUCCESS_MESSAGES.REGISTER.title,
    });
  },

  registerPending() {
    return swal.fire({
      icon: SUCCESS_MESSAGES.REGISTER_PENDING.icon,
      title: SUCCESS_MESSAGES.REGISTER_PENDING.title,
      text: SUCCESS_MESSAGES.REGISTER_PENDING.text,
      showConfirmButton: true,
    });
  },
};

export default alert;
