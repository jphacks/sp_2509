'use client';

import Image from 'next/image';
import Carousel from '../../components/Carousel_iwai';
import Title from '../../components/title';
import RoutingButton from '../../components/routingButton';
import mapIcon from './img/map_icon.png';

export default function Home() {
    const carouselItems = [
        { src: '/images/sample4.png', alt: 'Slide 1', description: '走りたいルートの形を書く' },
        { src: '/images/whiteblue.png', alt: 'Slide 2', description: '走り始める場所とおおよその長さを決める' },
        { src: '/images/sample4.png', alt: 'Slide 3', description: '説明文3' },
        { src: '/images/sample4.png', alt: 'Slide 4', description: '説明文4' },
    ];

    const paddingX = 'px-4';
    const paddingTop = 'pt-8';
    const paddingBottom = 'pb-12';
    const backgroundColor = 'rgb(248, 246, 251)';

    return (
        <div style={{ backgroundColor }} className="text-black min-h-screen">
            <main className={`flex flex-col ${paddingTop} ${paddingBottom} max-w-md mx-auto min-h-screen`}>
                <div className={`${paddingX} flex flex-col gap-y-10`}>
                    {/* Top Text */}
                    <div className='text-left'>
                        <Title title="ジョギングアプリ" />
                        <div className="mt-2 text-sm text-gray-500">
                            <p>好きな絵のコースで走ってみませんか？</p>
                            <p>GPSアートになるジョギングコースをデザインしましょう</p>
                        </div>
                    </div>

                    {/* How to Use Section */}
                    <div>
                        <h2 className="text-2xl font-bold mb-4">How to Use</h2>
                        <div className="-mx-4">
                            <Carousel
                                items={carouselItems}
                                imageBorderRadius="rounded-2xl"
                                textClassName="text-white"
                            />
                        </div>
                    </div>

                    {/* Created Course Section */}
                    <div className="text-center flex flex-col items-center gap-y-4">
                        <h2 className="text-2xl font-bold">作成したコース</h2>
                        <div className="p-8 bg-gray-100 rounded-full">
                            <Image src={mapIcon} alt="Map Icon" width={80} height={80} />
                        </div>
                        <p className="text-gray-500">まだルートがありません</p>
                        <p className="text-gray-500">絵を描いて最初のルートを作りましょう</p>
                    </div>
                </div>

                {/* Create New Route Button */}
                <div className={`mt-auto ${paddingX} w-full pt-10`}>
                    <RoutingButton
                        buttonText="新しいルートを作る"
                        to="/draw"
                        className="w-full !bg-black text-white !py-4 !text-lg !rounded-full"
                    />
                </div>
            </main>
        </div>
    );
}
