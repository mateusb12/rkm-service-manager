import { createPortal } from 'react-dom';
import { useRef, useState, type MouseEvent, type ReactNode } from 'react';

export function Tooltip({ content, children }: { content: ReactNode; children: ReactNode }) {
  const target = useRef<HTMLSpanElement>(null);
  const [point, setPoint] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  const move = (event: MouseEvent<HTMLSpanElement>) =>
    (() => {
      setPoint({ x: event.clientX, y: event.clientY });
      setVisible(true);
    })();
  const focus = () => {
    const rect = target.current?.getBoundingClientRect();
    if (rect) {
      setPoint({ x: rect.left + rect.width / 2, y: rect.top });
      setVisible(true);
    }
  };
  return (
    <>
      <span
        className="rkm-tooltip pointer-events-auto"
        tabIndex={0}
        onFocus={focus}
        onBlur={() => setVisible(false)}
        onMouseLeave={() => setVisible(false)}
      >
        <span ref={target} className="rkm-tooltip-target" onMouseMove={move}>
          {children}
        </span>
      </span>
      {createPortal(
        <span
          className={`rkm-tooltip-content${visible ? ' is-visible' : ''}`}
          role="tooltip"
          style={{ left: point.x, top: point.y }}
        >
          {content}
        </span>,
        document.body,
      )}
    </>
  );
}
