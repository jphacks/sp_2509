import React from 'react';


type TitleProps = {
  title: string;
};


export default function Title({title}: TitleProps)  {
    return (<h1 className='text-[28px] font-extrabold tracking-tight text-left'>{title}</h1>)
};