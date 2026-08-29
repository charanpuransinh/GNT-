import React from "react";
interface Props { name: string; size?: number; }
export const UserAvatar: React.FC<Props> = ({ name, size = 40 }) => {
  const initial = name?.charAt(0).toUpperCase() || "?";
  return (
    <div className="rounded-full bg-primary text-white flex items-center justify-center font-bold" style={{ width: size, height: size }}>
      {initial}
    </div>
  );
};