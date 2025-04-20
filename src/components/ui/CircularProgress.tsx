import React from 'react';

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showText?: boolean;
  color?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 40,
  strokeWidth = 4,
  className = '',
  showText = true,
  color = 'blue',
}) => {
  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.min(100, Math.max(0, progress));
  
  // Calculate radius and circumference
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedProgress / 100) * circumference;
  
  // Color classes
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    red: 'text-red-600',
    orange: 'text-orange-600',
  };

  // Track color classes
  const trackColorClasses = {
    blue: 'text-blue-100',
    green: 'text-green-100',
    purple: 'text-purple-100',
    red: 'text-red-100',
    orange: 'text-orange-100',
  };

  const selectedColor = color as keyof typeof colorClasses;
  const colorClass = colorClasses[selectedColor] || colorClasses.blue;
  const trackColorClass = trackColorClasses[selectedColor] || trackColorClasses.blue;

  return (
    <div className={`relative inline-flex ${className}`} style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
        <circle
          className={trackColorClass}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
        />
      </svg>
      
      {/* Progress circle */}
      <svg
        className="absolute top-0 left-0 w-full h-full -rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          className={`transition-all duration-300 ease-out ${colorClass}`}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      
      {/* Percentage text */}
      {showText && (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
          {Math.round(normalizedProgress)}%
        </div>
      )}
    </div>
  );
};