import React from 'react';

type HeaderProps = {
  headerText: string;
};


export default function Header({ headerText }: HeaderProps) {
  return (<h1 className="text-black text-xl font-bold tracking-tight text-left">{headerText}</h1>)
};