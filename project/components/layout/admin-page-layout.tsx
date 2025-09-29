'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AdminPageLayoutProps {
  children: ReactNode;
}

const variants = {
  hidden: { opacity: 0, x: 0, y: 20 },
  enter: { opacity: 1, x: 0, y: 0 },
  exit: { opacity: 0, x: 0, y: 20 }
};

export function AdminPageLayout({ children }: AdminPageLayoutProps) {
  return (
    <div className="h-full bg-gray-100">
      <motion.div
        className="flex-1 flex flex-col overflow-hidden"
        initial="hidden"
        animate="enter"
        exit="exit"
        variants={variants}
        transition={{
          type: "spring",
          stiffness: 380,
          damping: 30,
          when: "beforeChildren"
        }}
      >
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            enter: { opacity: 1, y: 0 },
          }}
          transition={{ delay: 0.2 }}
          className="flex-1 overflow-y-auto"
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}