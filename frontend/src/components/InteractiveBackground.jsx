import { useEffect, useState } from 'react';

const InteractiveBackground = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event) => {
      setMousePos({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-0 bg-[#0a0a0a] pointer-events-none"></div>
      
      {/* Animated blob 1 */}
      <div 
        className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/10 blur-[120px] pointer-events-none animate-pulse"
        style={{ animationDuration: '8s' }}
      ></div>
      
      {/* Animated blob 2 */}
      <div 
        className="fixed bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-900/15 blur-[150px] pointer-events-none animate-pulse"
        style={{ animationDuration: '12s', animationDelay: '2s' }}
      ></div>

      {/* Mouse follow glow */}
      <div
        className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(229, 9, 20, 0.08), transparent 80%)`,
        }}
      ></div>
      
      {/* Noise overlay for texture */}
      <div 
        className="fixed inset-0 z-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
      ></div>
    </>
  );
};

export default InteractiveBackground;
