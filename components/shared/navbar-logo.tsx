import Link from "next/link";

interface NavbarLogoProps {
  className?: string;
}

export function NavbarLogo({ className }: NavbarLogoProps) {
  return (
    <Link href="/" className={`flex items-center space-x-4 ${className || ""}`}>
      <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
        <span className="text-primary-foreground font-bold text-sm">RS</span>
      </div>
      <span className="font-bold text-xl">Rollerstat</span>
    </Link>
  );
}
