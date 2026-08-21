import { useRef, useState, type MouseEvent, type ReactNode } from 'react';

export function Tooltip({ content, children }: { content: string; children: ReactNode }) {
  const target = useRef<HTMLSpanElement>(null);
  const [point, setPoint] = useState({ x: 0, y: 0 });
  const move = (event: MouseEvent<HTMLSpanElement>) => setPoint({ x: event.clientX, y: event.clientY });
  const focus = () => {
    const rect = target.current?.getBoundingClientRect();
    if (rect) setPoint({ x: rect.left + rect.width / 2, y: rect.top });
  };
  return <span className="rkm-tooltip" tabIndex={0} onFocus={focus}>
    <span ref={target} className="rkm-tooltip-target" onMouseMove={move}>
    {children}
    </span>
    <span className="rkm-tooltip-content" role="tooltip" style={{ left: point.x, top: point.y }}>{content}</span>
  </span>;
}
