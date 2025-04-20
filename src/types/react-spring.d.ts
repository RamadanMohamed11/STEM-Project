declare module '@react-spring/web' {
  export interface SpringValue<T = any> {
    get(): T;
    set(value: T): void;
  }

  export interface AnimatedProps<T> {
    style?: T;
    children?: React.ReactNode;
  }

  export interface SpringConfig {
    mass?: number;
    tension?: number;
    friction?: number;
    clamp?: boolean;
    precision?: number;
    velocity?: number;
    duration?: number;
    easing?: (t: number) => number;
  }

  export function useSpring<T = any>(
    config: {
      from?: Partial<T>;
      to?: Partial<T>;
      config?: SpringConfig;
    }
  ): [T, (value: Partial<T>) => void];

  export function animated<T extends React.ElementType>(
    Component: T
  ): React.ForwardRefExoticComponent<React.PropsWithoutRef<React.ComponentProps<T>> & React.RefAttributes<unknown>>;
}
