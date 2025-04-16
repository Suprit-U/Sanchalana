import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, Github, Linkedin } from "lucide-react";

interface Coordinator {
  name: string;
  role: string;
  phone: string;
  linkedin: string;
  github: string;
}

export function ContactDialog() {
  const coordinators: Coordinator[] = [
    {
      name: "Suprit U",
      role: "Student Coordinator ㅤ supritu.22cs@saividya.ac.in",
      phone: "9480065765",
      linkedin: "https://www.linkedin.com/in/suprit-u-a030ab305/",
      github: "https://github.com/Suprit-U",
    },
	{
      name: "Risheek R",
      role: "Student Coordinator ㅤ risheekr.22cs@saividya.ac.in",
      phone: "8792092680",
      linkedin: "https://www.linkedin.com/in/risheek01234/",
      github: "https://github.com/Rishi01010010",
    },
    {
      name: "Kushaal A Kumar",
      role: "Student Coordinator ㅤ kushaalakumar.22cs@saividya.ac.in",
      phone: "9741882168",
      linkedin: "https://www.linkedin.com/in/kushaal-a-kumar-861082331",
      github: "https://github.com/Kushaal-29",
    },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Phone className="h-4 w-4" />
          Contact
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            Contact Coordinators
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-6">
          {coordinators.map((coordinator, index) => (
            <div
              key={index}
              className="flex flex-col gap-4 rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">{coordinator.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {coordinator.role}
                  </p>
                </div>
                <a
                  href={`tel:${coordinator.phone}`}
                  className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                >
                  <Phone className="h-5 w-5" />
                  <span>{coordinator.phone}</span>
                </a>
              </div>
              <div className="flex gap-4">
                <a
                  href={coordinator.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Linkedin className="h-5 w-5" />
                  <span className="text-sm">LinkedIn</span>
                </a>
                <a
                  href={coordinator.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Github className="h-5 w-5" />
                  <span className="text-sm">GitHub</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}