import { Great_Vibes } from "next/font/google";
import "./gold-text.css";

const greatVibes = Great_Vibes({ weight: "400", subsets: ["latin"] });

export function GoldText({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`gold-wrap ${className}`}>
      <h2 className={`gold-text ${greatVibes.className}`}>{children}</h2>
    </span>
  );
}
