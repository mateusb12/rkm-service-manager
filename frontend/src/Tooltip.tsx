import { createPortal } from 'react-dom';
import { useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';

export function Tooltip({
  content,
  children,
  className,
  style,
  targetClassName,
  mode = 'cursor',
  instant = false,
}: {
  content: ReactNode;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  targetClassName?: string;
  mode?: 'cursor' | 'anchor';
  instant?: boolean;
}) {
  const target = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const frameRef = useRef<number | null>(null);
  const latestPoint = useRef({ x: 0, y: 0 });
  const fastVisible = useRef(false);
  const [point, setPoint] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  const move = (event: MouseEvent<HTMLSpanElement>) => {
    if (mode === 'cursor' && instant) {
      latestPoint.current = {
        x: event.clientX,
        y: event.clientY,
      };

      if (!fastVisible.current) {
        fastVisible.current = true;

        const bubble = bubbleRef.current;
        if (bubble) {
          bubble.style.left = `${event.clientX}px`;
          bubble.style.top = `${event.clientY}px`;
        }

        setVisible(true);
        return;
      }

      if (frameRef.current === null) {
        frameRef.current = requestAnimationFrame(() => {
          frameRef.current = null;

          const bubble = bubbleRef.current;
          if (!bubble) return;

          bubble.style.left = `${latestPoint.current.x}px`;
          bubble.style.top = `${latestPoint.current.y}px`;
        });
      }

      return;
    }

    setPoint({ x: event.clientX, y: event.clientY });
    setVisible(true);
  };

  const hide = () => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    fastVisible.current = false;
    setVisible(false);
  };

  const showAnchored = () => {
    const rect = target.current?.getBoundingClientRect();
    if (!rect) return;

    setPoint({
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
    setVisible(true);
  };
  return (
    <>
      <span
        className={`rkm-tooltip pointer-events-auto${className ? ` ${className}` : ''}`}
        style={style}
        tabIndex={0}
        onFocus={showAnchored}
        onMouseEnter={mode === 'anchor' ? showAnchored : instant ? move : undefined}
        onBlur={hide}
        onMouseLeave={hide}
      >
        <span
          ref={target}
          className={`rkm-tooltip-target${targetClassName ? ` ${targetClassName}` : ''}`}
          onMouseMove={mode === 'cursor' ? move : undefined}
        >
          {children}
        </span>
      </span>
      {createPortal(
        <span
          ref={bubbleRef}
          className={`rkm-tooltip-content${visible ? ' is-visible' : ''}`}
          role="tooltip"
          style={{
            left: point.x,
            top: point.y,
            transition: instant || mode === 'anchor' ? 'none' : undefined,
          }}
        >
          {content}
        </span>,
        document.body,
      )}
    </>
  );
}
