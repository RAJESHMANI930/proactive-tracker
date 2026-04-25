import { useState, useEffect, useRef, useCallback } from 'react';

const WORK_SECS = 25 * 60;
const BREAK_SECS = 5 * 60;

export function usePomodoro(onSessionComplete) {
  const [phase, setPhase] = useState('idle'); // 'idle' | 'work' | 'break'
  const [remaining, setRemaining] = useState(WORK_SECS);
  const intervalRef = useRef(null);

  const clear = () => { clearInterval(intervalRef.current); intervalRef.current = null; };

  const start = useCallback(() => {
    if (phase === 'idle') {
      setPhase('work');
      setRemaining(WORK_SECS);
    }
  }, [phase]);

  const pause = useCallback(() => {
    if (phase === 'work' || phase === 'break') {
      clear();
      setPhase(p => p === 'work' ? 'work_paused' : 'break_paused');
    } else if (phase === 'work_paused' || phase === 'break_paused') {
      setPhase(p => p === 'work_paused' ? 'work' : 'break');
    }
  }, [phase]);

  const reset = useCallback(() => {
    clear();
    setPhase('idle');
    setRemaining(WORK_SECS);
  }, []);

  useEffect(() => {
    if (phase !== 'work' && phase !== 'break') { clear(); return; }
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          if (phase === 'work') {
            onSessionComplete?.();
            setPhase('break');
            return BREAK_SECS;
          } else {
            setPhase('idle');
            return WORK_SECS;
          }
        }
        return r - 1;
      });
    }, 1000);
    return clear;
  }, [phase, onSessionComplete]);

  const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
  const secs = String(remaining % 60).padStart(2, '0');
  const display = `${mins}:${secs}`;
  const isRunning = phase === 'work' || phase === 'break';
  const isBreak = phase === 'break' || phase === 'break_paused';

  return { phase, display, isRunning, isBreak, start, pause, reset };
}
