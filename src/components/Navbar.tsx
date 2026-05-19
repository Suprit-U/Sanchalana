import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Phone, User, ChevronDown, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "./ui/input";
import { useIsMobile } from "@/hooks/use-mobile";

const contactCoordinators = [
  { name: "Suprit U", phone: "9480065765", role: "Website Coordinator" },
  { name: "Risheek R", phone: "8792092680", role: "Website Coordinator" },
  { name: "Kushaal A Kumar", phone: "9741882168", role: "Website Coordinator" }
];

export function Navbar() {
  const isMobile = useIsMobile();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setIsLoggedIn(true);
        setUser(data.session.user);
      }
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsLoggedIn(true);
        setUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
      navigate("/");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSearchDialog(false);
    navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-purple-300/20 bg-transparent backdrop-blur-lg">
      <div className="container flex h-14 sm:h-16 items-center">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
          <img 
            src="/logo.jpg" 
            alt="Sanchalana Logo" 
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover transition-transform duration-500 group-hover:rotate-12"
          />
          <span className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 group-hover:from-pink-500 group-hover:to-purple-500">
            {isMobile ? "Sanchalana" : "Sanchalana 2025"}
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-3 sm:gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative hover:bg-purple-500/10"
            onClick={() => setShowSearchDialog(true)}
          >
            <Search className="h-5 w-5 text-purple-400" />
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="relative hover:bg-purple-500/10">
                <Phone className="h-5 w-5 text-purple-400" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900/95 backdrop-blur-lg border-purple-300/20 shadow-lg max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl text-gray-200">Contact Coordinators</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {contactCoordinators.map((coordinator) => (
                  <div key={coordinator.phone} className="flex items-center gap-3 p-3 bg-purple-900/30 rounded-lg">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600/50">
                      <span className="text-lg font-semibold text-purple-200">
                        {coordinator.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-purple-100">{coordinator.name}</h4>
                      <p className="text-sm text-purple-300">{coordinator.role}</p>
                      <a 
                        href={`tel:${coordinator.phone}`}
                        className="text-sm text-purple-400 hover:text-purple-200"
                      >
                        {coordinator.phone}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          
          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 hover:bg-purple-500/10 px-2 sm:px-4">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-purple-600/50 text-purple-100">
                      {user?.user_metadata?.full_name 
                        ? `${user.user_metadata.full_name.split(' ')[0][0]}${user.user_metadata.full_name.split(' ')[1]?.[0] || ''}`
                        : user?.email?.substring(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline text-purple-100">
                    {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-purple-300" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-gray-900/95 backdrop-blur-lg border-purple-300/20">
                <DropdownMenuItem asChild>
                  <Link to="/admin" className="cursor-pointer text-purple-200 hover:text-purple-100 hover:bg-purple-800/30">Admin Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-purple-300/20" />
                <DropdownMenuItem 
                  className="cursor-pointer text-red-400 focus:text-red-300 hover:bg-red-900/30"
                  onClick={handleLogout}
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4">
              <Link to="/auth">{isMobile ? "Login" : "Login"}</Link>
            </Button>
          )}
        </nav>
      </div>
      
      <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <DialogContent className="sm:max-w-[600px] bg-gray-900/95 backdrop-blur-lg border-purple-300/20">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-200">Search Events</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSearch} className="mt-4">
            <div className="relative">
              <Input
                type="search"
                placeholder="Search for events..."
                className="w-full p-3 pl-10  bg-gray-800/50 border border-purple-300/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowSearchDialog(false)}
                className="border-purple-400/30 text-purple-300 hover:bg-purple-800/30"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-purple-600 hover:bg-purple-700"
              >
                Search
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  );
}
