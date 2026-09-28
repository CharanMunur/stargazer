import React from 'react';
import { motion, type Variants } from 'framer-motion';

export interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  yOffset?: number;
  className?: string;
  id?: string;
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.5,
  yOffset = 20,
  className = '',
  id,
}: FadeInProps) {
  const customVariants: Variants = {
    hidden: { opacity: 0, y: yOffset },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay, duration, ease: 'easeOut' },
    },
  };

  return (
    <motion.div
      id={id}
      variants={customVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default FadeIn;
