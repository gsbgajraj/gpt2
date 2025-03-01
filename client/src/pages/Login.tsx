import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export default function Login() {
  const [, setLocation] = useLocation();
  const { user, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const [accessCode, setAccessCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (user) {
      console.log('User is authenticated, redirecting to chat...');
      setLocation('/');
    }
  }, [user, setLocation]);

  const verifyAccessCode = () => {
    if (accessCode === 'gajraj.tech') {
      setIsVerified(true);
      toast({
        title: 'Access Granted',
        description: 'You can now sign in with Google',
      });
    } else {
      toast({
        title: 'Invalid Access Code',
        description: 'Please enter the correct access code',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (!isVerified) return;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    console.log('Initializing Google Sign-In with client ID:', clientId);

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response: { credential: string }) => {
              try {
                console.log('Google Sign-In successful, processing response...');
                await signInWithGoogle(response.credential);
                setLocation('/');
              } catch (error) {
                console.error('Failed to process Google Sign-In:', error);
                toast({
                  title: 'Error',
                  description: 'Failed to sign in with Google. Please try again.',
                  variant: 'destructive',
                });
              }
            },
          });

          console.log('Rendering Google Sign-In button...');
          window.google.accounts.id.renderButton(
            document.getElementById('google-signin')!,
            { theme: 'filled_blue', size: 'large', width: 250 }
          );
        } catch (error) {
          console.error('Error initializing Google Sign-In:', error);
          toast({
            title: 'Error',
            description: 'Failed to initialize Google Sign-In. Please try again later.',
            variant: 'destructive',
          });
        }
      }
    };

    script.onerror = () => {
      console.error('Failed to load Google Sign-In script');
      toast({
        title: 'Error',
        description: 'Failed to load Google Sign-In. Please check your internet connection.',
        variant: 'destructive',
      });
    };

    return () => {
      document.body.removeChild(script);
    };
  }, [signInWithGoogle, setLocation, toast, isVerified]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Welcome</h1>
          <p className="mt-2 text-muted-foreground">Enter access code to continue</p>
        </div>

        {!isVerified ? (
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Enter access code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="w-full"
            />
            <Button 
              onClick={verifyAccessCode}
              className="w-full"
            >
              Verify Access Code
            </Button>
          </div>
        ) : (
          <div className="flex justify-center">
            <div id="google-signin"></div>
          </div>
        )}
      </Card>
    </div>
  );
}