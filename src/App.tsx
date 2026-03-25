/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  Search, 
  ChevronRight, 
  Bolt, 
  Brain, 
  Layers, 
  Terminal, 
  Gavel, 
  Eye, 
  Sparkles, 
  ArrowLeft, 
  Bookmark, 
  Share2, 
  History, 
  ChevronsUpDown, 
  Languages, 
  Bell, 
  Shield, 
  LogOut,
  Compass,
  Library,
  User,
  Cpu,
  Bot,
  CheckCircle2,
  Network,
  Settings2,
  ArrowUpRight,
  Lightbulb,
  Smartphone,
  X,
  Clock,
  Info,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from './services/api';
import { notificationService, type Notification } from './services/notification';

type Screen = 'discover' | 'explore' | 'article' | 'profile' | 'upload' | 'login' | 'register' | 'admin-login' | 'admin' | 'notification';

export default function App() {
  const [activeTab, setActiveTab] = useState<Screen>('discover');
  const [prevTab, setPrevTab] = useState<Screen>('discover');
  const [articleId, setArticleId] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [bookmarkMessage, setBookmarkMessage] = useState<string | null>(null);
  const [showSideMenu, setShowSideMenu] = useState(false);

  // 默认深色模式
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    if (activeTab === 'article' && articleId) {
      checkBookmarkStatus();
    } else {
      setIsBookmarked(false);
    }
  }, [activeTab, articleId]);

  const checkBookmarkStatus = async () => {
    if (!articleId) return;
    
    try {
      const response = await api.getBookmarks();
      const isBookmark = response.bookmarks.some((bookmark: any) => bookmark.article_id === articleId);
      setIsBookmarked(isBookmark);
    } catch (err) {
      console.error('Error checking bookmark status:', err);
    }
  };

  const handleBookmark = async () => {
    if (!articleId) return;
    
    setIsBookmarking(true);
    setBookmarkMessage(null);
    
    try {
      if (isBookmarked) {
        // 取消收藏
        const response = await api.getBookmarks();
        const bookmark = response.bookmarks.find((b: any) => b.article_id === articleId);
        if (bookmark) {
          await api.removeBookmark(bookmark.id);
          setIsBookmarked(false);
          setBookmarkMessage('已取消收藏');
        }
      } else {
        // 添加收藏
        await api.addBookmark(articleId);
        setIsBookmarked(true);
        setBookmarkMessage('已添加到收藏');
      }
    } catch (err) {
      setBookmarkMessage('操作失败，请稍后重试');
      console.error('Error toggling bookmark:', err);
    } finally {
      setIsBookmarking(false);
      
      // 3秒后清除消息
      setTimeout(() => {
        setBookmarkMessage(null);
      }, 3000);
    }
  };

  const navigateTo = (screen: Screen, id: string | null = null) => {
    setPrevTab(activeTab);
    setActiveTab(screen);
    setArticleId(id);
    window.scrollTo(0, 0);
  };

  const [isAdmin, setIsAdmin] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // 检查是否有管理员token
    const token = localStorage.getItem('token');
    if (token) {
      // 这里可以添加token验证逻辑
      setIsAdmin(true);
    }
  }, []);

  useEffect(() => {
    // 加载通知数据
    const loadNotifications = () => {
      setNotifications(notificationService.getAllNotifications());
      setUnreadCount(notificationService.getUnreadCount());
    };

    loadNotifications();

    // 监听通知变化
    const interval = setInterval(loadNotifications, 5000); // 每5秒检查一次
    return () => clearInterval(interval);
  }, []);

  const updateNotifications = () => {
    setNotifications(notificationService.getAllNotifications());
    setUnreadCount(notificationService.getUnreadCount());
  };

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <TopAppBar 
        activeTab={activeTab} 
        navigateTo={navigateTo} 
        isBookmarked={isBookmarked}
        isBookmarking={isBookmarking}
        bookmarkMessage={bookmarkMessage}
        handleBookmark={handleBookmark}
        isAdmin={isAdmin}
        showSideMenu={showSideMenu}
        setShowSideMenu={setShowSideMenu}
      />
      
      <main className="pt-20 px-6 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'discover' && (
            <motion.div
              key="discover"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <DiscoverScreen navigateTo={navigateTo} />
            </motion.div>
          )}
          
          {activeTab === 'explore' && (
            <motion.div
              key="explore"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ExploreScreen navigateTo={navigateTo} />
            </motion.div>
          )}
          
          {activeTab === 'article' && (
            <motion.div
              key="article"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ArticleScreen navigateTo={navigateTo} articleId={articleId} />
            </motion.div>
          )}
          
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ProfileScreen navigateTo={navigateTo} />
            </motion.div>
          )}
          
          {activeTab === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <UploadScreen navigateTo={navigateTo} updateNotifications={updateNotifications} />
            </motion.div>
          )}
          
          {activeTab === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <LoginScreen navigateTo={navigateTo} />
            </motion.div>
          )}
          
          {activeTab === 'register' && (
            <motion.div
              key="register"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <RegisterScreen navigateTo={navigateTo} updateNotifications={updateNotifications} />
            </motion.div>
          )}
          
          {activeTab === 'admin-login' && (
            <motion.div
              key="admin-login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AdminLoginScreen navigateTo={navigateTo} setIsAdmin={setIsAdmin} />
            </motion.div>
          )}
          
          {activeTab === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AdminScreen navigateTo={navigateTo} setIsAdmin={setIsAdmin} />
            </motion.div>
          )}
          
          {activeTab === 'notification' && (
            <motion.div
              key="notification"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <NotificationScreen navigateTo={navigateTo} updateNotifications={updateNotifications} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNavBar activeTab={activeTab} navigateTo={navigateTo} unreadCount={unreadCount} />
    </div>
  );
}

