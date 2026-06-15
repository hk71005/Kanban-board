'use client';

import React from 'react';

interface FormProps {
  children: React.ReactNode;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export const Form: React.FC<FormProps> = ({ children, onSubmit }) => {
  return (
    <form onSubmit={onSubmit}>
      {children}
    </form>
  );
};