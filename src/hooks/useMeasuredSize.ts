import { useState, useLayoutEffect, useRef } from "react";

// The size of an element: its content width and its height (border box). For a table cell the two
// are measured differently on purpose: the width is what is left between its padding, where its
// content is drawn; the height is the cell's whole height. Safari doesn't count what centres a
// cell's content vertically in its content box, so there the content height is only that of the
// text (16px for a 50px cell).
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
      // the element's own box: the observer's content height is the wrong one in Safari
      setHeight(el.getBoundingClientRect().height);
    });

    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  return { ref, width, height };
}