function TopAppBar({ 
  activeTab, 
  navigateTo, 
  isBookmarked, 
  isBookmarking, 
  bookmarkMessage, 
  handleBookmark,
  isAdmin,
  showSideMenu,
  setShowSideMenu
}: { 
  activeTab: Screen, 
  navigateTo: (s: Screen, id?: string | null) => void,
  isBookmarked: boolean,
  isBookmarking: boolean,
  bookmarkMessage: string | null,
  handleBookmark: () => void,
  isAdmin: boolean,
  showSideMenu: boolean,
  setShowSideMenu: (show: boolean) => void
}) {
  return (
    <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl flex justify-between items-center px-6 py-4 border-b border-outline-variant/10">
      <div className="flex items-center gap-6">
        {activeTab === 'article' ? (
          <button 
            onClick={() => navigateTo('discover')}
            className="p-2 rounded-full hover:bg-surface-container transition-colors active:scale-95"
            title="返回发现页面"
          >
            <ArrowLeft className="w-6 h-6 text-primary" />
          </button>
        ) : (
          <button onClick={() => setShowSideMenu(!showSideMenu)} className="p-2 rounded-full hover:bg-surface-container transition-colors active:scale-95" title="打开菜单">
            <Menu className="w-6 h-6 text-primary" />
          </button>
        )}
        <h1 
          onClick={() => navigateTo('discover')}
          className="font-headline font-black text-xl text-primary cursor-pointer hover:opacity-80 transition-opacity"
        >
          {activeTab === 'article' ? 'The Ledger 账本' : 'AI知识库'}
        </h1>
      </div>
      
      <div className="hidden md:flex flex-1 max-w-md mx-8 items-center">
        <div className="relative w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
          <label htmlFor="search" className="sr-only">搜索 AI 知识库</label>
          <input 
            id="search"
            className="w-full bg-surface-container-highest border-none rounded-xl py-2 pl-12 pr-4 focus:ring-2 focus:ring-secondary transition-all outline-none text-on-surface" 
            placeholder="搜索 AI 知识库..." 
            type="text" 
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {activeTab === 'article' && (
          <button 
            onClick={handleBookmark}
            disabled={isBookmarking}
            className="p-2 rounded-full hover:bg-surface-container transition-colors active:scale-95 relative"
            title={isBookmarked ? "取消收藏" : "添加收藏"}
          >
            {isBookmarking ? (
              <div className="w-6 h-6 flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Bookmark 
                className={`w-6 h-6 transition-colors ${isBookmarked ? 'text-secondary fill-secondary' : 'text-primary'}`} 
              />
            )}
            {bookmarkMessage && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-xs rounded-full shadow-lg">
                {bookmarkMessage}
              </div>
            )}
          </button>
        )}
        {isAdmin ? (
          <button 
            onClick={() => navigateTo('admin')}
            className="p-2 rounded-full hover:bg-surface-container transition-colors active:scale-95"
            title="管理中心"
          >
            <Shield className="w-6 h-6 text-secondary" />
          </button>
        ) : (
          <button 
            onClick={() => navigateTo('admin-login')}
            className="p-2 rounded-full hover:bg-surface-container transition-colors active:scale-95"
            title="管理员登录"
          >
            <Shield className="w-6 h-6 text-primary" />
          </button>
        )}
        <button 
          onClick={() => navigateTo('profile')}
          className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-white font-bold overflow-hidden border-2 border-white shadow-sm"
          title="个人资料"
        >
          <User className="w-6 h-6" />
        </button>
      </div>

      {/* 侧边菜单 */}
      <AnimatePresence>
        {showSideMenu && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 left-0 w-64 h-full bg-surface/80 backdrop-blur-xl z-50 shadow-xl border-r border-outline-variant/10"
          >
            <div className="p-6 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="font-headline font-black text-xl text-primary">AI知识库</h2>
                <button 
                  onClick={() => setShowSideMenu(false)}
                  className="p-2 rounded-full hover:bg-surface-container transition-colors"
                  title="关闭菜单"
                >
                  <X className="w-5 h-5 text-primary" />
                </button>
              </div>
              <nav className="space-y-4">
                <button 
                  onClick={() => {
                    navigateTo('discover');
                    setShowSideMenu(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === 'discover' ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container'}`}
                >
                  <div className="flex items-center gap-3">
                    <Compass className="w-5 h-5" />
                    <span className="font-medium">发现</span>
                  </div>
                </button>
                <button 
                  onClick={() => {
                    navigateTo('explore');
                    setShowSideMenu(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === 'explore' ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container'}`}
                >
                  <div className="flex items-center gap-3">
                    <Layers className="w-5 h-5" />
                    <span className="font-medium">分类</span>
                  </div>
                </button>
                <button 
                  onClick={() => {
                    navigateTo('upload');
                    setShowSideMenu(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === 'upload' ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container'}`}
                >
                  <div className="flex items-center gap-3">
                    <ArrowUpRight className="w-5 h-5" />
                    <span className="font-medium">上传</span>
                  </div>
                </button>
                <button 
                  onClick={() => {
                    navigateTo('notification');
                    setShowSideMenu(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === 'notification' ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container'}`}
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5" />
                    <span className="font-medium">通知</span>
                  </div>
                </button>
                <button 
                  onClick={() => {
                    navigateTo('profile');
                    setShowSideMenu(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container'}`}
                >
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5" />
                    <span className="font-medium">个人中心</span>
                  </div>
                </button>
                {isAdmin && (
                  <button 
                    onClick={() => {
                      navigateTo('admin');
                      setShowSideMenu(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === 'admin' ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5" />
                      <span className="font-medium">管理中心</span>
                    </div>
                  </button>
                )}
              </nav>
              <div className="pt-4 border-t border-outline-variant/10">
                <button 
                  onClick={() => {
                    if (isAdmin) {
                      navigateTo('admin-login');
                    } else {
                      navigateTo('login');
                    }
                    setShowSideMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg transition-colors hover:bg-surface-container"
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">{isAdmin ? '退出管理' : '登录/注册'}</span>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function BottomNavBar({ activeTab, navigateTo, unreadCount }: { activeTab: Screen, navigateTo: (s: Screen, id?: string | null) => void, unreadCount: number }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface/80 backdrop-blur-xl border-t border-outline-variant/10 py-3 px-6 z-50">
      <div className="flex items-center justify-around max-w-7xl mx-auto">
        <button 
          onClick={() => navigateTo('discover')}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${activeTab === 'discover' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
          title="发现"
        >
          <Compass className={`w-6 h-6 ${activeTab === 'discover' ? 'text-primary' : 'text-on-surface-variant'}`} />
          <span className="text-xs font-medium">发现</span>
        </button>
        <button 
          onClick={() => navigateTo('explore')}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${activeTab === 'explore' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
          title="分类"
        >
          <Layers className={`w-6 h-6 ${activeTab === 'explore' ? 'text-primary' : 'text-on-surface-variant'}`} />
          <span className="text-xs font-medium">分类</span>
        </button>
        <button 
          onClick={() => navigateTo('upload')}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${activeTab === 'upload' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
          title="上传"
        >
          <ArrowUpRight className={`w-6 h-6 ${activeTab === 'upload' ? 'text-primary' : 'text-on-surface-variant'}`} />
          <span className="text-xs font-medium">上传</span>
        </button>
        <button 
          onClick={() => navigateTo('notification')}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${activeTab === 'notification' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
          title="通知"
        >
          <div className="relative">
            <Bell className={`w-6 h-6 ${activeTab === 'notification' ? 'text-primary' : 'text-on-surface-variant'}`} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-xs font-medium">通知</span>
        </button>
        <button 
          onClick={() => navigateTo('profile')}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${activeTab === 'profile' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
          title="个人中心"
        >
          <User className={`w-6 h-6 ${activeTab === 'profile' ? 'text-primary' : 'text-on-surface-variant'}`} />
          <span className="text-xs font-medium">我的</span>
        </button>
      </div>
    </nav>
  );
}

function NotificationScreen({ navigateTo, updateNotifications }: { navigateTo: (s: Screen, id?: string | null) => void, updateNotifications: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    setNotifications(notificationService.getAllNotifications());
  };

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id);
    loadNotifications();
    updateNotifications();
  };

  const handleDelete = (id: string) => {
    notificationService.deleteNotification(id);
    loadNotifications();
    updateNotifications();
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
    loadNotifications();
    updateNotifications();
  };

  const handleClearAll = () => {
    notificationService.clearAllNotifications();
    loadNotifications();
    updateNotifications();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-error" />;
      default:
        return <Info className="w-5 h-5 text-info" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-success/10 text-success';
      case 'warning':
        return 'bg-warning/10 text-warning';
      case 'error':
        return 'bg-error/10 text-error';
      default:
        return 'bg-info/10 text-info';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <h2 className="font-headline font-black text-3xl tracking-tight text-primary">通知</h2>
        <div className="flex gap-2">
          {notifications.length > 0 && (
            <>
              <button 
                onClick={handleMarkAllAsRead}
                className="px-3 py-1.5 bg-secondary-container text-on-secondary-container rounded-full text-sm font-semibold hover:bg-secondary transition-colors"
                title="标记全部已读"
              >
                全部已读
              </button>
              <button 
                onClick={handleClearAll}
                className="px-3 py-1.5 bg-surface-container text-on-surface rounded-full text-sm font-semibold hover:bg-surface-container-high transition-colors"
                title="清除全部"
              >
                清除
              </button>
            </>
          )}
        </div>
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`p-5 rounded-2xl border border-outline-variant/10 transition-all ${notification.read ? 'bg-surface-container-low' : 'bg-primary/5 border-primary/20'}`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold text-on-surface">{notification.title}</h3>
                  <p className="text-on-surface-variant text-sm">{notification.message}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                    <div className="flex gap-2">
                      {!notification.read && (
                        <button 
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="text-secondary text-xs font-semibold hover:underline"
                          title="标记已读"
                        >
                          标记已读
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(notification.id)}
                        className="text-on-surface-variant text-xs font-semibold hover:text-error"
                        title="删除"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <Bell className="w-16 h-16 text-outline-variant opacity-20" />
          <p className="text-on-surface-variant font-medium">暂无通知</p>
          <p className="text-on-surface-variant text-sm text-center max-w-md">
            当有重要事件发生时，您会收到通知
          </p>
        </div>
      )}
    </div>
  );
}

function DiscoverScreen({ navigateTo }: { navigateTo: (s: Screen, id?: string | null) => void }) {
  return (
    <div className="space-y-12 pb-12">
      {/* Welcome & Search (Mobile) */}
      <section className="md:hidden space-y-4">
        <h2 className="font-headline font-extrabold text-3xl tracking-tight text-primary">探索人工智能</h2>
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
          <label htmlFor="mobile-search" className="sr-only">搜索术语</label>
          <input 
            id="mobile-search"
            className="w-full bg-surface-container-highest border-none rounded-xl py-3 pl-12 pr-4 text-on-surface focus:ring-2 focus:ring-secondary outline-none" 
            placeholder="搜索术语..." 
            type="text" 
          />
        </div>
      </section>

      {/* Daily AI Insights Banner */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-primary-container min-h-[320px] flex items-center p-8 md:p-16">
        <div className="relative z-10 max-w-lg space-y-6">
          <span className="inline-block px-4 py-1 rounded-full bg-secondary-container text-on-secondary-container font-headline text-[11px] font-bold uppercase tracking-widest">每日洞察</span>
          <h2 className="font-headline font-extrabold text-4xl md:text-5xl text-white leading-tight">深入理解大语言模型</h2>
          <p className="text-white/70 text-lg leading-relaxed">探索概率性词元预测如何构成现代对话式 AI 的基石。</p>
          <button 
            onClick={() => navigateTo('article', 'llm')}
            className="bg-primary text-white px-8 py-3 rounded-full font-semibold shadow-xl hover:scale-105 transition-transform"
            title="阅读今日条目"
          >
            阅读今日条目
          </button>
        </div>
        <div className="absolute inset-0 z-0">
          <img 
            alt="技术抽象图" 
            className="w-full h-full object-cover opacity-40 mix-blend-overlay" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJwz2XXj_HzsJTnpgQAr4hEasnKsExrqaY8FiB1eT_CE2-M7xxuEIugFZXB5tMXiZ6J2qOM2AtcKUtW0VEcwKiW48dOG5xczbYQluW_AR_0omJPJmVc2qd_OEh_lunRoIUBoiaYpu-mTQHhTTAWA1g0bmKXZlk4PsFZ9HzibmglOMS8H4KESeRD2wXPYwUNjd-LMOghi9x1qRkNBXsvQLfmgGnCWBPfEGwwcbQJ3QTIWVmmo2P7_i2R2mGpPfCQKpt9Rh4op2LhJB8" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-container via-primary-container/80 to-transparent"></div>
        </div>
      </section>

      {/* Trending Now */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-headline font-bold text-2xl text-on-surface">热门趋势</h3>
          <button className="text-secondary font-semibold text-sm flex items-center gap-1" title="查看全部热门趋势">查看全部 <ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2">
          <TrendingCard icon={<Bolt />} title="变压器 (Transformers)" desc="GPT 和现代自然语言处理任务背后的核心架构。" />
          <TrendingCard icon={<Brain />} title="RLHF" desc="基于人类反馈的强化学习。" />
          <TrendingCard icon={<Layers />} title="扩散模型 (Diffusion)" desc="用于高质量图像合成的生成式模型。" />
          <TrendingCard icon={<Terminal />} title="思维链 (CoT)" desc="通过逐步提示提高模型的推理能力。" />
        </div>
      </section>

      {/* Knowledge Tree (Bento Grid) */}
      <section className="space-y-6">
        <h3 className="font-headline font-bold text-2xl text-on-surface">知识树</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="col-span-2 row-span-2 relative group overflow-hidden rounded-3xl min-h-[240px] bg-secondary p-8 flex flex-col justify-end text-white cursor-pointer">
            <img 
              alt="自然语言" 
              className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCgNJ6hCtHDt598qEL0o3KTPfekzJ-a2-r9ajkGbKLlwgZS-VURPMYWLFrUhJ9JElxKSDJxuelkLLwUD8iEzV35H59hQdRCfphfTSEGPiYXC-hjcTBIIShoOOqhkSQ6tisxgPaaO22NeZ4nLb7NUbvOm8-xE4SEKsLTjZG3ZqemsOkbYEAPzrLB385MhCumKNc19vP2eSAaY57ul-7LL1d5rrUwk5jCcp9LfoW9bUsKmyhwYzp1kgYr0dlaJc77Q5V56TjIzQ60vz5j" 
            />
            <div className="relative z-10">
              <Languages className="w-10 h-10 mb-4" />
              <h4 className="text-2xl font-bold">自然语言</h4>
              <p className="text-cyan-100 text-sm opacity-80 mt-2">1,240 篇文章可用</p>
            </div>
          </div>
          <div className="relative group overflow-hidden rounded-3xl h-[240px] bg-primary p-6 flex flex-col justify-end text-white cursor-pointer">
            <img 
              alt="机器人学" 
              className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-81-XVllSF-K7vKT80eqyuzlmWv2WNoJZXX1WbD_x6ZCvPmbxL2bhOXWVp-gJWxBK88OBYnbLTYVB3DcThPbPNz-etBDlApSrGTH7DQF1NQ5ImWgsxuJerVPBLUbIPpXkHw4eOLkkl-BAdE0fgRozzuZJnxI4q4WKgsm1V_x0VKFf8-iuYiVM_B4TG6UDp81Hx55-GtFFaO4cOwalzsD4no2DyhqszctMApczSMuCG8fWaAd7_WW2z1sv5gA16K_YiQ3jXwpcUySp" 
            />
            <div className="relative z-10">
              <Bot className="w-8 h-8 mb-2" />
              <h4 className="text-lg font-bold">机器人学</h4>
            </div>
          </div>
          <div className="relative group overflow-hidden rounded-3xl h-[240px] bg-surface-container-high p-6 flex flex-col justify-end text-on-surface cursor-pointer">
            <div className="relative z-10">
              <Gavel className="w-8 h-8 mb-2 text-secondary" />
              <h4 className="text-lg font-bold">AI 伦理</h4>
              <p className="text-on-surface-variant text-xs mt-1">基础与政策</p>
            </div>
          </div>
          <div className="relative group overflow-hidden rounded-3xl h-[240px] bg-surface-container p-6 flex flex-col justify-end text-on-surface cursor-pointer">
            <div className="relative z-10">
              <Eye className="w-8 h-8 mb-2 text-secondary" />
              <h4 className="text-lg font-bold">计算机视觉</h4>
            </div>
          </div>
          <div className="relative group overflow-hidden rounded-3xl h-[240px] bg-primary-container p-6 flex flex-col justify-end text-white cursor-pointer">
            <div className="relative z-10">
              <Sparkles className="w-8 h-8 mb-2 text-secondary-container" />
              <h4 className="text-lg font-bold">未来趋势</h4>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended for You */}
      <section className="space-y-6">
        <h3 className="font-headline font-bold text-2xl text-on-surface">为你推荐</h3>
        <div className="grid md:grid-cols-1 gap-4">
          <ArticleCard 
            tag="AI 伦理" 
            time="4 分钟阅读" 
            title="通用人工智能 (AGI) 中的对齐问题" 
            desc="我们如何确保超智能系统在任何情况下都能遵循人类意图和价值观？" 
            img="https://lh3.googleusercontent.com/aida-public/AB6AXuD69rLtY4nNzmD2C8nVKZ-2yujG3hrxgX2nEPJWAY6J9_1ARZtDa4sVqnIaj02p7NBiTbaB9spjBlvxU3OWovHQ2Dycq8K8xrcBu0OEXoJYFtjBXeQO3ey4fyR9FLe3Tc2Vm_SqOBPzKm3ZFBKsXYRzPYHdsD5MvI8UIxvZ0zhx-oVIHxepb03XR4UYKgzY4LtN8qjc3evGfMkJR76JcPxkMiBIDYuTe0b_Tm8sf2djKRKJ1lCrYLSQsUh7wqmxlNX5OtBfXaVRmHO7"
            onClick={() => navigateTo('article', 'agi')}
          />
          <ArticleCard 
            tag="硬件" 
            time="6 分钟阅读" 
            title="NPU 的崛起：定制化硅片" 
            desc="为什么专用神经处理单元正在取代通用 GPU 进行推理任务。" 
            img="https://lh3.googleusercontent.com/aida-public/AB6AXuD2dfL9I5QMzGWE5Og2tQKJrNbTZi79pkWjpraklHpPsX1yi8YFAVqcjBsZ8MJmYiTOxp7-VWo6yCotOmf3-vWSKaT0FiS52hMtQKov5f9VeCVR5aZL_5WEyZlU_mcvTMIgQQWRndDQEg68SrpL0O_X1hFXK5gyNcUyU-tz-1IXzQ8D1ej7o7-Y0aBX-bZ0qog99fwHuq9FLVggqRWH4mDXysB7s8tI9biqSF3ei2uitib_g7QdId7P4_qzf4c5cz7JdlCklCUqkobu"
            onClick={() => navigateTo('article', 'npu')}
          />
        </div>
      </section>
    </div>
  );
}

function TrendingCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex-none w-64 p-6 rounded-3xl bg-surface-container border border-outline-variant/15 hover:shadow-2xl transition-all cursor-pointer group">
      <div className="text-secondary w-10 h-10 mb-4 group-hover:scale-110 transition-transform">
        {React.cloneElement(icon as React.ReactElement, { className: 'w-full h-full' })}
      </div>
      <h4 className="font-headline font-bold text-lg mb-1">{title}</h4>
      <p className="text-on-surface-variant text-sm line-clamp-2">{desc}</p>
    </div>
  );
}

function ArticleCard({ tag, time, title, desc, img, onClick }: { tag: string, time: string, title: string, desc: string, img: string, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="flex flex-col md:flex-row gap-6 p-4 rounded-3xl bg-surface-container-low border border-outline-variant/10 hover:bg-surface-container-high transition-colors group cursor-pointer"
    >
      <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden shrink-0">
        <img alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" src={img} />
      </div>
      <div className="flex flex-col justify-center space-y-2">
        <div className="flex gap-2">
          <span className="bg-secondary-container/30 text-on-secondary-container px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">{tag}</span>
          <span className="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest">{time}</span>
        </div>
        <h4 className="text-xl font-bold font-headline group-hover:text-secondary transition-colors">{title}</h4>
        <p className="text-on-surface-variant text-sm line-clamp-2">{desc}</p>
      </div>
    </div>
  );
}

function ExploreScreen({ navigateTo }: { navigateTo: (s: Screen, id?: string | null) => void }) {
  const [recentItems, setRecentItems] = useState<{ title: string, category: string, active: boolean }[]>([
    { title: "注意力机制", category: "基础 > Transformer", active: true },
    { title: "GPT-4 技术报告", category: "模型 > 大语言模型 > OpenAI", active: false },
    { title: "扩散模型", category: "生成式 AI > 计算机视觉", active: false },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["自然语言处理"]);

  const clearHistory = () => {
    setRecentItems([]);
  };

  const toggleCategory = (title: string) => {
    setExpandedCategories(prev => 
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const expandAll = () => {
    setExpandedCategories(["神经网络", "自然语言处理", "机器人与控制", "伦理与对齐"]);
  };

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    
    try {
      const response = await api.searchArticles(searchQuery);
      setSearchResults(response.articles);
    } catch (err) {
      setSearchError('搜索失败，请稍后重试');
      console.error('Error searching articles:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleTagClick = async (tag: string) => {
    setSearchQuery(tag);
    setIsSearching(true);
    setSearchError(null);
    
    try {
      const response = await api.searchArticles(tag);
      setSearchResults(response.articles);
    } catch (err) {
      setSearchError('搜索失败，请稍后重试');
      console.error('Error searching articles:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const categories = [
    { 
      icon: <Brain />, 
      title: "神经网络", 
      count: "424 篇文章 • 18 个子类",
      subItems: [
        { title: '感知机', link: true },
        { title: '卷积神经网络 (CNN)', link: true },
        { title: '循环神经网络 (RNN)', link: true },
      ]
    },
    { 
      icon: <Languages />, 
      title: "自然语言处理", 
      count: "892 篇文章 • 24 个子类",
      subItems: [
        { title: '基座模型', hasSub: true },
        { title: '大语言模型 (LLMs)', active: true, tag: '当前活跃' },
        { title: 'BERT 与掩码建模', link: true },
        { title: 'T5 与 文本到文本', link: true },
        { title: '句法分析', hasSub: true },
      ]
    },
    { 
      icon: <Cpu />, 
      title: "机器人与控制", 
      count: "156 篇文章 • 12 个子类",
      subItems: [
        { title: '强化学习', link: true },
        { title: '运动规划', link: true },
        { title: '机器视觉', hasSub: true },
      ]
    },
    { 
      icon: <Gavel />, 
      title: "伦理与对齐", 
      count: "211 篇文章 • 9 个子类",
      subItems: [
        { title: '偏见与公平性', link: true },
        { title: '可解释性', link: true },
        { title: '超级对齐', tag: '前沿' },
      ]
    },
  ];

  const filteredCategories = categories.filter(cat => 
    cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.subItems?.some(sub => sub.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-12 pb-12">
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <h2 className="font-headline font-black text-4xl md:text-5xl tracking-tight text-primary">深度知识，精心策划。</h2>
        <p className="text-on-surface-variant text-lg">搜索人工智能与机器学习的权威档案。</p>
        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mt-8">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${isSearching ? 'text-secondary animate-pulse' : 'text-on-surface-variant'}`} />
          <label htmlFor="explore-search" className="sr-only">搜索模型、伦理或历史</label>
          <input 
            id="explore-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-highest border-none rounded-xl py-4 pl-12 pr-24 text-lg font-medium focus:ring-2 focus:ring-secondary outline-none transition-all" 
            placeholder="搜索模型、伦理或历史..." 
            type="text" 
          />
          <button 
            type="submit"
            disabled={isSearching}
            className="absolute right-2 top-2 bottom-2 bg-primary text-white px-6 rounded-lg font-semibold hover:bg-primary-container transition-colors disabled:opacity-50"
            title="搜索内容"
          >
            {isSearching ? '搜索中...' : '搜索'}
          </button>
        </form>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <aside className="lg:col-span-4 space-y-10 order-2 lg:order-1">
          <div className="bg-surface-container-low p-6 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h3 className="font-headline font-bold text-lg">最近查看</h3>
                <History className="w-4 h-4 text-outline" />
              </div>
              {recentItems.length > 0 && (
                <button 
                  onClick={clearHistory}
                  className="text-xs font-bold text-secondary hover:underline transition-all"
                >
                  清除
                </button>
              )}
            </div>
            {recentItems.length > 0 ? (
              <ul className="space-y-4">
                {recentItems.map((item, idx) => (
                  <RecentItem key={idx} title={item.title} category={item.category} active={item.active} />
                ))}
              </ul>
            ) : (
              <div className="py-8 text-center space-y-2">
                <p className="text-sm text-on-surface-variant">暂无最近查看记录</p>
              </div>
            )}
          </div>
          <div className="p-6 border border-outline-variant/10 rounded-xl bg-gradient-to-br from-surface-container to-surface-container-low">
            <h3 className="font-headline font-bold text-lg mb-4">趋势脉动</h3>
            <div className="flex flex-wrap gap-2">
              {['智能体', '量化', 'RLHF', 'Llama 3', '多模态'].map(tag => (
                <button 
                  key={tag} 
                  onClick={() => handleTagClick(tag)}
                  className="px-3 py-1 bg-secondary-container text-on-secondary-container text-xs font-bold rounded-full uppercase tracking-wider hover:bg-secondary hover:text-white transition-all active:scale-95"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="lg:col-span-8 order-1 lg:order-2 space-y-8">
          {searchQuery && (
            <div className="flex items-center justify-between">
              <h2 className="font-headline font-bold text-2xl">搜索结果</h2>
              <button 
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  setSearchError(null);
                }}
                className="text-secondary font-semibold text-sm flex items-center gap-1 hover:underline"
                title="清除搜索"
              >
                清除搜索 <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {!searchQuery ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="font-headline font-bold text-2xl">知识树</h2>
                <button 
                onClick={expandAll}
                className="text-secondary font-semibold text-sm flex items-center gap-1 hover:underline"
                title="全部展开分类"
              >
                全部展开 <ChevronsUpDown className="w-4 h-4" />
              </button>
              </div>
              <div className="space-y-4">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat, idx) => (
                    <CategoryItem 
                      key={idx}
                      icon={cat.icon} 
                      title={cat.title} 
                      count={cat.count} 
                      expanded={expandedCategories.includes(cat.title)}
                      onToggle={() => toggleCategory(cat.title)}
                      subItems={cat.subItems}
                      navigateTo={navigateTo}
                    />
                  ))
                ) : (
                  <div className="py-20 text-center bg-surface-container-low rounded-2xl border-2 border-dashed border-outline-variant/20">
                    <Search className="w-12 h-12 text-outline-variant mx-auto mb-4 opacity-20" />
                    <p className="text-on-surface-variant font-medium">未找到与 "{searchQuery}" 相关的结果</p>
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="mt-4 text-secondary font-bold hover:underline"
                    >
                      清除搜索
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {isSearching ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    <p className="mt-4 text-on-surface-variant">搜索中...</p>
                  </div>
                </div>
              ) : searchError ? (
                <div className="py-20 text-center bg-surface-container-low rounded-2xl border-2 border-dashed border-outline-variant/20">
                  <X className="w-12 h-12 text-error mx-auto mb-4" />
                  <p className="text-error font-medium">{searchError}</p>
                  <button 
                    onClick={handleSearch}
                    className="mt-4 text-secondary font-bold hover:underline"
                  >
                    重试
                  </button>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-4">
                  {searchResults.map((article, idx) => (
                    <ArticleCard 
                      tag={article.tag}
                      time={article.read_time}
                      title={article.title}
                      desc={article.description}
                      img={article.image_url}
                      onClick={() => navigateTo('article', article.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center bg-surface-container-low rounded-2xl border-2 border-dashed border-outline-variant/20">
                  <Search className="w-12 h-12 text-outline-variant mx-auto mb-4 opacity-20" />
                  <p className="text-on-surface-variant font-medium">未找到与 "{searchQuery}" 相关的结果</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function RecentItem({ title, category, active = false }: { title: string, category: string, active?: boolean, key?: any }) {
  return (
    <li className="group cursor-pointer">
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 mt-2 rounded-full ${active ? 'bg-secondary' : 'bg-outline-variant'}`}></div>
        <div>
          <p className="font-semibold text-on-surface group-hover:text-secondary transition-colors leading-tight">{title}</p>
          <p className="text-xs text-on-surface-variant mt-1">{category}</p>
        </div>
      </div>
    </li>
  );
}

function CategoryItem({ icon, title, count, expanded = false, onToggle, subItems = [], navigateTo }: { icon: React.ReactNode, title: string, count: string, expanded?: boolean, onToggle?: () => void, subItems?: any[], navigateTo?: (s: Screen, id?: string | null) => void, key?: any }) {
  return (
    <div className={`bg-surface-container-low rounded-xl overflow-hidden transition-all duration-300 ${expanded ? 'border-l-4 border-secondary shadow-lg ring-1 ring-black/5' : 'hover:shadow-md'}`}>
      <div 
        onClick={onToggle}
        className={`flex items-center justify-between p-5 hover:bg-surface-container-high cursor-pointer transition-colors group ${expanded ? 'bg-surface-container-high' : ''}`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${expanded ? 'bg-secondary text-white scale-110' : 'bg-primary-container text-white group-hover:bg-secondary'}`}>
            {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
          </div>
          <div>
            <h4 className="font-headline font-bold text-lg">{title}</h4>
            <p className="text-xs text-on-surface-variant">{count}</p>
          </div>
        </div>
        <ChevronRight className={`w-5 h-5 text-outline transition-all duration-300 ${expanded ? 'rotate-90 text-secondary' : 'group-hover:translate-x-1'}`} />
      </div>
      {expanded && subItems.length > 0 && (
        <div className="p-5 space-y-4 bg-surface-container-low/50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="ml-6 space-y-4">
            {subItems.map((item, idx) => (
              <div 
                key={idx} 
                onClick={(e) => {
                  e.stopPropagation();
                  if (navigateTo) navigateTo('article');
                }}
                className={`flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-highest cursor-pointer transition-all active:scale-[0.98] ${item.active ? 'bg-secondary-container/20 border border-secondary/20' : ''}`}
              >
                <span className={`font-medium ${item.active ? 'text-secondary font-semibold' : 'text-on-surface'}`}>{item.title}</span>
                <div className="flex items-center gap-2">
                  {item.tag && <span className="text-[10px] bg-secondary-container px-2 py-0.5 rounded text-on-secondary-container font-black">{item.tag}</span>}
                  {item.link && <ArrowUpRight className="w-4 h-4 text-outline group-hover:text-secondary" />}
                  {item.hasSub && <ChevronRight className="w-4 h-4 text-outline" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ArticleScreen({ navigateTo, articleId }: { navigateTo: (s: Screen, id?: string | null) => void, articleId: string | null }) {
  const [article, setArticle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const articleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!articleId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await api.getArticleById(articleId);
        setArticle(response.article);
        await fetchReadingProgress();
      } catch (err) {
        setError('加载文章失败，请稍后重试');
        console.error('Error fetching article:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchReadingProgress = async () => {
      if (!articleId) return;
      
      try {
        const response = await api.getProgress();
        const progress = response.progress.find((p: any) => p.article_id === articleId);
        if (progress) {
          setReadingProgress(progress.progress);
          // 滚动到上次阅读的位置
          setTimeout(() => {
            const articleElement = articleRef.current;
            if (articleElement) {
              const scrollHeight = articleElement.scrollHeight;
              const scrollPosition = (progress.progress / 100) * scrollHeight;
              window.scrollTo({ top: scrollPosition, behavior: 'smooth' });
            }
          }, 100);
        }
      } catch (err) {
        console.error('Error fetching reading progress:', err);
      }
    };

    fetchArticle();
  }, [articleId]);

  useEffect(() => {
    const handleScroll = () => {
      if (!articleRef.current) return;
      
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const totalDocScrollable = docHeight - winHeight;
      const scrollProgress = Math.round((scrollTop / totalDocScrollable) * 100);
      
      setReadingProgress(scrollProgress);
    };

    const saveProgress = async () => {
      if (!articleId || readingProgress === 0) return;
      
      setIsSavingProgress(true);
      
      try {
        await api.updateProgress(articleId, readingProgress);
      } catch (err) {
        console.error('Error saving reading progress:', err);
      } finally {
        setIsSavingProgress(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    const progressInterval = setInterval(saveProgress, 10000); // 每10秒保存一次进度

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(progressInterval);
      // 组件卸载时保存最终进度
      saveProgress();
    };
  }, [articleId, readingProgress]);

  return (
    <div className="space-y-12 pb-12">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12 space-y-4">
          <X className="w-12 h-12 text-error mx-auto" />
          <p className="text-error font-medium">{error}</p>
          <button 
            onClick={() => navigateTo('discover')}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-full font-semibold hover:bg-primary-container transition-colors"
          >
            返回发现页面
          </button>
        </div>
      ) : article ? (
        <div ref={articleRef} className="space-y-8">
          <div className="relative h-64 md:h-96 rounded-3xl overflow-hidden">
            <img 
              alt={article.title} 
              className="w-full h-full object-cover" 
              src={article.image_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJwz2XXj_HzsJTnpgQAr4hEasnKsExrqaY8FiB1eT_CE2-M7xxuEIugFZXB5tMXiZ6J2qOM2AtcKUtW0VEcwKiW48dOG5xczbYQluW_AR_0omJPJmVc2qd_OEh_lunRoIUBoiaYpu-mTQHhTTAWA1g0bmKXZlk4PsFZ9HzibmglOMS8H4KESeRD2wXPYwUNjd-LMOghi9x1qRkNBXsvQLfmgGnCWBPfEGwwcbQJ3QTIWVmmo2P7_i2R2mGpPfCQKpt9Rh4op2LhJB8'}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
              <div className="p-8">
                <h1 className="text-2xl md:text-4xl font-headline font-bold text-white mb-2">{article.title}</h1>
                <p className="text-white/80 text-sm md:text-base">{article.read_time || '5 分钟阅读'}</p>
              </div>
            </div>
          </div>
          <div className="prose prose-lg max-w-none text-on-surface">
            {article.content}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 space-y-4">
          <X className="w-12 h-12 text-outline-variant mx-auto" />
          <p className="text-on-surface-variant font-medium">文章不存在</p>
          <button 
            onClick={() => navigateTo('discover')}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-full font-semibold hover:bg-primary-container transition-colors"
          >
            返回发现页面
          </button>
        </div>
      )}
    </div>
  );
}

function UploadScreen({ navigateTo, updateNotifications }: { navigateTo: (s: Screen, id?: string | null) => void, updateNotifications: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.createArticle({
        title,
        description,
        content,
        category_id: category,
        image_url: imageUrl,
        tag: 'AI 伦理'
      });
      
      // 生成成功通知
      notificationService.createSuccessNotification(
        '文章上传成功',
        `您的文章 "${title}" 已成功上传`
      );
      updateNotifications();
      
      setSuccess('文章上传成功！');
      
      // 重置表单
      setTitle('');
      setDescription('');
      setContent('');
      setCategory('');
      setImageUrl('');
      
      // 3秒后导航回发现页面
      setTimeout(() => {
        navigateTo('discover');
      }, 3000);
    } catch (err) {
      setError('上传失败，请稍后重试');
      console.error('Error uploading article:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <h2 className="font-headline font-black text-3xl tracking-tight text-primary">上传文章</h2>
      
      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-success/10 border border-success/20 rounded-xl text-success">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-on-surface mb-2">标题</label>
          <input 
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
            placeholder="输入文章标题"
            required
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-on-surface mb-2">描述</label>
          <textarea 
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
            placeholder="输入文章描述"
            rows={3}
          />
        </div>
        
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-on-surface mb-2">内容</label>
          <textarea 
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
            placeholder="输入文章内容"
            rows={6}
            required
          />
        </div>
        
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-on-surface mb-2">分类</label>
          <select 
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
            required
          >
            <option value="">选择分类</option>
            <option value="1">自然语言处理</option>
            <option value="2">神经网络</option>
            <option value="3">机器人与控制</option>
            <option value="4">伦理与对齐</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium text-on-surface mb-2">图片 URL</label>
          <input 
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
            placeholder="输入图片 URL"
          />
        </div>
        
        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary-container transition-colors disabled:opacity-50"
        >
          {isSubmitting ? '上传中...' : '上传文章'}
        </button>
      </form>
    </div>
  );
}

function RegisterScreen({ navigateTo, updateNotifications }: { navigateTo: (s: Screen, id?: string | null) => void, updateNotifications: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await api.register(email, password, name, title);
      
      // 生成成功通知
      notificationService.createSuccessNotification(
        '注册成功',
        `欢迎 ${name}！您的账号已成功创建`
      );
      updateNotifications();
      
      setSuccess('注册成功！');
      
      // 3秒后导航到发现页面
      setTimeout(() => {
        navigateTo('discover');
      }, 3000);
    } catch (err) {
      setError('注册失败，请稍后重试');
      console.error('Error registering user:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-8 pb-12">
      <div className="text-center space-y-4">
        <h2 className="font-headline font-black text-3xl tracking-tight text-primary">注册账号</h2>
        <p className="text-on-surface-variant">创建新账号，开始探索 AI 知识库</p>
      </div>
      
      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-success/10 border border-success/20 rounded-xl text-success">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-on-surface mb-2">姓名</label>
          <input 
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
            placeholder="输入您的姓名"
            required
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-on-surface mb-2">邮箱</label>
          <input 
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
            placeholder="输入您的邮箱"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-on-surface mb-2">密码</label>
          <input 
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
            placeholder="输入您的密码"
            required
          />
        </div>
        
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-on-surface mb-2">职位（可选）</label>
          <input 
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
            placeholder="输入您的职位"
          />
        </div>
        
        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary-container transition-colors disabled:opacity-50"
        >
          {isSubmitting ? '注册中...' : '注册'}
        </button>
      </form>
      
      <div className="text-center">
        <p className="text-on-surface-variant text-sm">
          已有账号？
          <button 
            onClick={() => navigateTo('login')}
            className="text-secondary font-semibold ml-1 hover:underline"
          >
            登录
          </button>
        </p>
      </div>
    </div>
  );
}

function LoginScreen({ navigateTo }: { navigateTo: (s: Screen, id?: string | null) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await api.login(email, password);
      navigateTo('discover');
    } catch (err) {
      setError('登录失败，请检查邮箱和密码');
      console.error('Error logging in:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-8 pb-12">
      <div className="text-center space-y-4">
        <h2 className="font-headline font-black text-3xl tracking-tight text-primary">登录</h2>
        <p className="text-on-surface-variant">登录您的账号，继续探索 AI 知识库</p>
      </div>
      
      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-on-surface mb-2">邮箱</label>
          <input 
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
            placeholder="输入您的邮箱"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-on-surface mb-2">密码</label>
          <input 
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
            placeholder="输入您的密码"
            required
          />
        </div>
        
        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary-container transition-colors disabled:opacity-50"
        >
          {isSubmitting ? '登录中...' : '登录'}
        </button>
      </form>
      
      <div className="text-center">
        <p className="text-on-surface-variant text-sm">
          没有账号？
          <button 
            onClick={() => navigateTo('register')}
            className="text-secondary font-semibold ml-1 hover:underline"
          >
            注册
          </button>
        </p>
      </div>
    </div>
  );
}

function AdminLoginScreen({ navigateTo, setIsAdmin }: { navigateTo: (s: Screen, id?: string | null) => void, setIsAdmin: (isAdmin: boolean) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await api.adminLogin(username, password);
      setIsAdmin(true);
      navigateTo('admin');
    } catch (err) {
      setError('登录失败，请检查用户名和密码');
      console.error('Error logging in as admin:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-8 pb-12">
      <div className="text-center space-y-4">
        <h2 className="font-headline font-black text-3xl tracking-tight text-primary">管理员登录</h2>
        <p className="text-on-surface-variant">登录管理员账号，管理系统</p>
      </div>
      
      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-on-surface mb-2">用户名</label>
          <input 
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
            placeholder="输入管理员用户名"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-on-surface mb-2">密码</label>
          <input 
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
            placeholder="输入管理员密码"
            required
          />
        </div>
        
        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary-container transition-colors disabled:opacity-50"
        >
          {isSubmitting ? '登录中...' : '登录'}
        </button>
      </form>
    </div>
  );
}

function AdminScreen({ navigateTo, setIsAdmin }: { navigateTo: (s: Screen, id?: string | null) => void, setIsAdmin: (isAdmin: boolean) => void }) {
  const [articles, setArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.getArticles();
        setArticles(response.articles);
      } catch (err) {
        setError('加载文章失败');
        console.error('Error fetching articles:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const handleLogout = () => {
    api.logout();
    setIsAdmin(false);
    navigateTo('discover');
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <h2 className="font-headline font-black text-3xl tracking-tight text-primary">管理中心</h2>
        <button 
          onClick={handleLogout}
          className="px-4 py-2 bg-surface-container text-on-surface rounded-full font-semibold hover:bg-surface-container-high transition-colors"
        >
          退出
        </button>
      </div>
      
      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        <h3 className="font-headline font-bold text-xl text-on-surface">文章管理</h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <div key={article.id} className="p-4 bg-surface-container rounded-xl border border-outline-variant/10">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-on-surface">{article.title}</h4>
                    <p className="text-on-surface-variant text-sm mt-1">{article.created_at}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-sm font-semibold hover:bg-secondary transition-colors">
                      编辑
                    </button>
                    <button className="px-3 py-1 bg-error/10 text-error rounded-full text-sm font-semibold hover:bg-error/20 transition-colors">
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileScreen({ navigateTo }: { navigateTo: (s: Screen, id?: string | null) => void }) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.getUserProfile();
        setUser(response.user);
      } catch (err) {
        // 认证错误，显示未登录状态
        setUser(null);
        console.error('Error fetching user profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = () => {
    api.logout();
    navigateTo('discover');
  };

  return (
    <div className="space-y-8 pb-12">
      <h2 className="font-headline font-black text-3xl tracking-tight text-primary">个人中心</h2>
      
      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : user ? (
        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-2xl">
              {user.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-headline font-bold text-xl text-on-surface">{user.name}</h3>
              <p className="text-on-surface-variant">{user.email}</p>
              {user.title && <p className="text-on-surface-variant text-sm">{user.title}</p>}
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold text-on-surface">账户设置</h4>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-between p-4 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors">
                <span className="text-on-surface">个人资料</span>
                <ChevronRight className="w-5 h-5 text-outline-variant" />
              </button>
              <button className="w-full flex items-center justify-between p-4 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors">
                <span className="text-on-surface">通知设置</span>
                <ChevronRight className="w-5 h-5 text-outline-variant" />
              </button>
              <button className="w-full flex items-center justify-between p-4 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors">
                <span className="text-on-surface">隐私设置</span>
                <ChevronRight className="w-5 h-5 text-outline-variant" />
              </button>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-4 bg-error/10 rounded-xl hover:bg-error/20 transition-colors"
              >
                <span className="text-error">退出登录</span>
                <LogOut className="w-5 h-5 text-error" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 space-y-4">
          <User className="w-12 h-12 text-outline-variant mx-auto" />
          <p className="text-on-surface-variant font-medium">未登录</p>
          <button 
            onClick={() => navigateTo('login')}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-full font-semibold hover:bg-primary-container transition-colors"
          >
            登录
          </button>
        </div>
      )}
    </div>
  );
}
