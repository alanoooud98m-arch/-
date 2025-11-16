
import React, { useState, useRef, useCallback } from 'react';
import { generateSpeech } from './services/geminiService';
import { decode, decodeAudioData } from './utils/audioUtils';
import { PlayButton } from './components/PlayButton';
import { LoadingSpinner } from './components/LoadingSpinner';

const GAME_RULES = [
  {
    title: "أولاً:",
    text: "يبدأ جميع اللاعبين من خانة البداية، ويقوم كل لاعب برمي النرد للتحرّك على اللوح."
  },
  {
    title: "ثانياً:",
    text: "إذا وقف اللاعب على خانة أرقام، فلا يحدث أي شيء."
  },
  {
    title: "ثالثاً:",
    text: "إذا وقف اللاعب على خانة نقش، يسحب كرت من كروت النقوش، ويستخدم العدسة لرؤية النقشة. إذا نجح في حل الهِنت أو التلميح يحتفظ بالكرت، أما إذا لم يتمكّن من الحل فيسحب كرت عقوبة."
  },
  {
    title: "رابعاً:",
    text: "إذا وقف اللاعب على خانة معالم أو أشكال، يسحب كرت من كروت التحديات، وهي عبارة عن أسئلة عن العلا. إذا أجاب بشكل صحيح يبقى في مكانه، وإذا أخطأ يسحب كرت عقوبات."
  },
  {
    title: "خامساً:",
    text: "إذا وقف اللاعب على خانة شخصيات، يدخل إلى الساحة الخاصة بالشخصية، ولا يمكنه الخروج منها إلا إذا رمى نردًا بأرقام متشابهة — مثل ٤ و٤. وفي بعض الحالات يمكنه التقدّم عدة خانات إضافية عبر مسار خاص يشبه السلم (مثل الانتقال من ٧ إلى ١١)."
  },
  {
    title: "الفائز:",
    text: "في نهاية اللعب، الفائز هو اللاعب الذي يجمع أكبر عدد من النقوش المفكوكة."
  }
];

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const fullText = GAME_RULES.map(rule => `${rule.title} ${rule.text}`).join('\n');

  const stopPlayback = useCallback(() => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().then(() => {
        audioContextRef.current = null;
      });
    }
    setIsPlaying(false);
  }, []);

  const handlePlayToggle = async () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const base64Audio = await generateSpeech(fullText);

      if (!base64Audio) {
        throw new Error("لم يتم استقبال بيانات صوتية.");
      }

      // Ensure previous playback is stopped before starting a new one
      if (audioContextRef.current || audioSourceRef.current) {
          stopPlayback();
      }

      // FIX: Corrected a TypeScript error where 'webkitAudioContext' was not found on the 'Window' type.
      // This ensures compatibility with older browsers that use the vendor-prefixed AudioContext.
      const newAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = newAudioContext;

      const audioBuffer = await decodeAudioData(
        decode(base64Audio),
        newAudioContext,
        24000,
        1
      );

      const source = newAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(newAudioContext.destination);

      source.onended = () => {
        setIsPlaying(false);
        stopPlayback();
      };

      source.start();
      audioSourceRef.current = source;
      setIsPlaying(true);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع.");
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-800 flex flex-col items-center p-4 sm:p-6 md:p-8 font-[LBC_Alpen_Bold]">
      <div className="w-full max-w-4xl mx-auto flex-grow">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-amber-900">قوانين اللعبة</h1>
          <p className="text-stone-600 mt-2 text-lg">استمع إلى شرح قواعد اللعبة بصوت واضح</p>
        </header>

        <main className="bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-6">
          {GAME_RULES.map((rule, index) => (
            <div key={index} className="border-r-4 border-amber-800 pr-4">
              <h2 className="text-xl font-bold text-amber-900 mb-1">{rule.title}</h2>
              <p className="text-stone-700 leading-relaxed text-right">{rule.text}</p>
            </div>
          ))}
        </main>
      </div>

      <footer className="sticky bottom-0 w-full flex justify-center py-4 bg-stone-100/80 backdrop-blur-sm mt-8">
        <div className="w-full max-w-4xl px-4 flex flex-col items-center">
          {error && <p className="text-red-600 mb-2 bg-red-100 p-2 rounded-md">{error}</p>}
          <PlayButton
            onClick={handlePlayToggle}
            isPlaying={isPlaying}
            isLoading={isLoading}
          />
        </div>
      </footer>
    </div>
  );
};

export default App;
