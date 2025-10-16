import React from 'react';

type HeaderProps = {
  headerText: string;
};


export default function Header({ headerText }: HeaderProps) {
  return (<h2 className="text-xl md:text-2xl font-bold tracking-tight">{headerText}</h2>)
};