import React from 'react';

type TitleProps = {
  title: string;
};


export default function Title({title}: TitleProps)  {
    return (<h1 className='text-3xl md:text-4xl font-extrabold tracking-tight'>{title}</h1>)
};