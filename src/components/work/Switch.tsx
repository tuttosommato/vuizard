export default function Switch<T extends string>({
  currentState,
  setNewState,
  options,
}: {
  currentState: T;
  setNewState: (state: T) => void;
  options: [{ value: T; label: string }, { value: T; label: string }];
}) {
  return (
    <div className="button-switch" data-active={currentState}>
      {options.map(({ value, label }) => (
        <button
          key={value}
          className="toggle-button"
          type="button"
          aria-pressed={currentState === value}
          onClick={() => setNewState(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}