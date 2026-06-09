export type SessionEvent = { type: 'session'; session_id: string };
export type TokenEvent = { type: 'token'; delta: string };
export type ToolEvent = {
  type: 'tool';
  id: string;
  name: string;
  args: Record<string, unknown>;
};
export type ToolResultEvent = {
  type: 'tool_result';
  id: string;
  name: string;
  result: string;
};
export type DoneEvent = { type: 'done' };
export type ErrorEvent = { type: 'error'; message: string };

export type StreamEvent =
  | SessionEvent
  | TokenEvent
  | ToolEvent
  | ToolResultEvent
  | DoneEvent
  | ErrorEvent;
