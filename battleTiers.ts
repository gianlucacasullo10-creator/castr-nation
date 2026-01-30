export type BattleTier = {
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  minWins: number;
};

export const BATTLE_TIERS: BattleTier[] = [
  { name: "Rookie", color: "text-gray-400", bgColor: "bg-gray-500/10", borderColor: "border-gray-500/20", icon: "🔰", minWins: 0 },
  { name: "Bronze", color: "text-orange-600", bgColor: "bg-orange-500/10", borderColor: "border-orange-500/20", icon: "🥉", minWins: 1 },
  { name: "Silver", color: "text-gray-300", bgColor: "bg-gray-400/10", borderColor: "border-gray-400/20", icon: "🥈", minWins: 5 },
  { name: "Gold", color: "text-yellow-500", bgColor: "bg-yellow-500/10", borderColor: "border-yellow-500/20", icon: "🥇", minWins: 10 },
  { name: "Platinum", color: "text-cyan-400", bgColor: "bg-cyan-400/10", borderColor: "border-cyan-400/20", icon: "💎", minWins: 20 },
  { name: "Diamond", color: "text-blue-400", bgColor: "bg-blue-400/10", borderColor: "border-blue-400/20", icon: "💠", minWins: 35 },
  { name: "Master", color: "text-purple-500", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/20", icon: "👑", minWins: 50 },
  { name: "Legend", color: "text-red-500", bgColor: "bg-gradient-to-r from-red-500/10 to-orange-500/10", borderColor: "border-red-500/30", icon: "⚡", minWins: 100 },
];

export function getBattleTier(wins: number): BattleTier {
  for (let i = BATTLE_TIERS.length - 1; i >= 0; i--) {
    if (wins >= BATTLE_TIERS[i].minWins) {
      return BATTLE_TIERS[i];
    }
  }
  return BATTLE_TIERS[0];
}
