import "./assets/css/main.css";
import type { Metadata } from "next";
import ReduxProvider from "./lib/reduxProvider";
import LayoutWrapper from "./components/LayoutWrapper";

export const metadata: Metadata = {
  title: "Vexel AI Agent Platform",
  description: "Multi-level AI Agent system with advanced memory, reasoning, and team collaboration",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ReduxProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </ReduxProvider>
      </body>
    </html>
  );
}
