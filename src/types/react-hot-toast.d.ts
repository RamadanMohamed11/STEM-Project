declare module 'react-hot-toast' {
  export interface ToastOptions {
    duration?: number;
    style?: React.CSSProperties;
    className?: string;
    icon?: React.ReactNode;
    iconTheme?: {
      primary: string;
      secondary: string;
    };
    ariaProps?: {
      role: string;
      'aria-live': string;
    };
  }

  export interface Toast {
    id: string;
    type: string;
    message: string;
    icon?: React.ReactNode;
    duration?: number;
    pauseDuration: number;
    position?: string;
  }

  export interface ToasterProps {
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    toastOptions?: ToastOptions;
    reverseOrder?: boolean;
    gutter?: number;
    containerStyle?: React.CSSProperties;
    containerClassName?: string;
  }

  export function Toaster(props: ToasterProps): JSX.Element;
  export function toast(message: string, options?: ToastOptions): string;
  export namespace toast {
    export function success(message: string, options?: ToastOptions): string;
    export function error(message: string, options?: ToastOptions): string;
    export function loading(message: string, options?: ToastOptions): string;
    export function custom(message: string, options?: ToastOptions): string;
    export function dismiss(toastId?: string): void;
    export function remove(toastId?: string): void;
  }
}
