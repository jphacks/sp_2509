import { HiSun } from "react-icons/hi";
import {
  MdOutlineTurnLeft,
  MdOutlineTurnRight,
  MdOutlineUTurnRight,
} from "react-icons/md";
import { FaRunning } from "react-icons/fa";
import { TurnPoint } from "../app/navigation/page";
import { IconType } from "react-icons";

type EnergySaveModeProps = {
  total_distance_km: number;
  toggleEnergySaveMode: () => void;
  upcomingTurn: (TurnPoint & { distance: number | null }) | undefined;
};

const turnIcons: { [key in 'left' | 'right' | 'u-turn']: IconType } = {
  left: MdOutlineTurnLeft,
  right: MdOutlineTurnRight,
  'u-turn': MdOutlineUTurnRight,
};

export default function EnergySaveMode({
  total_distance_km,
  toggleEnergySaveMode,
  upcomingTurn,
}: EnergySaveModeProps) {
  const IconComponent = upcomingTurn?.turn && upcomingTurn.turn !== 'straight'
    ? turnIcons[upcomingTurn.turn]
    : FaRunning;

  const distance = upcomingTurn?.distance !== null && upcomingTurn?.distance !== undefined
    ? Math.round(upcomingTurn.distance / 10) * 10
    : '...';

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
        {upcomingTurn ? (
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <IconComponent size={64} />
              <div>
                <span className="text-white font-bold text-5xl">{distance}</span>
                <span className="text-white text-2xl ml-2">m</span>
              </div>
            </div>
            <p className="text-gray-300 text-lg">
              {
                upcomingTurn.turn === 'straight' ? 'まっすぐ進んでください' :
                  upcomingTurn.turn === 'left' ? '左へ曲がります' :
                    upcomingTurn.turn === 'right' ? '右へ曲がります' :
                      upcomingTurn.turn === 'u-turn' ? 'Uターンします' :
                        ''
              }
            </p>
          </div>
        ) : (
          <p className="text-gray-300 text-lg">次の案内ポイントを取得中...</p>
        )}
      </div>

      {/* 省電力表示 */}
      <div className="pb-4 text-center">
        <p className="text-gray-500 text-xs">🔋 省電力モードで実行中</p>
      </div>
    </div>
  );
}
