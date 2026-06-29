import { useState, useEffect } from 'react';

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('shengxi_admin');
    if (saved === 'true') {
      setIsAdmin(true);
    }
  }, []);

  const loginAdmin = (password: string) => {
    // 仅用于前端校验，实际敏感操作仍需后端校验
    const correctPassword = "K9#mP2$vL5@xQ7&z";
    if (password === correctPassword) {
      setIsAdmin(true);
      localStorage.setItem('shengxi_admin', 'true');
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    localStorage.removeItem('shengxi_admin');
  };

  return { isAdmin, loginAdmin, logoutAdmin };
}
