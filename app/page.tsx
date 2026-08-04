export default function Home() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
      <p>Redirecting to <a href="/admin/dashboard">Admin Dashboard</a>...</p>
      <script dangerouslySetInnerHTML={{ __html: `window.location.href = '/admin/dashboard';` }} />
    </div>
  );
}
