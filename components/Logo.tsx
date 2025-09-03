import Image from "next/image";

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: {
      image: 'h-[44px] w-auto', // Slightly larger to show full cherry including tail
      text: 'text-3xl', // Bumped up by 3% for better proportion
      container: 'space-x-3'
    },
    md: {
      image: 'h-[44px] w-auto', // Slightly larger to show full cherry including tail
      text: 'text-2xl',
      container: 'space-x-2'
    },
    lg: {
      image: 'h-[44px] w-auto', // Slightly larger to show full cherry including tail
      text: 'text-3xl', // Large text for footer
      container: 'space-x-3'
    }
  };

  const classes = sizeClasses[size];

  return (
    <div className={`flex items-center ${classes.container}`}>
      {/* Cherry Logo Mascot */}
      <Image
        src="/chatsaidcherrylogo.png"
        alt="ChatSaid cherry logo"
        width={40}
        height={40}
        className={classes.image}
        priority
      />

      {/* Logo Text */}
      <h1 className="text-4xl font-extrabold text-white tracking-wide flex items-center drop-shadow-lg">
        <span className="text-white font-extrabold">Chat</span>
        <span className="text-red-500 font-bold">Said</span>
      </h1>
    </div>
  );
}
