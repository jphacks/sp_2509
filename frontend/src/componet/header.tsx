import React from 'react';

type TitleProps = {
  headerText: string;
};


export default function Title({headerText}: TitleProps)  {
    return (<h1 className='text-3xl md:text-4xl font-extrabold tracking-tight'>{headerText}</h1>)
};