"use client";

import { createContext, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, type SessionState } from "@salary-mgmt/store/query";
import { ApiError } from "@salary-mgmt/store";
import { postLogout } from "@salary-mgmt/store";
import { useQueryClient } from "@salary-mgmt/store/query";
import { queryKeys } from "@salary-mgmt/store/query";

const SessionContext = createContext<SessionState>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
});

export function useSessionContext(): SessionState {
  return useContext(SessionContext);
}

export function SessionProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const session = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  // On any query error that is a 401, sign out and redirect
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event.type === "updated" &&
        event.action.type === "error" &&
        event.action.error instanceof ApiError &&
        event.action.error.status === 401
      ) {
        void postLogout()
          .catch(() => undefined)
          .then(() => {
            void queryClient.removeQueries({ queryKey: queryKeys.session.all() });
            router.push("/auth/login");
          });
      }
    });
    return unsubscribe;
  }, [queryClient, router]);

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}
