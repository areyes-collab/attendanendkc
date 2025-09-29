'use client';

import Image from 'next/image';
import ndkcLogo from '../../public/ndkc.png';
import { NavBar } from './nav-bar';

export function HomeHeader() {
  return (
    <header>
      <div className="bg-white px-6 py-2">
        <div className="flex items-center gap-2 max-w-7xl mx-auto">
          <Image 
            src={ndkcLogo}
            alt="NDKC Logo" 
            width={32}
            height={32}
            className="object-contain"
            priority
          />
          <h1 className="text-base font-bold text-[#006400]">NOTRE DAME OF KIDAPAWAN COLLEGE</h1>
        </div>
      </div>
      <NavBar />
    </header>
  );
}