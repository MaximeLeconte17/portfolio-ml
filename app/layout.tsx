
import "./styles/globals.css";
import localFont from "next/font/local";

const newspaper = localFont({
  src: "./font/newspaper.otf",
  variable: "--font-newspaper"
});

export const metadata = {
  title: "Journal - Flip Book",
  description: "Portfolio style journal avec pages qui se tournent",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={newspaper.variable}>
      <head>
        {/* optional: Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Playfair+Display:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}