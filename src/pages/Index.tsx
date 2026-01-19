import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { FishPost } from "@/components/FishPost";
import { ClubNotification } from "@/components/ClubNotification";
import fishBass from "@/assets/fish-bass.jpg";
import fishPike from "@/assets/fish-pike.jpg";
import fishWalleye from "@/assets/fish-walleye.jpg";
import fishTrout from "@/assets/fish-trout.jpg";

// Mock data for posts
const initialPosts = [
  {
    id: "1",
    user: {
      name: "Jake Wilson",
      username: "jaketheangler",
      title: "Bass Master",
    },
    fish: {
      species: "Largemouth Bass",
      weight: "4.2 lbs",
      length: "18 inches",
      points: 145,
      imageUrl: fishBass,
    },
    likes: 47,
    comments: 12,
    isLiked: false,
    timeAgo: "2h ago",
  },
  {
    id: "2",
    user: {
      name: "Sarah Chen",
      username: "sarahfishes",
      title: "Pike Hunter",
    },
    fish: {
      species: "Northern Pike",
      weight: "8.7 lbs",
      length: "32 inches",
      points: 210,
      imageUrl: fishPike,
    },
    likes: 89,
    comments: 23,
    isLiked: true,
    timeAgo: "4h ago",
  },
  {
    id: "3",
    user: {
      name: "Mike Thompson",
      username: "mikewalleye",
      title: "Freshwater Elite",
    },
    fish: {
      species: "Walleye",
      weight: "5.1 lbs",
      length: "22 inches",
      points: 178,
      imageUrl: fishWalleye,
    },
    likes: 62,
    comments: 8,
    isLiked: false,
    timeAgo: "6h ago",
  },
  {
    id: "4",
    user: {
      name: "Emma Rivers",
      username: "emmarivers",
      title: "Trout Whisperer",
    },
    fish: {
      species: "Rainbow Trout",
      weight: "3.8 lbs",
      length: "20 inches",
      points: 132,
      imageUrl: fishTrout,
    },
    likes: 35,
    comments: 5,
    isLiked: false,
    timeAgo: "8h ago",
  },
];

const clubNotifications = [
  {
    clubName: "Pike Supremacy",
    user: { name: "Alex K." },
    action: "catch" as const,
    details: "Caught a 6.2lb Pike! +180 pts",
    timeAgo: "1h ago",
  },
  {
    clubName: "Bass Bandits",
    user: { name: "Jordan M." },
    action: "rank" as const,
    details: "Club reached #2 in Newmarket!",
    timeAgo: "3h ago",
  },
];

const Index = () => {
  const [posts, setPosts] = useState(initialPosts);

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
        };
      }
      return post;
    }));
  };

  return (
    <div className="app-container bg-background">
      <AppHeader showLogo showNotifications notificationCount={3} />
      
      <main className="flex-1 safe-bottom">
        <div className="px-4 py-4 space-y-4">
          {/* Club Notification */}
          <ClubNotification {...clubNotifications[0]} />
          
          {/* Posts */}
          <FishPost
            {...posts[0]}
            onLike={() => handleLike(posts[0].id)}
          />
          
          <FishPost
            {...posts[1]}
            onLike={() => handleLike(posts[1].id)}
          />
          
          {/* Another Club Notification */}
          <ClubNotification {...clubNotifications[1]} />
          
          <FishPost
            {...posts[2]}
            onLike={() => handleLike(posts[2].id)}
          />
          
          <FishPost
            {...posts[3]}
            onLike={() => handleLike(posts[3].id)}
          />
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default Index;
