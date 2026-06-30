// Diagnóstico en memoria del último intento de /api/user.
// Sirve para depurar el registro sin acceso a los logs del contenedor.
type LastUserCall = {
  at: string;
  step: string;
  ok: boolean;
  error?: string;
} | null;

export const diag: { lastUserCall: LastUserCall } = {
  lastUserCall: null,
};

export function recordUserCall(step: string, ok: boolean, error?: string) {
  diag.lastUserCall = { at: new Date().toISOString(), step, ok, error };
}
