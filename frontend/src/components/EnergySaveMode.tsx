import { HiSun } from "react-icons/hi";
import { MdOutlineTurnRight } from "react-icons/md";

type EnergySaveModeProps = {
  total_distance_km: number;
  toggleEnergySaveMode: () => void;
};

export default function EnergySaveMode({ total_distance_km, toggleEnergySaveMode }: EnergySaveModeProps) {
  return (
    <div className="w-full h-screen bg-black flex flex-col text-white">
      {/* 上部UI */}
      <div className="flex justify-between items-center p-6">
        <div className="text-center">
          <p className="text-white text-lg font-bold">省エネモード</p>
          <p className="text-gray-400 text-sm">残り {total_distance_km.toFixed(1)}km</p>
        </div>

        <button
          onClick={toggleEnergySaveMode}
          className="flex items-center justify-center w-12 h-12"
        >
          <HiSun size={20} className="text-white" />
        </button>
      </div>

      {/* 中央のナビゲーション情報 */}
      <div className="flex-1 flex flex-col justify-center items-center px-8">
        {/* 次の案内情報 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <MdOutlineTurnRight size={64} />
            <div>
              <span className="text-white font-bold text-5xl">100</span>
              <span className="text-white text-2xl ml-2">m</span>
            </div>
          </div>
          <p className="text-gray-300 text-lg">まっすぐ進んでください</p>
        </div>
      </div>

      {/* 省電力表示 */}
      <div className="pb-4 text-center">
        <p className="text-gray-500 text-xs">🔋 省電力モードで実行中</p>
      </div>
    </div>
  );
}
