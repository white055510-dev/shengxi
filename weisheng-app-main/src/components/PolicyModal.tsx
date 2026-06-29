import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'zh' | 'en';
  type?: 'all' | 'privacy' | 'terms';
}

export default function PolicyModal({ isOpen, onClose, language, type = 'all' }: PolicyModalProps) {
  // 处理物理返回键关闭（如果是在 Capacitor 环境下）
  useEffect(() => {
    const handleBackButton = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleBackButton);
    return () => window.removeEventListener('keydown', handleBackButton);
  }, [isOpen, onClose]);

  const getTitle = () => {
    if (type === 'privacy') return language === 'zh' ? '隐私政策' : 'Privacy Policy';
    if (type === 'terms') return language === 'zh' ? '服务条款' : 'Terms of Service';
    return language === 'zh' ? '服务条款及隐私政策' : 'Terms & Privacy Policy';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩层 - 点击可关闭 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] cursor-pointer"
          />

          {/* 弹窗内容 - 从底部滑入 (Bottom Sheet 风格) */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-[85vh] bg-[#1a1a1a] rounded-t-[32px] z-[101] flex flex-col shadow-2xl"
          >
            {/* 顶部手柄/装饰 */}
            <div className="w-12 h-1 bg-white/10 rounded-full mx-auto my-4 shrink-0" />

            {/* 标题栏 */}
            <div className="flex items-center justify-between px-6 pb-4 border-b border-white/5">
              <h3 className="text-lg font-bold text-white">
                {getTitle()}
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // 防止冒泡
                  onClose();
                }}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 滚动内容区 */}
            <div className="flex-1 overflow-y-auto p-6 text-sm text-white/60 leading-relaxed space-y-6 no-scrollbar">
              <p className="text-white/40 text-xs">最后更新日期：2026年5月30日</p>

              <section className="space-y-2">
                <h4 className="text-white font-bold">1. 运营主体</h4>
                <p>本服务由声隙（Shengxi Audio）运营。如您对本政策有任何疑问，请通过以下方式联系我们：</p>
                <p>电子邮箱：357221851@qq.com / white055510@gmail.com</p>
              </section>

              <section className="space-y-2">
                <h4 className="text-white font-bold">2. 我们收集的信息</h4>
                <p>为提供声纹识别、音频降噪及相关服务，我们可能需要收集：</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>账号信息：邮箱地址、手机号码（用于注册、登录及身份验证）</li>
                  <li>声纹特征数据：经您授权录制的音频中提取的声纹特征向量（用于身份识别）</li>
                  <li>音频内容：您主动上传或录制的原始音频文件（用于降噪处理）</li>
                  <li>设备信息：设备型号、操作系统版本、唯一设备标识符（用于故障排查与服务优化）</li>
                  <li>日志信息：IP地址、访问时间、操作记录（用于安全保障与性能分析）</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-white font-bold">3. 信息的使用目的</h4>
                <p>我们严格在以下目的范围内使用您的个人信息：</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>提供声纹识别与身份验证服务</li>
                  <li>提供音频降噪、通话增强等核心功能</li>
                  <li>保障账号安全，防范欺诈与恶意攻击</li>
                  <li>改进产品性能与用户体验</li>
                  <li>遵守法律法规的合规要求</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-white font-bold">4. 信息的存储与保护</h4>
                <ul className="list-disc pl-4 space-y-1">
                  <li>加密处理：您的声纹特征数据及音频文件均采用加密算法处理后存储</li>
                  <li>存储地点：数据存储于中国大陆境内的安全服务器（阿里云）</li>
                  <li>存储期限：账号注销后，我们将在30个工作日内删除或匿名化您的个人数据，法律法规另有规定的除外</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-white font-bold">5. 信息共享与披露</h4>
                <p>未经您的明确同意，我们不会将您的声纹数据、音频内容或个人信息出售、出租或分享给任何第三方。但以下情形除外：</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>应法律法规、司法机关或行政机关的合法要求</li>
                  <li>为合并、收购或资产转让，且继续履行本政策下的义务</li>
                  <li>为保护声隙、用户或公众的合法权益所必需</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-white font-bold">6. 您的权利</h4>
                <p>您对个人信息享有以下权利：</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>查阅与更正：您有权查阅、更正您的账号信息</li>
                  <li>删除权：您有权要求删除您的个人数据（法律法规保留期限除外）</li>
                  <li>撤回同意：您有权随时撤回对声纹采集的同意，撤回后可能影响部分功能使用</li>
                  <li>注销账号：您可通过应用内设置或联系客服注销账号</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-white font-bold">7. 未成年人保护</h4>
                <p>本服务主要面向年满14周岁的用户。我们不会主动收集未成年人的声纹数据。如您是未成年人监护人且发现我们有相关收集行为，请立即联系我们删除。</p>
              </section>

              <section className="space-y-2">
                <h4 className="text-white font-bold">8. 第三方服务</h4>
                <p>我们可能接入第三方服务（如阿里云服务器、SMTP邮件服务），这些第三方仅在我们的要求下处理数据，并受保密义务约束。</p>
              </section>

              <section className="space-y-2">
                <h4 className="text-white font-bold">9. 政策更新</h4>
                <p>我们可能适时修订本政策，修订后将在应用内显著位置提示。如您在更新后继续使用本服务，视为同意修订后的政策。</p>
              </section>

              <section className="space-y-2">
                <h4 className="text-white font-bold">10. 联系我们</h4>
                <p>如您对本政策或个人信息处理有任何疑问、投诉或建议，请通过以下方式联系我们：</p>
                <p>电子邮箱：357221851@qq.com / white055510@gmail.com</p>
                <p>我们将在收到您的反馈后15个工作日内予以回复。</p>
              </section>

              <div className="h-20" /> {/* 底部留白 */}
            </div>

            {/* 底部按钮栏 */}
            <div className="p-6 pb-8 bg-[#1a1a1a] border-t border-white/5 safe-area-bottom">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="w-full h-14 bg-brand-bronze text-white font-bold rounded-2xl hover:bg-opacity-90 active:scale-95 transition-all shadow-xl shadow-brand-bronze/20"
              >
                {language === 'zh' ? '我知道了' : 'I Understand'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
