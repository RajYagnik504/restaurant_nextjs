async function test() {
  const res = await fetch("https://restaurant-nextjs.pages.dev/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile: "7999620244", password: "admin123" })
  });
  const text = await res.text();
  console.log("STATUS:", res.status);
  console.log("BODY:", text);
}
test();
