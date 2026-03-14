// Book.tsx
"use client";

import React, { useRef, useEffect, useState } from "react";
import HTMLFlipBookBase from "react-pageflip";

type PageDef = {
  id: string;
  title?: string;
  content: React.ReactNode;
};

type FlipBookProps = {
  pages: PageDef[];
  width?: number;
  height?: number;
};

export default function FlipBook({
  pages,
  width = 900,
  height = 650,
}: FlipBookProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const bookRef = useRef<any>(null);
  const HTMLFlipBook = HTMLFlipBookBase as unknown as React.FC<any>;

  const pageRatio = 0.7;

  const [isMobile, setIsMobile] = useState(false);
  const [mobileSize, setMobileSize] = useState({ width: 400, height: 700 });

  useEffect(() => {
    const compute = () => {
      const container = wrapperRef.current;
      if (!container) return;

      const containerW = container.clientWidth;
      const containerH = container.clientHeight;

      const mobile = containerW <= 768;
      setIsMobile(mobile);

      if (mobile) {
        const pageH = containerH;
        const singleW = Math.round(pageH / pageRatio);
        const finalW = Math.min(singleW, containerW);
        setMobileSize({ width: finalW, height: pageH });
      }
    };

    let ro: ResizeObserver | null = null;
    try {
      ro = new ResizeObserver(() => compute());
      if (wrapperRef.current) ro.observe(wrapperRef.current);
    } catch (err) {
      compute();
      window.addEventListener("resize", compute);
    }

    compute();

    return () => {
      if (ro && wrapperRef.current) ro.unobserve(wrapperRef.current);
      window.removeEventListener("resize", compute);
    };
  }, []);

  const desktopProps = {
    width: 800,
    height: 900,
    size: "stretch" as const,
    usePortrait: true,
    startPage: 0,
    showCover: false,
    drawShadow: true,
    autoSize: true,
    maxShadowOpacity: 1,
    flippingTime: 800,
    mobileScrollSupport: true,
  };

  const mobileProps = {
    width: Math.round(mobileSize.width),
    height: Math.round(mobileSize.height),
    usePortrait: true,
    startPage: 0,
    showCover: false,
    drawShadow: true,
    flippingTime: 800,
    mobileScrollSupport: true,
  };

  return (
    <div className="flipbook-wrapper" ref={wrapperRef}>
      {isMobile ? (
        <HTMLFlipBook
          ref={bookRef}
          width={mobileProps.width}
          height={mobileProps.height}
          usePortrait={mobileProps.usePortrait}
          startPage={mobileProps.startPage}
          showCover={mobileProps.showCover}
          drawShadow={mobileProps.drawShadow}
          flippingTime={mobileProps.flippingTime}
          mobileScrollSupport={mobileProps.mobileScrollSupport}
          minWidth={300}
          maxWidth={1600}
          minHeight={300}>
          {pages.map((p) => (
            <div key={p.id} className="page">
              <div className="page-inner">
                <div className="page-face page-front">
                  <div className="page-content">{p.content}</div>
                </div>
                <div className="page-face page-back" aria-hidden>
                  <div className="page-content" />
                </div>
              </div>
            </div>
          ))}
        </HTMLFlipBook>
      ) : (
        // desktop branch — rendu EXACTEMENT comme avant (aucune modification)
        <HTMLFlipBook
          ref={bookRef}
          width={desktopProps.width}
          height={desktopProps.height}
          size={desktopProps.size}
          usePortrait={desktopProps.usePortrait}
          startPage={desktopProps.startPage}
          showCover={desktopProps.showCover}
          drawShadow={desktopProps.drawShadow}
          autoSize={desktopProps.autoSize}
          maxShadowOpacity={desktopProps.maxShadowOpacity}
          flippingTime={desktopProps.flippingTime}
          mobileScrollSupport={desktopProps.mobileScrollSupport}>
          {pages.map((p) => (
            <div key={p.id} className="page">
              <div className="page-inner">
                <div className="page-face page-front">
                  <div className="page-content">{p.content}</div>
                </div>
                <div className="page-face page-back" aria-hidden>
                  <div className="page-content" />
                </div>
              </div>
            </div>
          ))}
        </HTMLFlipBook>
      )}
    </div>
  );
}
