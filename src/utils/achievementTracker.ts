import { supabase } from "@/integrations/supabase/client";

// Achievement checker utility
// This checks various conditions and unlocks achievements automatically

export const checkAndUnlockAchievements = async (userId: string) => {
  if (!userId) {
    console.log('❌ No userId provided');
    return [];
  }

  console.log('🔍 Starting achievement check for user:', userId);

  const unlockedAchievements: any[] = [];

  try {
    console.log('🔍 Starting achievement check for user:', userId);

    // Verify user exists - use minimal query
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, current_points, total_points_earned')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('❌ Profile fetch error:', profileError);
      console.error('   This might be due to RLS policies. Continuing anyway...');
    }

    console.log('👤 User profile:', profile?.id || 'not found (continuing anyway)');

    // Fetch all catches by user
    const { data: catches, error: catchesError } = await supabase
      .from('catches')
      .select('*')
      .eq('user_id', userId);

    if (catchesError) console.error('Catches fetch error:', catchesError);
    console.log('🎣 Total catches:', catches?.length || 0);

    // Fetch user's likes received
    const { data: likesReceived, error: likesError } = await supabase
      .from('likes')
      .select('catch_id, catches!inner(user_id)')
      .eq('catches.user_id', userId);

    if (likesError) console.error('Likes fetch error:', likesError);
    console.log('❤️ Total likes received:', likesReceived?.length || 0);

    // Fetch all achievements
    const { data: allAchievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('id, name, criteria, category, rarity, reward_points, icon, description');

    if (achievementsError) {
      console.error('❌ Achievements fetch error:', achievementsError);
      return;
    }
    
    console.log('🏆 Total achievements in DB:', allAchievements?.length || 0);
    console.log('🏆 Achievements data:', allAchievements);

    // Fetch already unlocked achievements
    const { data: unlockedAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId)
      .not('unlocked_at', 'is', null);

    const unlockedIds = new Set(unlockedAchievements?.map(a => a.achievement_id) || []);
    console.log('✅ Already unlocked:', unlockedIds.size);

    // Check each achievement
    for (const achievement of allAchievements || []) {
      console.log(`\n📋 Checking: "${achievement.name}" (criteria: ${achievement.criteria})`);
      
      // Skip if already unlocked
      if (unlockedIds.has(achievement.id)) {
        console.log('  ⏭️ Already unlocked, skipping');
        continue;
      }

      let shouldUnlock = false;
      let progress = 0;

      // Check conditions based on achievement criteria
      switch (achievement.criteria) {
        case 'catch_first_fish':
          shouldUnlock = (catches?.length || 0) >= 1;
          progress = Math.min(((catches?.length || 0) / 1) * 100, 100);
          console.log(`  📊 Progress: ${catches?.length || 0}/1 catches (${progress}%)`);
          break;

        case 'catch_10_fish':
          shouldUnlock = (catches?.length || 0) >= 10;
          progress = Math.min(((catches?.length || 0) / 10) * 100, 100);
          console.log(`  📊 Progress: ${catches?.length || 0}/10 catches (${progress}%)`);
          break;

        case 'catch_50_fish':
          shouldUnlock = (catches?.length || 0) >= 50;
          progress = Math.min(((catches?.length || 0) / 50) * 100, 100);
          console.log(`  📊 Progress: ${catches?.length || 0}/50 catches (${progress}%)`);
          break;

        case 'catch_100_fish':
          shouldUnlock = (catches?.length || 0) >= 100;
          progress = Math.min(((catches?.length || 0) / 100) * 100, 100);
          console.log(`  📊 Progress: ${catches?.length || 0}/100 catches (${progress}%)`);
          break;

        case 'catch_500_fish':
          shouldUnlock = (catches?.length || 0) >= 500;
          progress = Math.min(((catches?.length || 0) / 500) * 100, 100);
          console.log(`  📊 Progress: ${catches?.length || 0}/500 catches (${progress}%)`);
          break;

        case 'catch_5_pike':
          const pikeCount = catches?.filter(c => c.species?.toLowerCase().includes('pike')).length || 0;
          shouldUnlock = pikeCount >= 5;
          progress = Math.min((pikeCount / 5) * 100, 100);
          console.log(`  📊 Progress: ${pikeCount}/5 pike (${progress}%)`);
          break;

        case 'catch_5_bass':
          const bassCount = catches?.filter(c => c.species?.toLowerCase().includes('bass')).length || 0;
          shouldUnlock = bassCount >= 5;
          progress = Math.min((bassCount / 5) * 100, 100);
          console.log(`  📊 Progress: ${bassCount}/5 bass (${progress}%)`);
          break;

        case 'catch_5_musky':
          const muskyCount = catches?.filter(c => 
            c.species?.toLowerCase().includes('musky') || 
            c.species?.toLowerCase().includes('muskellunge')
          ).length || 0;
          shouldUnlock = muskyCount >= 5;
          progress = Math.min((muskyCount / 5) * 100, 100);
          console.log(`  📊 Progress: ${muskyCount}/5 musky (${progress}%)`);
          break;

        case 'catch_500_points':
          const catch500 = catches?.filter(c => c.points >= 500).length || 0;
          shouldUnlock = catch500 >= 1;
          progress = Math.min((catch500 / 1) * 100, 100);
          console.log(`  📊 Progress: ${catch500}/1 fish worth 500+ pts (${progress}%)`);
          break;

        case 'catch_1000_points':
          const catch1000 = catches?.filter(c => c.points >= 1000).length || 0;
          shouldUnlock = catch1000 >= 1;
          progress = Math.min((catch1000 / 1) * 100, 100);
          console.log(`  📊 Progress: ${catch1000}/1 fish worth 1000+ pts (${progress}%)`);
          break;

        case 'catch_3_locations':
          const locations3 = new Set(catches?.map(c => c.location_name).filter(Boolean));
          shouldUnlock = locations3.size >= 3;
          progress = Math.min((locations3.size / 3) * 100, 100);
          console.log(`  📊 Progress: ${locations3.size}/3 locations (${progress}%)`);
          break;

        case 'catch_10_locations':
          const locations10 = new Set(catches?.map(c => c.location_name).filter(Boolean));
          shouldUnlock = locations10.size >= 10;
          progress = Math.min((locations10.size / 10) * 100, 100);
          console.log(`  📊 Progress: ${locations10.size}/10 locations (${progress}%)`);
          break;

        case 'post_25_comments':
          const { data: userComments } = await supabase
            .from('comments')
            .select('id')
            .eq('user_id', userId);
          const commentCount = userComments?.length || 0;
          shouldUnlock = commentCount >= 25;
          progress = Math.min((commentCount / 25) * 100, 100);
          console.log(`  📊 Progress: ${commentCount}/25 comments (${progress}%)`);
          break;

        case 'join_club':
          const { data: clubMembership } = await supabase
            .from('club_members')
            .select('id')
            .eq('user_id', userId)
            .limit(1);
          shouldUnlock = (clubMembership?.length || 0) >= 1;
          progress = shouldUnlock ? 100 : 0;
          console.log(`  📊 Progress: ${shouldUnlock ? 'Joined' : 'Not joined'} (${progress}%)`);
          break;

        case 'receive_10_likes':
          shouldUnlock = (likesReceived?.length || 0) >= 10;
          progress = Math.min(((likesReceived?.length || 0) / 10) * 100, 100);
          console.log(`  📊 Progress: ${likesReceived?.length || 0}/10 likes (${progress}%)`);
          break;

        case 'receive_50_likes':
          shouldUnlock = (likesReceived?.length || 0) >= 50;
          progress = Math.min(((likesReceived?.length || 0) / 50) * 100, 100);
          console.log(`  📊 Progress: ${likesReceived?.length || 0}/50 likes (${progress}%)`);
          break;

        case 'receive_100_likes':
          shouldUnlock = (likesReceived?.length || 0) >= 100;
          progress = Math.min(((likesReceived?.length || 0) / 100) * 100, 100);
          console.log(`  📊 Progress: ${likesReceived?.length || 0}/100 likes (${progress}%)`);
          break;

        case 'catch_before_6am':
          const earlyBirdCatch = catches?.some(c => {
            const hour = new Date(c.created_at).getHours();
            return hour < 6;
          });
          shouldUnlock = earlyBirdCatch || false;
          progress = shouldUnlock ? 100 : 0;
          console.log(`  📊 Progress: ${shouldUnlock ? 'Caught before 6am' : 'No early catches'} (${progress}%)`);
          break;

        case 'catch_after_10pm':
          const nightOwlCatch = catches?.some(c => {
            const hour = new Date(c.created_at).getHours();
            return hour >= 22;
          });
          shouldUnlock = nightOwlCatch || false;
          progress = shouldUnlock ? 100 : 0;
          console.log(`  📊 Progress: ${shouldUnlock ? 'Caught after 10pm' : 'No late catches'} (${progress}%)`);
          break;

        case 'first_case_legendary':
          // Check if user's first inventory item was legendary
          const { data: firstItem } = await supabase
            .from('inventory')
            .select('rarity')
            .eq('user_id', userId)
            .order('created_at', { ascending: true })
            .limit(1);
          shouldUnlock = firstItem?.[0]?.rarity === 'legendary';
          progress = shouldUnlock ? 100 : 0;
          console.log(`  📊 Progress: ${shouldUnlock ? 'First case was legendary!' : 'First case was not legendary'} (${progress}%)`);
          break;

        case 'catch_7_day_streak':
          // Check if user has catches on 7 consecutive days
          if (catches && catches.length >= 7) {
            const catchDates = catches
              .map(c => new Date(c.created_at).toDateString())
              .filter((date, index, self) => self.indexOf(date) === index)
              .sort();
            
            let maxStreak = 1;
            let currentStreak = 1;
            
            for (let i = 1; i < catchDates.length; i++) {
              const prev = new Date(catchDates[i - 1]);
              const curr = new Date(catchDates[i]);
              const diffDays = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
              
              if (diffDays === 1) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
              } else {
                currentStreak = 1;
              }
            }
            
            shouldUnlock = maxStreak >= 7;
            progress = Math.min((maxStreak / 7) * 100, 100);
            console.log(`  📊 Progress: ${maxStreak}/7 day streak (${progress}%)`);
          } else {
            shouldUnlock = false;
            progress = catches ? Math.min((catches.length / 7) * 100, 100) : 0;
            console.log(`  📊 Progress: Need more catches for streak calculation (${progress}%)`);
          }
          break;

        case 'open_first_case':
          const { data: inventoryItems } = await supabase
            .from('inventory')
            .select('id')
            .eq('user_id', userId);
          const casesOpened = inventoryItems?.length || 0;
          shouldUnlock = casesOpened >= 1;
          progress = Math.min((casesOpened / 1) * 100, 100);
          console.log(`  📊 Progress: ${casesOpened}/1 cases (${progress}%)`);
          break;

        case 'open_10_cases':
          const { data: inventoryItems10 } = await supabase
            .from('inventory')
            .select('id')
            .eq('user_id', userId);
          const casesOpened10 = inventoryItems10?.length || 0;
          shouldUnlock = casesOpened10 >= 10;
          progress = Math.min((casesOpened10 / 10) * 100, 100);
          console.log(`  📊 Progress: ${casesOpened10}/10 cases (${progress}%)`);
          break;

        case 'equip_first_item':
          const { data: equippedItems } = await supabase
            .from('inventory')
            .select('id')
            .eq('user_id', userId)
            .eq('is_equipped', true);
          const equippedCount = equippedItems?.length || 0;
          shouldUnlock = equippedCount >= 1;
          progress = Math.min((equippedCount / 1) * 100, 100);
          console.log(`  📊 Progress: ${equippedCount}/1 equipped (${progress}%)`);
          break;

        case 'open_5_cases':
          const { data: inventoryItems5 } = await supabase
            .from('inventory')
            .select('id')
            .eq('user_id', userId);
          const casesOpened5 = inventoryItems5?.length || 0;
          shouldUnlock = casesOpened5 >= 5;
          progress = Math.min((casesOpened5 / 5) * 100, 100);
          console.log(`  📊 Progress: ${casesOpened5}/5 cases (${progress}%)`);
          break;

        case 'own_10_gear':
          const { data: allGear } = await supabase
            .from('inventory')
            .select('id')
            .eq('user_id', userId);
          const gearCount = allGear?.length || 0;
          shouldUnlock = gearCount >= 10;
          progress = Math.min((gearCount / 10) * 100, 100);
          console.log(`  📊 Progress: ${gearCount}/10 gear (${progress}%)`);
          break;

        case 'get_rare_item':
          const { data: rareItems } = await supabase
            .from('inventory')
            .select('id')
            .eq('user_id', userId)
            .eq('rarity', 'rare');
          const rareCount = rareItems?.length || 0;
          shouldUnlock = rareCount >= 1;
          progress = Math.min((rareCount / 1) * 100, 100);
          console.log(`  📊 Progress: ${rareCount}/1 rare (${progress}%)`);
          break;

        case 'get_epic_item':
          const { data: epicItems } = await supabase
            .from('inventory')
            .select('id')
            .eq('user_id', userId)
            .eq('rarity', 'epic');
          const epicCount = epicItems?.length || 0;
          shouldUnlock = epicCount >= 1;
          progress = Math.min((epicCount / 1) * 100, 100);
          console.log(`  📊 Progress: ${epicCount}/1 epic (${progress}%)`);
          break;

        case 'get_legendary_item':
          const { data: legendaryItems } = await supabase
            .from('inventory')
            .select('id')
            .eq('user_id', userId)
            .eq('rarity', 'legendary');
          const legendaryCount = legendaryItems?.length || 0;
          shouldUnlock = legendaryCount >= 1;
          progress = Math.min((legendaryCount / 1) * 100, 100);
          console.log(`  📊 Progress: ${legendaryCount}/1 legendary (${progress}%)`);
          break;

        default:
          // Unknown criteria - skip
          console.log(`  ⚠️ Unknown criteria: "${achievement.criteria}" - skipping`);
          continue;
      }

      if (shouldUnlock) {
        console.log(`  🎉 UNLOCKING: ${achievement.name}`);
        const unlockedAchievement = await unlockAchievement(userId, achievement);
        if (unlockedAchievement) {
          unlockedAchievements.push(unlockedAchievement);
        }
      } else if (progress > 0) {
        console.log(`  📈 Updating progress to ${Math.round(progress)}%`);
        await updateAchievementProgress(userId, achievement.id, Math.round(progress));
      } else {
        console.log(`  ⏸️ No progress yet`);
      }
    }
    
    console.log('\n✅ Achievement check complete!');
    return unlockedAchievements;
  } catch (error) {
    console.error('❌ Error checking achievements:', error);
    return [];
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

    // Award points to user (if we can access the profile)
    if (achievement.reward_points > 0) {
      try {
        const { data: currentProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('current_points, total_points_earned')
          .eq('id', userId)
          .single();

        if (fetchError) {
          console.log(`  ⚠️ Cannot fetch profile for points (RLS?): ${fetchError.message}`);
        } else if (currentProfile) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              current_points: (currentProfile.current_points || 0) + achievement.reward_points,
              total_points_earned: (currentProfile.total_points_earned || 0) + achievement.reward_points
            })
            .eq('id', userId);

          if (updateError) {
            console.log(`  ⚠️ Cannot update profile points (RLS?): ${updateError.message}`);
          } else {
            console.log(`  💰 Awarded ${achievement.reward_points} points`);
          }
        }
      } catch (err) {
        console.log(`  ⚠️ Error awarding points:`, err);
      }
    }

    // Create activity feed post
    console.log(`  📝 Creating activity post for achievement: ${achievement.name}`);
    const { data: activityData, error: activityError } = await supabase
      .from('activities')
      .insert({
        user_id: userId,
        content: achievement.name,
        activity_type: 'achievement'
      })
      .select();

    if (activityError) {
      console.error('  ❌ Failed to create activity post:', activityError);
      console.error('  Error details:', JSON.stringify(activityError, null, 2));
    } else {
      console.log('  ✅ Activity post created successfully:', activityData);
    }

    console.log(`✅ Achievement unlocked: ${achievement.name}`);
    return achievement;
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    return null;
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

export const checkAchievementsAfterCaseOpen = async (userId: string) => {
  await checkAndUnlockAchievements(userId);
};

export const checkAchievementsAfterEquip = async (userId: string) => {
  await checkAndUnlockAchievements(userId);
};
