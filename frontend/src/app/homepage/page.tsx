'use client';

import { useEffect, useState } from 'react';
import Carousel from '../../components/Carousel';
import Title from '../../components/Title';
import RoutingButton from '../../components/RoutingButton';
import EmptyCourse from './components/EmptyCourse';
import CourseList from './components/CourseList';

export default function Home() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

        const fetchCourses = async (userId: string) => {
            //alert(userId); // userIdを表示
            //userId = '23af53791bd9448dbe98a095920266ec'; // テスト用に固定
            try {
                const res = await fetch(`${API_URL}/users/${userId}/courses`);
                const data = await res.json();
                setCourses(data);
            } catch (error) {
                console.error('Error fetching courses:', error);
            } finally {
                setLoading(false);
            }
        };

        const initializeUser = async () => {
            let uuid = localStorage.getItem('uuid');
            if (!uuid) {
                try {
                    const res = await fetch(`${API_URL}/users`, { method: 'POST' });
                    const data = await res.json();
                    uuid = data.user_id;
                    if (uuid) {
                        localStorage.setItem('uuid', uuid);
                    }
                } catch (error) {
                    console.error('Error creating user:', error);
                    return;
                }
            }
            if (uuid) {
                fetchCourses(uuid);
            }
        };

        initializeUser();
    }, []);



    const carouselItems = [
        { src: '/images/sample4.png', alt: 'Slide 1', description: '走りたいルートの形を書く' },
        { src: '/images/whiteblue.png', alt: 'Slide 2', description: '走り始める場所とおおよその長さを決める' },
        { src: '/images/sample4.png', alt: 'Slide 3', description: '説明文3' },
        { src: '/images/sample4.png', alt: 'Slide 4', description: '説明文4' },
    ];

    const paddingX = 'px-4';
    const paddingTop = 'pt-8';
    const paddingBottom = 'pb-12';

    return (
        <div className="text-black min-h-screen bg-[rgb(248,246,251)]">
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
                    <div>
                        <h2 className="text-2xl font-bold mb-4">作成したコース</h2>
                        {loading ? (
                            <p>Loading...</p>
                        ) : courses.length === 0 ? (
                            <EmptyCourse />
                        ) : (
                            <CourseList />
                        )}
                    </div>
                </div>

                {/* Create New Route Button */}
                <div className={`mt-auto ${paddingX} w-full pt-10`}>
                    <RoutingButton
                        buttonText="新しいルートを作る"
                        to="/draw"
                    />
                </div>
            </main>
        </div>
    );
}
