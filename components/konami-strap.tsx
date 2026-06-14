const CODE = "↑↑↓↓←→←→BA";

// A peelable tape-strap banner with glitchy konami code text.
// Pure CSS — no client state needed.
export default function KonamiStrap() {
  return (
    <div
      className="konami-strap"
      role="note"
      aria-label="Konami code cheat: Up Up Down Down Left Right Left Right B A"
    >
      <span className="konami-glitch" data-text={CODE}>
        {CODE}
      </span>
    </div>
  );
}
