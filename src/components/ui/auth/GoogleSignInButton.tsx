'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useLanguageStore } from '@/lib/language-store';
import { AuthResultDto } from '@/types/auth';

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number;
              locale?: string;
            }
          ) => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  onSuccess?: (authData: AuthResultDto) => void;
  onError?: (message: string) => void;
  buttonText?: 'continue_with' | 'signin_with' | 'signup_with';
  disabled?: boolean;
}

const GOOGLE_GSI_SRC = 'https://accounts.google.com/gsi/client';

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  buttonText = 'continue_with',
  disabled = false,
}) => {
  const clientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim();
  const { language } = useLanguageStore();
  const { loginWithGoogle } = useAuthStore();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const callbacksRef = useRef({ onSuccess, onError, loginWithGoogle });

  useEffect(() => {
    callbacksRef.current = { onSuccess, onError, loginWithGoogle };
  }, [onSuccess, onError, loginWithGoogle]);

  const [isScriptReady, setIsScriptReady] = useState(() =>
    typeof window !== 'undefined' && Boolean(window.google?.accounts?.id)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Google Identity Services script if Client ID is configured
  useEffect(() => {
    if (!clientId || isScriptReady) return;

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_GSI_SRC}"]`);
    if (existing) {
      const onLoad = () => setIsScriptReady(true);
      existing.addEventListener('load', onLoad);
      return () => existing.removeEventListener('load', onLoad);
    }

    const script = document.createElement('script');
    script.src = GOOGLE_GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsScriptReady(true);
    script.onerror = () => {
      callbacksRef.current.onError?.(
        language === 'vi'
          ? 'Không thể tải dịch vụ đăng nhập Google. Vui lòng kiểm tra kết nối mạng.'
          : 'Unable to load Google Sign-In script. Please check your network.'
      );
    };
    document.head.appendChild(script);
  }, [clientId, isScriptReady, language]);

  // Initialize & render official Google button responsively
  useEffect(() => {
    if (!clientId || !isScriptReady || !containerRef.current || !window.google?.accounts?.id) {
      return;
    }

    const gsi = window.google.accounts.id;

    const renderBtn = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth || 360;
      const width = Math.min(Math.max(Math.floor(containerWidth), 220), 400);

      containerRef.current.innerHTML = '';

      gsi.initialize({
        client_id: clientId,
        callback: async (response) => {
          if (!response.credential) {
            callbacksRef.current.onError?.(
              language === 'vi'
                ? 'Không nhận được thông tin xác thực từ Google.'
                : 'Did not receive credential from Google.'
            );
            return;
          }

          setIsSubmitting(true);
          try {
            const authData = await callbacksRef.current.loginWithGoogle(response.credential);
            callbacksRef.current.onSuccess?.(authData);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : '';
            callbacksRef.current.onError?.(
              msg ||
                (language === 'vi'
                  ? 'Đăng nhập Google thất bại.'
                  : 'Google authentication failed.')
            );
          } finally {
            setIsSubmitting(false);
          }
        },
      });

      gsi.renderButton(containerRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: buttonText,
        shape: 'pill',
        logo_alignment: 'left',
        width,
        locale: language === 'vi' ? 'vi' : 'en',
      });
    };

    renderBtn();

    const observer = new ResizeObserver(() => renderBtn());
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [clientId, isScriptReady, buttonText, language]);

  // Fallback button when NEXT_PUBLIC_GOOGLE_CLIENT_ID is not yet set
  if (!clientId) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          onError?.(
            language === 'vi'
              ? 'Google OAuth chưa được cấu hình: hãy thêm NEXT_PUBLIC_GOOGLE_CLIENT_ID vào .env.local và Google:ClientId ở Backend.'
              : 'Google OAuth is not configured yet: set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local and Google:ClientId on Backend.'
          );
        }}
        className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl border border-[#EADBCE] bg-white hover:bg-[#FAF7F2] active:scale-[0.99] text-[#2A211B] font-medium text-sm shadow-2xs hover:shadow-xs transition cursor-pointer group disabled:opacity-60"
      >
        <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
          <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
          <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
          <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
        </svg>
        <span className="font-semibold text-[#2A211B] group-hover:text-black">
          {language === 'vi' ? 'Tiếp tục với Google' : 'Continue with Google'}
        </span>
      </button>
    );
  }

  return (
    <div className="relative w-full flex flex-col items-center">
      <div
        ref={containerRef}
        className={`w-full flex justify-center min-h-[44px] ${
          disabled || isSubmitting ? 'pointer-events-none opacity-60' : ''
        }`}
      />
      {isSubmitting && (
        <div className="mt-2 flex items-center gap-2 text-xs text-[#7A6D63]">
          <div className="w-3.5 h-3.5 border-2 border-[#F5A764]/40 border-t-[#F5A764] rounded-full animate-spin" />
          <span>{language === 'vi' ? 'Đang xác thực tài khoản Google...' : 'Authenticating Google account...'}</span>
        </div>
      )}
    </div>
  );
};
