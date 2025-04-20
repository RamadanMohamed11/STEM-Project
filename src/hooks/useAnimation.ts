import { useMemo } from 'react';

export const useAnimation = () => {
  const fadeIn = useMemo(() => ({
    opacity: 1,
    transition: 'opacity 0.3s ease-in-out'
  }), []);

  const slideIn = useMemo(() => ({
    transform: 'translateX(0)',
    opacity: 1,
    transition: 'all 0.3s ease-in-out'
  }), []);

  return {
    fadeIn,
    slideIn
  };
};

export default useAnimation;
