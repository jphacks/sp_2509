import Image from 'next/image';
import Text from './Text';


const mapIcon = '/images/map_icon.png';
const EmptyCourse = () => {
  return (
    <div className="text-center flex flex-col items-center gap-y-4">
      <div>
        <Image src={mapIcon} alt="Map Icon" width={96} height={96} />
      </div>
      <Text text="まだコースがありません。" />
      <Text text="絵を描いて最初のコースを作りましょう" />
    </div>
  );
};

export default EmptyCourse;
