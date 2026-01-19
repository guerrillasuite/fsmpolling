// app/layout.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone as DialsIcon, ClipboardList as SurveyIcon } from "lucide-react";
import "./styles/globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  
  // Check if we're on a survey page (hide nav)
  const isSurveyPage = pathname.startsWith('/survey');

  const isActive = React.useCallback(
    (href: string) => pathname.startsWith(href),
    [pathname]
  );

  React.useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--app-vh", `${vh}px`);
    };
    setVh();
    window.addEventListener("resize", setVh);
    return () => window.removeEventListener("resize", setVh);
  }, []);

  // If it's a survey page, render without navigation
  if (isSurveyPage) {
    return (
      <html lang="en">
        <body>
          {children}
        </body>
      </html>
    );
  }

  // Simplified layout with just Dials and Surveys
  return (
    <html lang="en">
      <body>
        <section className="app-shell">
          <header className="app-header">
            <div className="app-header-logo">
              <div aria-label="GroundGame" className="app-header-title">
                GroundGame
              </div>
            </div>
          </header>

          <div className="app-content">
            {children}
          </div>

          <nav className="app-footer-nav">
            <div className="app-footer-grid">
              <FooterLink
                href="/dials"
                label="Dials"
                active={isActive("/dials")}
                Icon={DialsIcon}
              />
              <FooterLink
                href="/crm/survey"
                label="Surveys"
                active={isActive("/crm/survey")}
                Icon={SurveyIcon}
              />
            </div>
          </nav>
        </section>
      </body>
    </html>
  );
}

function FooterLink({
  href,
  label,
  active,
  Icon,
}: {
  href: string;
  label: string;
  active: boolean;
  Icon: React.ComponentType<{ size?: number }>;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`app-footer-link ${active ? 'active' : ''}`}
    >
      <Icon size={20} />
      <span className="app-footer-link-label">{label}</span>
    </Link>
  );
}