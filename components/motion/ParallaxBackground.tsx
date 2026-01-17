"use client";

import { useState, useEffect, useRef } from "react";

interface ParallaxBackgroundProps {
  sectionRef?: React.RefObject<HTMLElement | null>;
  parallaxSpeed?: number;
}

export function ParallaxBackground({ sectionRef, parallaxSpeed = 0.15 }: ParallaxBackgroundProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        });
      }
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target;
      // Check if target is an HTMLElement and has closest method
      if (target && target instanceof HTMLElement && typeof target.closest === 'function') {
        const section = target.closest('section');
        if (section) {
          setHoveredSection(section.id || 'default');
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('mouseenter', handleMouseEnter, true);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mouseenter', handleMouseEnter, true);
    };
  }, []);

  // Calculate grid color based on hovered section
  const getGridColor = () => {
    if (hoveredSection) {
      // Subtle color shift from slate to amber
      return `linear-gradient(to right, rgba(251, 191, 36, 0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(251, 191, 36, 0.08) 1px, transparent 1px)`;
    }
    return `linear-gradient(to right, rgb(0,0,0) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(0,0,0) 1px, transparent 1px)`;
  };

  const y1 = scrollY * parallaxSpeed;
  const y2 = scrollY * parallaxSpeed * 0.8;

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Reactive Grid Background with Color Shift */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] transition-all duration-1000"
        style={{
          backgroundImage: getGridColor(),
          backgroundSize: '48px 48px',
          transform: `translate(${mousePosition.x * 10 - 5}px, ${mousePosition.y * 10 + scrollY * 0.1}px)`,
        }}
      />
      
      {/* Parallax Radial Glows */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-r from-amber-400/15 via-yellow-500/10 to-amber-400/15 rounded-full blur-3xl transition-transform duration-1000 ease-out"
        style={{
          transform: `translate(${mousePosition.x * 20 - 10}px, ${mousePosition.y * 20 + y1}px)`,
        }}
      />
      <div 
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-r from-yellow-500/10 to-amber-400/8 rounded-full blur-3xl transition-transform duration-1000 ease-out"
        style={{
          transform: `translate(${-mousePosition.x * 15 + 5}px, ${-mousePosition.y * 15 + y2}px)`,
        }}
      />
    </div>
  );
}

