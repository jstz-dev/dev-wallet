export default function NotFound() {
  return (
    <div>
      <h1>404 Not Found</h1>
      {location.href} {location.search}
    </div>
  );
}
