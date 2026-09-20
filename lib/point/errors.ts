export class PointError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "PointError";
    this.status = status;
  }
}

/** Never return database, provider, or authentication internals to a client. */
export function pointErrorResponse(error: unknown): {
  status: number;
  message: string;
} {
  if (error instanceof PointError)
    return { status: error.status, message: error.message };
  return { status: 503, message: "点位服务暂时不可用，请稍后重试。" };
}
