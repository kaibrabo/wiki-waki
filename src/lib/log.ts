// Central error logging.
//
// Dev: prints to the console with console.warn, so a handled error never trips
// the fullscreen red LogBox. Production: forwards to a reporter sink if one has
// been installed via setErrorReporter - otherwise it is a no-op, so nothing
// leaves the device until a reporter (e.g. Sentry) is explicitly wired up. That
// keeps the app's "Data Not Collected" posture true by default.

export type LogContext = {
  /** Short area label, e.g. 'scheduler' or 'widget'. */
  tag?: string;
  /** Extra structured detail to attach to the report. */
  extra?: Record<string, unknown>;
};

export type ErrorReporter = (error: unknown, context?: LogContext) => void;

let reporter: ErrorReporter | null = null;

/** Install (or clear, with null) the production error sink. */
export function setErrorReporter(fn: ErrorReporter | null): void {
  reporter = fn;
}

/** Log a handled error. Safe to call from any catch block; never throws. */
export function logError(error: unknown, context?: LogContext): void {
  if (__DEV__) {
    const label = context?.tag ? `[${context.tag}]` : '[error]';
    if (context?.extra) console.warn(label, error, context.extra);
    else console.warn(label, error);
  }
  try {
    reporter?.(error, context);
  } catch {
    // A broken reporter must never escape into the caller's error path.
  }
}
