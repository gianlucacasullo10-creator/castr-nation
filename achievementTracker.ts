import { supabase } from "@/integrations/supabase/client";

// Achievement checker utility
// This checks various conditions and unlocks achievements automatically

export const checkAndUnlockAchievements = async (userId: string) => {
  if (!userId) return;

  try {
    // Fetch user's current stats
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Fetch all catches by user
    const { data: catches } = await supabase
      .from('catches')
      .select('*')
      .eq('user_id', userId);

    // Fetch user's likes received
    const { data: likesReceived } = await supabase
      .from('likes')
      .select('catch_id, catches!inner(user_id)')
      .eq('catches.user_id', userId);

    // Fetch all achievements
    const { data: allAchievements } = await supabase
      .from('achievements')
      .select('*');

    // Fetch already unlocked achievements
    const { data: unlockedAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId)
      .not('unlocked_at', 'is', null);

    const unlockedIds = new Set(unlockedAchievements?.map(a => a.achievement_id) || []);

    // Check each achievement
    for (const achievement of allAchievements || []) {
      // Skip if already unlocked
      if (unlockedIds.has(achievement.id)) continue;

      let shouldUnlock = false;
      let progress = 0;

      // Check conditions based on achievement criteria
      switch (achievement.criteria) {
        case 'catch_first_fish':
          shouldUnlock = (catches?.length || 0) >= 1;
          progress = Math.min(((catches?.length || 0) / 1) * 100, 100);
          break;

        case 'catch_10_fish':
          shouldUnlock = (catches?.length || 0) >= 10;
          progress = Math.min(((catches?.length || 0) / 10) * 100, 100);
          break;

        case 'catch_5_pike':
          const pikeCount = catches?.filter(c => c.species?.toLowerCase().includes('pike')).length || 0;
          shouldUnlock = pikeCount >= 5;
          progress = Math.min((pikeCount / 5) * 100, 100);
          break;

        case 'receive_10_likes':
          shouldUnlock = (likesReceived?.length || 0) >= 10;
          progress = Math.min(((likesReceived?.length || 0) / 10) * 100, 100);
          break;

        default:
          // Unknown criteria - skip
          continue;
      }

      if (shouldUnlock) {
        // Unlock the achievement
        await unlockAchievement(userId, achievement);
      } else if (progress > 0) {
        // Update progress
        await updateAchievementProgress(userId, achievement.id, Math.round(progress));
      }
    }
  } catch (error) {
    console.error('Error checking achievements:', error);
  }
};

const unlockAchievement = async (userId: string, achievement: any) => {
  try {
    // Check if entry exists
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .eq('achievement_id', achievement.id)
      .single();

    if (existing) {
      // Update existing entry
      await supabase
        .from('user_achievements')
        .update({ 
          unlocked_at: new Date().toISOString(),
          progress: 100
        })
        .eq('user_id', userId)
        .eq('achievement_id', achievement.id);
    } else {
      // Create new entry
      await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievement.id,
          unlocked_at: new Date().toISOString(),
          progress: 100
        });
    }

    // Award points to user
    if (achievement.reward_points > 0) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_points, total_points_earned')
        .eq('id', userId)
        .single();

      await supabase
        .from('profiles')
        .update({
          current_points: (profile?.current_points || 0) + achievement.reward_points,
          total_points_earned: (profile?.total_points_earned || 0) + achievement.reward_points
        })
        .eq('id', userId);
    }

    // Create activity feed post
    await supabase
      .from('activities')
      .insert({
        user_id: userId,
        content: achievement.name,
        activity_type: 'achievement'
      });

    console.log(`Achievement unlocked: ${achievement.name}`);
  } catch (error) {
    console.error('Error unlocking achievement:', error);
  }
};

const updateAchievementProgress = async (userId: string, achievementId: string, progress: number) => {
  try {
    // Check if entry exists
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .single();

    if (existing) {
      // Update progress
      await supabase
        .from('user_achievements')
        .update({ progress })
        .eq('user_id', userId)
        .eq('achievement_id', achievementId);
    } else {
      // Create entry with progress
      await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievementId,
          progress,
          unlocked_at: null
        });
    }
  } catch (error) {
    console.error('Error updating achievement progress:', error);
  }
};

// Helper to check achievements after specific actions
export const checkAchievementsAfterCatch = async (userId: string) => {
  await checkAndUnlockAchievements(userId);
};

export const checkAchievementsAfterLike = async (userId: string) => {
  await checkAndUnlockAchievements(userId);
};
