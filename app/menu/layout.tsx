import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menu - ShivShakti",
  description: "Digital Menu & Ordering",
};

export default function MenuLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <head>
        <link rel="stylesheet" href="/css/menu.css" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      {children}
    </>
  );
}
