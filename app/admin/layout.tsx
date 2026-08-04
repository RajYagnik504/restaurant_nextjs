import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin - ShivShaktiSystem",
  description: "Restaurant Management Admin Portal",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <head>
        <link rel="stylesheet" href="/css/admin.css" />
      </head>
      {children}
    </>
  );
}
