import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppState, User, Contact } from './types';
import { useLanguage } from './contexts/LanguageContext';
import SplashScreen from './components/SplashScreen';
import LoginScreen from './components/LoginScreen';
import RecordingView from './components/RecordingView';
import BottomNav from './components/BottomNav';
import CallingScreen from './components/CallingScreen';
import ContactsTab from './components/Tabs/ContactsTab';
import CallsTab from './components/Tabs/CallsTab';
import MeTab from './components/Tabs/MeTab';
import SettingsPage from './components/SettingsPage';
import PrivacySecurityPage from './components/PrivacySecurityPage';
import AddContactSheet from './components/AddContactSheet';
import RemoteRecord from './components/RemoteRecord';
import DialPad from './components/DialPad';
import AdminLoginDialog from './components/AdminLoginDialog';
import AdminPanel from './components/AdminPanel';
import { useAdmin } from './hooks/useAdmin';
import { audioEngine } from './services/audioEngine';
import { db } from './db/database';
import { io, Socket } from 'socket.io-client';
import { API_BASE } from './constants';

export default function App() {
  const { language, setLanguage, translations: t } = useLanguage();
  const { isAdmin, loginAdmin, logoutAdmin } = useAdmin();
  const [state, setState] = useState<AppState>({
    view: 'splash' as AppState['view'],
    activeTab: 'calls',
    user: null,
    language: language,
    selectedContact: null,
    isFilterOn: true,
    noiseReduction: 85,
    noiseSensitivity: 'Standard',
    activeCallId: null,
  });

  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isDialPadOpen, setIsDialPadOpen] = useState(false);
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [remoteParams, setRemoteParams] = useState<{token: string, contactId: string} | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Check for remote record URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const contactId = params.get('contactId');
    if (token && contactId) {
      setRemoteParams({ token, contactId });
      setState(prev => ({ ...prev, view: 'record' }));
    }
  }, []);

  // Socket listener for the main app to receive voiceprint data
  useEffect(() => {
    if (state.view === 'app') {
      socketRef.current = io(API_BASE);
      
      // Listen for incoming voiceprints for any pending contacts
      socketRef.current.on('signal', async ({ from, data }: { from: string, data: any }) => {
        if (data.type === 'voiceprint-upload') {
          console.log('Received remote voiceprint upload:', data);
          const { contactId, feature } = data;
          
          const featureVector = new Float32Array(feature);
          
          await db.voiceprints.add({
            contactId,
            data: featureVector,
            noiseLevel: 'Standard',
            createdAt: new Date()
          });

          await db.contacts.update(contactId, {
            voiceprintStatus: 'ready',
            voiceprintFeature: featureVector,
            recordedAt: new Date().toISOString()
          });

          // Show a notification or update UI
          alert(language === 'zh' ? '成功接收到远程声纹特征' : 'Successfully received remote voiceprint');
        }
      });

      // Join rooms for all pending contacts to listen for their specific updates
      const listenToPending = async () => {
        const pendingContacts = await db.contacts.where('voiceprintStatus').equals('pending').toArray();
        pendingContacts.forEach(c => {
          if (c.shareToken) {
            socketRef.current?.emit('join-room', c.shareToken);
          }
        });
      };
      listenToPending();
    }

    return () => {
      socketRef.current?.disconnect();
    };
  }, [state.view, language]);

  const handleLogin = (user: User) => {
    setState(prev => ({ ...prev, user, view: 'app' }));
  };

  const handleSplashFinish = () => {
    setState(prev => ({ ...prev, view: 'login' }));
  };

  const handleCall = (contact: Contact) => {
    setState(prev => ({ ...prev, selectedContact: contact, view: 'calling' }));
    audioEngine.startMicrophone().catch(console.error);
  };

  const handleDialCall = (num: string) => {
    const contact: Contact = {
      id: `dialed_${num}`,
      name: num,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${num}`,
      voiceprintStatus: 'untrained',
      createdAt: new Date().toISOString()
    };
    setIsDialPadOpen(false);
    handleCall(contact);
  };

  const endCall = () => {
    setState(prev => ({ ...prev, view: 'app' }));
    audioEngine.stopMicrophone();
  };

  const setTab = (tab: AppState['activeTab']) => {
    setState(prev => ({ ...prev, activeTab: tab }));
  };

  const updateNickname = async (name: string) => {
    handleUpdateUser({ nickname: name });
  };

  const handleUpdateUser = async (updates: Partial<User>) => {
    if (state.user) {
      const newUser = { ...state.user, ...updates };
      await db.users.put(newUser);
      setState(prev => ({ ...prev, user: newUser }));
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden selection:bg-brand-bronze/30 bg-brand-bg-dark font-sans">
      <div className="paper-texture" />
      
      <main className="relative z-10 w-full h-full max-w-md mx-auto overflow-hidden flex flex-col bg-brand-bg-dark shadow-[0_0_100px_rgba(0,0,0,0.5)]">
        <AnimatePresence>
          {state.view === 'splash' && (
            <motion.div key="splash" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="absolute inset-0 z-20">
              <SplashScreen
                onFinish={handleSplashFinish}
                appName={t.appName}
                tagline="Shengxi Audio"
              />
            </motion.div>
          )}

          {state.view === 'login' && (
            <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10">
              <LoginScreen language={language} onLanguageToggle={setLanguage} onLoginSuccess={handleLogin} t={t} />
            </motion.div>
          )}

          {state.view === 'app' && (
            <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10 flex flex-col pt-12">
              <div className="flex-1 overflow-y-auto px-6 pb-24 no-scrollbar">
                {state.activeTab === 'calls' && (
                  <CallsTab 
                    onAddContact={() => setIsAddContactOpen(true)}
                    onOpenDialPad={() => setIsDialPadOpen(true)}
                    t={t} 
                  />
                )}
                {state.activeTab === 'contacts' && (
                  <ContactsTab 
                    onSelect={(c) => setState(prev => ({ ...prev, selectedContact: c }))}
                    onCall={handleCall}
                    onAdd={() => setIsAddContactOpen(true)}
                    onRecord={(c) => setState(prev => ({ ...prev, view: 'recording', selectedContact: c }))}
                    t={t}
                    language={language}
                  />
                )}
                {state.activeTab === 'me' && (
                  <MeTab 
                    user={state.user} 
                    onUpdateUser={handleUpdateUser}
                    language={language} 
                    onLanguageToggle={() => setLanguage(language === 'zh' ? 'en' : 'zh')} 
                    onLogout={() => setState(prev => ({ ...prev, view: 'login', user: null }))}
                    onStartRecording={() => setState(prev => ({ ...prev, view: 'recording' }))}
                    onOpenSettings={() => setState(prev => ({ ...prev, view: 'settings' }))}
                    onOpenPrivacy={() => setState(prev => ({ ...prev, view: 'privacy' }))}
                    onOpenAdmin={() => {
                       if (isAdmin) setState(prev => ({ ...prev, view: 'admin' }));
                       else setIsAdminDialogOpen(true);
                    }}
                    isAdmin={isAdmin}
                    t={t}
                  />
                )}
              </div>
              <BottomNav activeTab={state.activeTab} onTabChange={setTab} t={t} />
              
              <AddContactSheet 
                isOpen={isAddContactOpen} 
                onClose={() => setIsAddContactOpen(false)} 
                t={t} 
              />
              
              <DialPad 
                isOpen={isDialPadOpen} 
                onClose={() => setIsDialPadOpen(false)} 
                onCall={handleDialCall}
                t={t} 
              />

              <AdminLoginDialog 
                isOpen={isAdminDialogOpen}
                onClose={() => setIsAdminDialogOpen(false)}
                onLogin={(pw) => {
                  const success = loginAdmin(pw);
                  if (success) setState(prev => ({ ...prev, view: 'admin' }));
                  return success;
                }}
                language={language}
              />
            </motion.div>
          )}

          {state.view === 'admin' && (
             <motion.div 
               key="admin" 
               initial={{ x: '100%' }} 
               animate={{ x: 0 }} 
               exit={{ x: '100%' }} 
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="absolute inset-0 z-[100]"
             >
               <AdminPanel 
                 language={language}
                 onBack={() => setState(prev => ({ ...prev, view: 'app' }))}
                 onLogout={() => {
                   logoutAdmin();
                   setState(prev => ({ ...prev, view: 'app' }));
                 }}
               />
             </motion.div>
          )}

          {state.view === 'settings' && (
            <motion.div 
              key="settings" 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-20"
            >
              <SettingsPage 
                state={{...state, language}}
                t={t}
                onBack={() => setState(prev => ({ ...prev, view: 'app' }))}
                onUpdateNickname={updateNickname}
                onLogout={() => setState(prev => ({ ...prev, view: 'login', user: null }))}
                onSetSensitivity={(lvl) => setState(prev => ({ ...prev, noiseSensitivity: lvl }))}
                onToggleLanguage={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
                onUpdateNoiseReduction={(v) => setState(prev => ({ ...prev, noiseReduction: v }))}
              />
            </motion.div>
          )}

          {state.view === 'privacy' && (
            <motion.div 
              key="privacy" 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-20"
            >
              <PrivacySecurityPage 
                state={{...state, language}}
                t={t}
                onBack={() => setState(prev => ({ ...prev, view: 'app' }))}
                onClearHistory={async () => {
                  await db.callLogs.clear();
                  alert(language === 'zh' ? '通话记录已清除' : 'Call history cleared');
                } }
                onClearData={async () => {
                  if (confirm(language === 'zh' ? '确定要清除所有声纹数据吗？此操作不可逆。' : 'Are you sure you want to clear all voiceprint data? This action is irreversible.')) {
                    await db.voiceprints.clear();
                    await db.contacts.toCollection().modify({ voiceprintStatus: 'untrained' });
                    alert(language === 'zh' ? '所有声纹数据已清除' : 'All voiceprint data cleared');
                  }
                }}
              />
            </motion.div>
          )}

          {state.view === 'calling' && state.selectedContact && (
            <motion.div key="calling" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="absolute inset-0 z-40">
              <CallingScreen 
                contact={state.selectedContact}
                isFilterOn={state.isFilterOn}
                onToggleFilter={() => setState(prev => ({ ...prev, isFilterOn: !prev.isFilterOn }))}
                onEndCall={endCall}
                noiseReduction={state.noiseReduction}
                onNoiseChange={(v) => setState(prev => ({ ...prev, noiseReduction: v }))}
                noiseSensitivity={state.noiseSensitivity}
                onSetSensitivity={(s) => setState(prev => ({ ...prev, noiseSensitivity: s }))}
                t={t}
                roomId={state.activeCallId || "123456"}
                isLoopback={true} // For testing/demo as requested
              />
            </motion.div>
          )}

          {state.view === 'recording' && (
            <motion.div key="recording" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50">
              <RecordingView 
                state={{...state, language}} 
                t={t} 
                onFinish={() => setState(prev => ({ ...prev, view: 'app' }))}
                onSetSensitivity={(s) => setState(prev => ({ ...prev, noiseSensitivity: s }))}
              />
            </motion.div>
          )}

          {state.view === 'record' && remoteParams && (
            <motion.div key="record" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100]">
              <RemoteRecord 
                t={t}
                token={remoteParams.token}
                contactId={remoteParams.contactId}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

