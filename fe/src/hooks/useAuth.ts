// src/hooks/useAuth.ts
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { 
  login, 
  register, 
  logout, 
  getCurrentUser 
} from '@/store/slices/authSlice';
import { AppDispatch, RootState } from '@/store';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  
  const { 
    user, 
    token, 
    isAuthenticated, 
    loading, 
    error 
  } = useSelector((state: RootState) => state.auth);

  // Lấy thông tin user khi có token
  useEffect(() => {
    if (token && !user) {
      dispatch(getCurrentUser());
    }
  }, [token, user, dispatch]);

  // Hàm đăng nhập
  const handleLogin = useCallback(
    async (email: string, password: string) => {
      try {
        await dispatch(login({ email, password })).unwrap();
        router.push('/');
        return true;
      } catch (error) {
        return false;
      }
    },
    [dispatch, router]
  );

  // Hàm đăng ký
  const handleRegister = useCallback(
    async (username: string, email: string, password: string) => {
      try {
        await dispatch(register({ username, email, password })).unwrap();
        router.push('/');
        return true;
      } catch (error) {
        return false;
      }
    },
    [dispatch, router]
  );

  // Hàm đăng xuất
  const handleLogout = useCallback(async () => {
    await dispatch(logout());
    router.push('/login');
  }, [dispatch, router]);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
  };
};