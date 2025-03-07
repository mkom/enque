
import "./satoshi.css"
import "./globals.css";


export const metadata = {
  title: "OQOE | Dashboard",
  description: "OQOE | Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
