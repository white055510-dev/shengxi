import React from 'react';
import { User, Contact } from '../types';

interface UserAvatarProps {
  person: User | Contact | null;
  size?: number;
  className?: string;
  showBorder?: boolean;
}

export default function UserAvatar({ person, size = 48, className = '', showBorder = true }: UserAvatarProps) {
  if (!person) return null;

  const colors = ['#A68966', '#7B876D', '#00d4ff'];
  
  // Hash function to get consistent color for a name/id
  const getHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const name = 'nickname' in person ? person.nickname : person.name;
  const initial = name.charAt(0).toUpperCase();
  const color = colors[getHash(person.id) % colors.length];

  const containerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor: person.avatar ? 'transparent' : color,
  };

  return (
    <div 
      className={`rounded-full flex items-center justify-center overflow-hidden shrink-0 ${
        showBorder ? 'border-2 border-brand-bronze/40' : ''
      } ${className}`}
      style={containerStyle}
    >
      {person.avatar ? (
        <img 
          src={person.avatar} 
          alt={name} 
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback if image fails to load
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).parentElement!.style.backgroundColor = color;
          }}
        />
      ) : (
        <span className="text-white font-bold" style={{ fontSize: `${size / 2.5}px` }}>
          {initial}
        </span>
      )}
    </div>
  );
}
