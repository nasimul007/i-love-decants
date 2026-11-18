import { KEYS, readJSON, writeJSON } from "@/lib/storage";
import type { LoginActor, LoginEvent } from "@/types";

const MAX = 200;

export const loginHistoryService = {
  list: (): LoginEvent[] => readJSON<LoginEvent[]>(KEYS.loginHistory, []),
  record(type: LoginActor, user: string, action: LoginEvent["action"]): void {
    const history = this.list();
    history.unshift({ type, user, action, ts: new Date().toISOString() });
    if (history.length > MAX) history.length = MAX;
    writeJSON(KEYS.loginHistory, history);
  },
};
