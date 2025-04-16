import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Clock } from 'lucide-react';

export default function LiveCounter() {
  const [registrationCount, setRegistrationCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Calculate countdown to May 9th, 2025 in IST
  useEffect(() => {
    // Target date: May 9th, 2025 00:00:00 IST (UTC+5:30)
    const targetDate = new Date('2025-05-09T00:00:00+05:30');
    
    const updateCountdown = () => {
      // Get current time in IST
      const now = new Date();
      // Convert to IST by adding the offset (IST is UTC+5:30)
      const istOffsetMinutes = 330; // 5 hours and 30 minutes in minutes
      const utcOffsetMinutes = now.getTimezoneOffset();
      const totalOffsetMinutes = istOffsetMinutes + utcOffsetMinutes;
      
      // Create a new date adjusted to IST
      const nowIST = new Date(now.getTime() + totalOffsetMinutes * 60 * 1000);
      
      const difference = targetDate.getTime() - nowIST.getTime();
      
      if (difference <= 0) {
        // Event has arrived
        setCountdown({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0
        });
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setCountdown({ days, hours, minutes, seconds });
    };
    
    // Update immediately and then every second
    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total verified registrations
        const { count: regCount, error: regError } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .eq('payment_status', 'Verified');
        
        if (regError) throw regError;
        
        setRegistrationCount(regCount || 0);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
    
    // Set up realtime subscription
    const regChannel = supabase
      .channel('registration-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'registrations' }, 
        () => {
          fetchStats();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(regChannel);
    };
  }, []);

  return (
    <div className="h-full flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-foreground mb-4">Live Countdown</h2>
      
      {/* Countdown Timer - Now First */}
      <Card className="bg-gradient-to-r from-indigo-800 to-purple-900 border-0 text-center">
        <CardContent className="py-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-white" />
            <h3 className="text-lg font-semibold text-white">Countdown to Sanchalana 2025 (IST)</h3>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-black/30 rounded-lg p-2">
              <p className="text-3xl font-bold text-white">{countdown.days}</p>
              <p className="text-xs text-gray-200">Days</p>
            </div>
            <div className="bg-black/30 rounded-lg p-2">
              <p className="text-3xl font-bold text-white">{countdown.hours}</p>
              <p className="text-xs text-gray-200">Hours</p>
            </div>
            <div className="bg-black/30 rounded-lg p-2">
              <p className="text-3xl font-bold text-white">{countdown.minutes}</p>
              <p className="text-xs text-gray-200">Minutes</p>
            </div>
            <div className="bg-black/30 rounded-lg p-2">
              <p className="text-3xl font-bold text-white">{countdown.seconds}</p>
              <p className="text-xs text-gray-200">Seconds</p>
            </div>
          </div>
          
          <p className="text-xs text-gray-300 mt-4">Mark your calendar for May 9th, 2025!</p>
        </CardContent>
      </Card>
      
      {/* Registration Count - Now Second */}
      <Card className="bg-gradient-to-r from-purple-900 to-indigo-800 border-0 text-center flex flex-col justify-center">
        <CardContent className="py-6 flex-grow flex flex-col justify-center">
          {loading ? (
            <div className="flex justify-center items-center flex-grow">
              <Loader2 className="h-12 w-12 animate-spin text-white" />
            </div>
          ) : (
            <div className="flex flex-col justify-center flex-grow text-center">
              <p className="text-6xl font-bold text-white mb-2">{registrationCount}</p>
              <p className="text-sm text-gray-200">Total successful registrations</p>
              <p className="text-xs text-gray-300 mt-2">Join the excitement of Sanchalana 2025!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}