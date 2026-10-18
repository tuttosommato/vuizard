// What the overview and the artist page show while their data is on its way: "Loading" with
// three dots that light up one after another, over a background that gently pulses, like the
// frame of an image preview that is still loading. Styles in shared.css.
export default function LoadingScreen() {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <p className="loading-screen-text">
        Loading
        <span className="loading-dots" aria-hidden="true">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </p>
    </div>
  );
}
