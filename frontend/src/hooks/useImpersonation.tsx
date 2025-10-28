import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useSelector } from "react-redux";
import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL;

interface ImpersonationContextType {
  impersonatedUserId: string | null;
  impersonatedUserEmail: string | null;
  setImpersonation: (userId: string | null, email: string | null) => void;
  clearImpersonation: () => void;
}

const ImpersonationContext = createContext<
  ImpersonationContextType | undefined
>(undefined);

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [impersonatedUserId, setImpersonatedUserId] = useState<string | null>(
    null
  );
  const [impersonatedUserEmail, setImpersonatedUserEmail] = useState<
    string | null
  >(null);

  const { user, token, isAuthenticated } = useSelector(
    (state: any) => state.auth
  );

  // Fetch active impersonation from DB when app loads
  useEffect(() => {
    const adminId = user?.id; // or Redux user ID
    if (!adminId) return;

    const fetchImpersonation = async () => {
      try {
        // const { data } = await axios.get(`${API_URL}impersonate/active/${adminId}`);
        const { data } = await axios.get(
          `${API_URL}impersonate/active/${adminId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (data) {
          setImpersonatedUserId(data.impersonated_user_id);
          setImpersonatedUserEmail(data.impersonated_email);
        } else {
          clearImpersonation();
        }
      } catch (err) {
        console.error("Failed to fetch active impersonation:", err);
      }
    };

    fetchImpersonation();
  }, []);

  // const setImpersonation = (userId: string | null, email: string | null) => {
  //   setImpersonatedUserId(userId);
  //   setImpersonatedUserEmail(email);
  // };

  // const clearImpersonation = () => {
  //   setImpersonatedUserId(null);
  //   setImpersonatedUserEmail(null);
  // };

  // Use same names as your current implementation
  const setImpersonation = async (
    userId: string | null,
    email: string | null
  ) => {
    try {
      const adminId = user.id;
      // await axios.post(`${API_URL}impersonate/start`, {
      //   adminId,
      //   userId,
      //   userEmail: email,
      // });
      await axios.post(
        `${API_URL}impersonate/start`,
        {
          adminId,
          userId,
          userEmail: email,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setImpersonatedUserId(userId);
      setImpersonatedUserEmail(email);
    } catch (err) {
      console.error("Failed to start impersonation:", err);
    }
  };

  const clearImpersonation = async () => {
    try {
      const adminId = user.id;
      //await axios.post(`${API_URL}impersonate/stop`, { adminId });
      await axios.post(
        `${API_URL}impersonate/stop`,
        { adminId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setImpersonatedUserId(null);
      setImpersonatedUserEmail(null);
    } catch (err) {
      console.error("Failed to stop impersonation:", err);
    }
  };

  return (
    <ImpersonationContext.Provider
      value={{
        impersonatedUserId,
        impersonatedUserEmail,
        setImpersonation,
        clearImpersonation,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext);
  if (context === undefined) {
    throw new Error(
      "useImpersonation must be used within an ImpersonationProvider"
    );
  }
  return context;
}
