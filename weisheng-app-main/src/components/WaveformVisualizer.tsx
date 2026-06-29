import { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';

interface WaveformVisualizerProps {
  active: boolean;
  type: 'raw' | 'clean';
}

export default function WaveformVisualizer({ active, type }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataArrayRef = useRef<Uint8Array>(new Uint8Array(256));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;
      
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      
      if (type === 'raw') {
        ctx.strokeStyle = active ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.1)';
      } else {
        ctx.strokeStyle = active ? 'rgba(166, 137, 102, 0.8)' : 'rgba(166, 137, 102, 0.05)';
      }

      const hasData = type === 'raw' 
        ? audioEngine.getRawWaveform(dataArrayRef.current)
        : audioEngine.getCleanWaveform(dataArrayRef.current);

      if (hasData && active) {
        const sliceWidth = width / dataArrayRef.current.length;
        let x = 0;
        
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          const v = dataArrayRef.current[i] / 128.0;
          let y = v * (height / 2);
          
          // If clean, and filter is high, simulate smoother peaks
          if (type === 'clean') {
             // In a real system, the worklet provides the data
             y = (v * 0.8 + 0.1) * (height / 2);
          }

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          
          x += sliceWidth;
        }
      } else {
        // Flat line when inactive
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
      }
      
      ctx.stroke();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [active, type]);

  return (
    <canvas 
      ref={canvasRef} 
      width={1200} 
      height={200} 
      className="w-full h-full"
    />
  );
}
