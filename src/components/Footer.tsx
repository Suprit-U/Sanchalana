import { Facebook, Instagram, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-black/90 backdrop-blur-sm text-white border-t border-white/10">
      <div className="container flex flex-col items-center gap-6 py-10">
        <img 
          src="/logo.jpg" 
          alt="Sanchalana Logo" 
          className="h-12 w-12 rounded-full object-cover transition-transform duration-500 hover:rotate-12"
        />
        
        <div className="flex gap-6">
          <a 
            href="https://www.facebook.com/SaiVidyaInstituteOfTechnology/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-gray-400 hover:text-purple-400 transition-colors duration-300 transform hover:scale-110"
          >
            <Facebook className="h-6 w-6" />
          </a>
          <a 
            href="https://www.instagram.com/sai_vidya_institute_of_tech/?hl=en" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-gray-400 hover:text-purple-400 transition-colors duration-300 transform hover:scale-110"
          >
            <Instagram className="h-6 w-6" />
          </a>
          <a 
            href="https://in.linkedin.com/school/sai-vidya-institute-of-technology/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-gray-400 hover:text-purple-400 transition-colors duration-300 transform hover:scale-110"
          >
            <Linkedin className="h-6 w-6" />
          </a>
        </div>
        
        <p className="text-sm text-gray-400 opacity-80 hover:opacity-100 transition-opacity duration-300">
          © 2025 Sanchalana. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}