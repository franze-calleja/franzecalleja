import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";

const subscribeNever = () => () => {};

/**
 * One-shot reveal trigger. `armed` is false in server HTML and during
 * hydration (so no-JS visitors see final content) and true once the client has
 * taken over; `inView` flips to true the first time the element intersects,
 * after which the observer disconnects.
 */
export function useInViewOnce<T extends Element>({ threshold = 0.3 }: { threshold?: number } = {}): {
  ref: RefObject<T | null>;
  armed: boolean;
  inView: boolean;
} {
  const ref = useRef<T | null>(null);
  const armed = useSyncExternalStore(subscribeNever, () => true, () => false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [inView, threshold]);

  return { ref, armed, inView };
}
