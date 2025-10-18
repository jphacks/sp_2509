import React from 'react';
import Image from 'next/image';
import Header from './Header';

type RecommendedShapeProps = {
  shapeImageSrc: string;
};

export default function RecommendedShape({shapeImageSrc}: RecommendedShapeProps)  {
    return (
<Image src={shapeImageSrc} alt="Recommended Shape" className='flex w-32 h-32 object-contain' width={512} height={512}/>
    )
}