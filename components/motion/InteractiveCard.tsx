"use client";

import { ReactNode, useState } from "react";

interface InteractiveCardProps {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
}

export function InteractiveCard({ children, className = "", href, onClick }: InteractiveCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const Component = href ? 'a' : 'div';
  const props = href ? { href, target: "_blank", rel: "noopener noreferrer" } : { onClick };

  return (
    <Component
      {...props}
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{
        transform: isPressed 
          ? 'translateY(-4px) scale(0.98)' 
          : isHovered 
            ? 'translateY(-8px) scale(1.02)' 
            : 'translateY(0) scale(1)',
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        opacity: 1,
      }}
    >
      {children}
    </Component>
  );
}

interface IconContainerProps {
  children: ReactNode;
  className?: string;
}

export function IconContainer({ children, className = "" }: IconContainerProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: isHovered ? 'scale(1.1) rotate(-2deg)' : 'scale(1) rotate(0deg)',
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {children}
    </div>
  );
}

