import Image from 'next/image';
import mapIcon from '../img/map_icon.png';

const EmptyCourse = () => {
    return (
        <div className="text-center flex flex-col items-center gap-y-4">
            <div>
                <Image src={mapIcon} alt="Map Icon" width={96} height={96} />
            </div>
            <div>
                <p className="text-gray-500">まだルートがありません</p>
                <p className="text-gray-500">絵を描いて最初のルートを作りましょう</p>
            </div>
        </div>
    );
};

export default EmptyCourse;
