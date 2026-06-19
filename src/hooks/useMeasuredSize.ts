import { useState, useLayoutEffect, useRef } from "react";

export default function useMeasuredSize<T extends Element = Element>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // First measurement
    setWidth(el.getBoundingClientRect().width);
    setHeight(el.getBoundingClientRect().height);
    // Reacts to chenages in the element's size, e.g. due to window resizing
    const ro = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
      setHeight(entry.contentRect.height);
    });

    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  return { ref, width, height };
}
