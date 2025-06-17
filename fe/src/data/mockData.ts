// src/data/mockData.ts
export const chatList = [
    { id: 1, name: 'Mai Linh', avatar: '/api/placeholder/32/32', message: 'Bạn có đang online không?', time: '12:30', unread: 3, online: true },
    { id: 2, name: 'Tuấn Anh', avatar: '/api/placeholder/32/32', message: 'Hẹn gặp lại nhé!', time: '11:45', unread: 0, online: true },
    { id: 3, name: 'Hương Giang', avatar: '/api/placeholder/32/32', message: 'Cảm ơn bạn đã gửi quà', time: '09:20', unread: 1, online: false },
    { id: 4, name: 'Minh Quân', avatar: '/api/placeholder/32/32', message: 'Chơi game không?', time: '08:15', unread: 0, online: true },
    { id: 5, name: 'Kim Ngân', avatar: '/api/placeholder/32/32', message: 'Mình sẽ livestream lúc 8h tối', time: 'Hôm qua', unread: 0, online: false },
  ];
  
  export const rooms = [
    { id: 1, name: 'Game Party', members: 1234, active: true, image: '/api/placeholder/50/50' },
    { id: 2, name: 'Voice Chat', members: 567, active: true, image: '/api/placeholder/50/50' },
    { id: 3, name: 'Show Time', members: 890, active: false, image: '/api/placeholder/50/50' },
    { id: 4, name: 'Chill Music', members: 432, active: true, image: '/api/placeholder/50/50' },
  ];
  
  export const messages = [
    { id: 1, sender: 'Tuấn Anh', text: 'Chào bạn, hôm nay bạn có rảnh không?', time: '11:30', isMine: false },
    { id: 2, sender: 'You', text: 'Chào, mình rảnh đấy. Bạn muốn làm gì?', time: '11:32', isMine: true },
    { id: 3, sender: 'Tuấn Anh', text: 'Mình đang tổ chức một buổi livestream nhỏ, bạn có muốn tham gia không?', time: '11:35', isMine: false },
    { id: 4, sender: 'You', text: 'Có chứ, mình thích lắm. Mấy giờ vậy?', time: '11:40', isMine: true },
    { id: 5, sender: 'Tuấn Anh', text: 'Khoảng 7h tối nay. Mình sẽ gửi link sau.', time: '11:42', isMine: false },
  ];
  
  export const reels = [
    { id: 1, user: 'Linh', avatar: '/api/placeholder/32/32', viewed: false },
    { id: 2, user: 'Hùng', avatar: '/api/placeholder/32/32', viewed: false },
    { id: 3, user: 'Trang', avatar: '/api/placeholder/32/32', viewed: true },
    { id: 4, user: 'Duy', avatar: '/api/placeholder/32/32', viewed: false },
    { id: 5, user: 'Hà', avatar: '/api/placeholder/32/32', viewed: true },
    { id: 6, user: 'Nam', avatar: '/api/placeholder/32/32', viewed: false },
  ];
  
  export const games = [
    { id: 1, name: 'Lucky Wheel', icon: 'LW', players: 243, color: 'from-yellow-400 to-yellow-600' },
    { id: 2, name: 'Long Hổ', icon: 'LH', players: 156, color: 'from-blue-400 to-blue-600' },
    { id: 3, name: 'Treasure Hunt', icon: 'TH', players: 89, color: 'from-green-400 to-green-600' },
    { id: 4, name: 'Card Game', icon: 'CG', players: 75, color: 'from-red-400 to-red-600' },
  ];
  
  export const giftCategories = [
    { id: 1, name: 'Popular', emoji: '🔥' },
    { id: 2, name: 'Events', emoji: '🎉' },
    { id: 3, name: 'Luxury', emoji: '💎' },
    { id: 4, name: 'Lucky', emoji: '🍀' },
  ];
  
  export const gifts = [
    { id: 1, name: 'Gift Box', emoji: '🎁', price: 50, category: 'Popular' },
    { id: 2, name: 'Hearts', emoji: '💖', price: 100, category: 'Popular' },
    { id: 3, name: 'Star', emoji: '🌟', price: 200, category: 'Luxury' },
    { id: 4, name: 'Magic', emoji: '🔮', price: 300, category: 'Lucky' },
    { id: 5, name: 'Music', emoji: '🎵', price: 150, category: 'Events' },
    { id: 6, name: 'Diamond', emoji: '💎', price: 500, category: 'Luxury' },
  ];
  
  export const liveEvents = [
    { id: 1, title: 'Gaming Stream', host: 'Minh Quân', viewers: 243, thumbnail: '/api/placeholder/120/80' },
    { id: 2, title: 'Music Session', host: 'Hương Giang', viewers: 128, thumbnail: '/api/placeholder/120/80' },
  ];