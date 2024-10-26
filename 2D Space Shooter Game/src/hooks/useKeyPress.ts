import { useState, useEffect } from 'react';

export function useKeyPress(targetKey: string) {
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = ({ key }: KeyboardEvent) => {
      if (key === targetKey) {
        setIsPressed(true);
      }
    };

    const handleKeyUp = ({ key }: KeyboardEvent) => {
      if (key === targetKey) {
        setIsPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [targetKey]);

  return isPressed;
}