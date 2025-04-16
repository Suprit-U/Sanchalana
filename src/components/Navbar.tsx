import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { ContactDialog } from "./ContactDialog";
import { UserMenu } from "./UserMenu";

export function Navbar() {
  const { user, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-primary to-secondary opacity-75 blur"></div>
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-background overflow-hidden">
                <img
                  src="/logo.jpg"
                  alt="Logo"
                  className="h-10 w-10 object-cover rounded-full"
                />
              </div>
            </div>
            <span className="font-bold text-2xl md:text-3xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Sanchalana 2025
            </span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <button 
          className="md:hidden" 
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center space-x-4">
          <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
            Home
          </Link>
          <Link to="/search" className="text-sm font-medium hover:text-primary transition-colors">
            Search Events
          </Link>
          {isAdmin && (
            <Link to="/admin" className="text-sm font-medium hover:text-primary transition-colors">
              Admin
            </Link>
          )}
          <ContactDialog />
          <ThemeToggle />
          {user ? (
            <UserMenu />
          ) : (
            <Button asChild variant="default" size="sm">
              <Link to="/auth">Login / Sign Up</Link>
            </Button>
          )}
        </nav>
      </div>

      {/* Mobile navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t p-4 bg-background animate-fade-in">
          <nav className="flex flex-col space-y-4">
            <Link 
              to="/" 
              className="text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/search" 
              className="text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Search Events
            </Link>
            {isAdmin && (
              <Link 
                to="/admin" 
                className="text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Admin
              </Link>
            )}
            <div className="flex flex-col space-y-2">
              <ContactDialog />
              <div className="flex items-center justify-between">
                <ThemeToggle />
                {user ? (
                  <UserMenu />
                ) : (
                  <Button asChild variant="default" size="sm">
                    <Link to="/auth" onClick={() => setIsMenuOpen(false)}>Login / Sign Up</Link>
                  </Button>
                )}
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
