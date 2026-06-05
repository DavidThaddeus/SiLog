"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { PIXEL_SCRIPT, trackPageView } from "@/lib/facebook-pixel";

export function FacebookPixelScript() {
  const pathname = usePathname();

  useEffect(() => {
    trackPageView();
  }, [pathname]);

  return (
    <>
      <Script
        id="fb-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: PIXEL_SCRIPT }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src="https://www.facebook.com/tr?id=1540629934350526&ev=PageView&noscript=1"
          alt=""
        />
      </noscript>
    </>
  );
}
