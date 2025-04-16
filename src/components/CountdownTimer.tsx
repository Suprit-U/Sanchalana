
import { useEffect, useState } from "react";
import { Card, CardContent } from "./ui/card";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function CountdownTimer() {
  const targetDate = new Date("2025-05-09T00:00:00+05:30"); // May 9, 2025 IST
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-center">
      <h2 className="text-lg font-semibold mb-2">Event starts in</h2>
      <div className="flex justify-center gap-2 md:gap-4">
        <TimeBlock value={timeLeft.days} label="Days" />
        <TimeBlock value={timeLeft.hours} label="Hours" />
        <TimeBlock value={timeLeft.minutes} label="Minutes" />
        <TimeBlock value={timeLeft.seconds} label="Seconds" />
      </div>
    </div>
  );
}

interface TimeBlockProps {
  value: number;
  label: string;
}

function TimeBlock({ value, label }: TimeBlockProps) {
  return (
    <Card className="bg-primary/5 border-primary/20 w-16 md:w-24">
      <CardContent className="p-2 md:p-4 flex flex-col items-center justify-center">
        <span className="text-2xl md:text-3xl font-bold text-primary">
          {value.toString().padStart(2, '0')}
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  );
}
