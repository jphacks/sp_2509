import React from 'react';

type HeaderProps = {
  headerText: string;
};


export default function Header({headerText}: HeaderProps)  {
    return (<h1 className='text-3xl md:text-4xl font-extrabold tracking-tight'>{headerText}</h1>)
};