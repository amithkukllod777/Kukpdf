export default function Header({ title, sub }: { title: string; sub?: string }) {
  return (
    <header>
      <h1>{title}</h1>
      {sub && <p>{sub}</p>}
    </header>
  );
}
