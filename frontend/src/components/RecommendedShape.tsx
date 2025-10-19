import React from 'react';
import Image from 'next/image';

type RecommendedShapeProps = {
  shapeImageSrc: string;
};

export default function RecommendedShape({shapeImageSrc}: RecommendedShapeProps)  {
    return (
<Image src={shapeImageSrc} alt="Recommended Shape" className='flex w-32 h-32 object-contain shadow' width={512} height={512}/>
    )
}