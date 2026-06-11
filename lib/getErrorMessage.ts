/**
 * Extract a user-friendly error message from any error object.
 */
export function getErrorMessage(error: unknown): string {
  if (!error) return "Something went wrong. Please try again.";

  if (typeof error === "object" && error !== null) {
    const err = error as Record<string, unknown>;
    
    if (typeof err.friendlyMessage === "string") return err.friendlyMessage;

    if (err.response && typeof err.response === "object") {
      const resp = err.response as Record<string, unknown>;
      if (resp.data && typeof resp.data === "object") {
        const data = resp.data as Record<string, unknown>;
        if (typeof data.message === "string") return data.message;
      }
    }

    if (typeof err.message === "string") return err.message;
  }

  if (typeof error === "string") return error;

  return "Something went wrong. Please try again.";
}
