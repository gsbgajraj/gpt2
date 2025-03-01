import { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from './queryClient';
import { User } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signInWithGoogle: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  // Get stored token
  const token = localStorage.getItem('token');

  // User query
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user'],
    enabled: !!token,
  });

  // Google sign-in mutation
  const signInMutation = useMutation({
    mutationFn: async (token: string) => {
      console.log('Starting Google Sign-In mutation...');
      const res = await apiRequest('POST', '/api/auth/google', { token });
      const data = await res.json();
      console.log('Sign-in successful, storing token...');
      localStorage.setItem('token', data.token);
      return data.user;
    },
    onSuccess: (user) => {
      console.log('Updating user data in query client...');
      queryClient.setQueryData(['/api/user'], user);
    },
    onError: (error) => {
      console.error('Sign-in error:', error);
      toast({
        title: 'Authentication Error',
        description: 'Failed to sign in. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const signInWithGoogle = async (token: string) => {
    await signInMutation.mutateAsync(token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    queryClient.setQueryData(['/api/user'], null);
    // Invalidate all queries to ensure clean state
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ user: user ?? null, isLoading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}