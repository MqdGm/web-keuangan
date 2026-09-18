'use client';

import React from 'react';
import * as Icons from 'lucide-react';
import { LucideProps } from 'lucide-react';

interface DynamicIconProps extends LucideProps {
  name: string;
}

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  // Normalize PascalCase or kebab-case
  const pascalName = name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  // @ts-ignore
  const IconComponent = (Icons[pascalName] || Icons[name] || Icons.Tag) as React.ComponentType<LucideProps>;

  return <IconComponent {...props} />;
}
