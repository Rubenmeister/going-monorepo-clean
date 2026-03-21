/**
 * Wrapper seguro sobre expo-haptics.
 * Si el módulo no está disponible (simulador sin soporte, versión antigua)
 * las llamadas fallan silenciosamente sin crashear la app.
 */
let Haptics: typeof import('expo-haptics') | null = null;
try { Haptics = require('expo-haptics'); } catch {}

/** Toque suave — selección de chip, tab, ítem de lista */
export const hapticLight = () =>
  Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

/** Toque medio — confirmar acción, solicitar viaje */
export const hapticMedium = () =>
  Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

/** Toque fuerte — cancelar viaje, acción destructiva */
export const hapticHeavy = () =>
  Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});

/** Éxito — viaje completado, pago exitoso, registro correcto */
export const hapticSuccess = () =>
  Haptics?.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

/** Error — fallo de API, validación fallida */
export const hapticError = () =>
  Haptics?.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});

/** Advertencia — countdown bajo, saldo insuficiente */
export const hapticWarning = () =>
  Haptics?.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
