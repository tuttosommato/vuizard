import { MIN_HEIGHT, MIN_WIDTH } from "@/hooks/useScreenBigEnough";

// Shown in place of the page when the window is too small for it

export default function ScreenSizeNotice() {
  return (
    <main className="screen-size-notice" role="alert">
      <h1>This visualisation needs a larger screen</h1>
      <p>
        Please open it on a computer, or enlarge the window to at least{" "}
        {MIN_WIDTH} × {MIN_HEIGHT} pixels. You can still read the About page.
      </p>
    </main>
  );
}
