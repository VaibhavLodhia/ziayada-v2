import { ArrowRight, Mic, Square } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/classNames';
import { useVoiceAgent } from '@/hooks/useVoiceAgent';

type FieldProps = {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  onVoiceSubmit?: (text: string) => void;
  onListeningChange?: (listening: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  voiceEnabled?: boolean;
  multiline?: boolean;
  type?: 'text' | 'email' | 'password';
  maxRows?: number;
  autoFocus?: boolean;
  className?: string;
  inputClassName?: string;
  id?: string;
  name?: string;
};

export function Field({
  value,
  onChange,
  onSubmit,
  onVoiceSubmit,
  onListeningChange,
  placeholder = 'Your answer.',
  disabled = false,
  voiceEnabled = true,
  multiline = true,
  type = 'text',
  maxRows = 8,
  autoFocus = false,
  className,
  inputClassName,
  id,
  name,
}: FieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatMode = voiceEnabled || multiline;

  const voice = useVoiceAgent({
    onStop: (text) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      if (onVoiceSubmit) onVoiceSubmit(trimmed);
      else onChange(trimmed);
    },
  });

  useEffect(() => {
    onListeningChange?.(voice.isListening);
  }, [onListeningChange, voice.isListening]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el || !multiline) return;
    el.style.height = 'auto';
    const lineHeight = 30;
    el.style.height = `${Math.min(el.scrollHeight, lineHeight * maxRows)}px`;
  }, [maxRows, multiline, value]);

  const sendDisabled = disabled || value.trim().length === 0;
  const liveVoice = voiceEnabled && voice.isListening;
  const micLabel = voice.error ?? (liveVoice ? 'Stop recording' : 'Record voice');

  const inputClass = cn(
    'flex-1 bg-transparent py-2 text-left font-display text-[clamp(17px,1.6vw,19px)] leading-[1.6] text-ink placeholder:text-inkFaint focus:outline-none caret-seal',
    multiline ? 'max-h-[200px] min-h-[30px] resize-none' : 'min-h-[30px]',
    inputClassName,
  );

  return (
    <div
      className={cn(
        'w-full border-b border-rule px-1.5 pb-3 pt-2 transition-colors focus-within:border-seal',
        chatMode ? 'max-w-[640px]' : '',
        className,
      )}
    >
      <div className="flex items-end gap-1.5">
        {multiline ? (
          <textarea
            id={id}
            ref={textareaRef}
            name={name}
            value={liveVoice && voice.draftTranscript ? voice.draftTranscript : value}
            disabled={disabled || liveVoice}
            autoFocus={autoFocus}
            rows={1}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!sendDisabled) onSubmit();
              }
            }}
            placeholder={placeholder}
            className={inputClass}
          />
        ) : (
          <input
            id={id}
            name={name}
            type={type}
            value={value}
            disabled={disabled}
            autoFocus={autoFocus}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (!sendDisabled) onSubmit();
              }
            }}
            placeholder={placeholder}
            className={inputClass}
          />
        )}

        {voiceEnabled ? (
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
            {liveVoice ? (
              <span
                className="pointer-events-none absolute inset-0 rounded-full bg-seal/20 transition-transform"
                style={{
                  transform: `scale(${1 + voice.micLevel * 0.5})`,
                  opacity: 0.35 + voice.micLevel * 0.45,
                }}
                aria-hidden
              />
            ) : null}
            <button
              type="button"
              disabled={disabled && !liveVoice}
              className={cn(
                'relative flex h-9 w-9 items-center justify-center rounded-full text-ink3 transition-colors hover:bg-ground2 hover:text-seal disabled:cursor-not-allowed disabled:opacity-40',
                liveVoice
                  ? 'animate-[ziyada-pulse_1.4s_ease-in-out_infinite] bg-seal text-ground hover:bg-seal'
                  : '',
              )}
              onClick={() => voice.toggle()}
              aria-label={micLabel}
              aria-pressed={liveVoice}
              title={micLabel}
            >
              {liveVoice ? (
                <Square className="h-[14px] w-[14px] fill-current" />
              ) : (
                <Mic className="h-[18px] w-[18px]" />
              )}
            </button>
          </div>
        ) : null}

        {chatMode ? (
          <button
            type="button"
            disabled={sendDisabled || liveVoice}
            onClick={onSubmit}
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-inkFaint transition-all hover:bg-ground2 hover:text-seal disabled:cursor-not-allowed disabled:opacity-40',
              !sendDisabled && !liveVoice ? 'bg-ink text-ground hover:bg-seal' : '',
            )}
            aria-label="Send"
          >
            <ArrowRight className="h-[18px] w-[18px]" />
          </button>
        ) : null}
      </div>

      {liveVoice ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => voice.stop()}
            className="inline-flex items-center gap-1.5 rounded-pill border border-seal bg-sealGlow px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide-2 text-seal transition-colors hover:bg-seal hover:text-ground"
          >
            <span className="h-1.5 w-1.5 animate-[ziyada-pulse_1.4s_ease-in-out_infinite] rounded-full bg-seal" />
            Stop listening
          </button>
          {voice.draftTranscript ? (
            <span className="font-mono text-[10px] text-ink3">Transcribing...</span>
          ) : null}
        </div>
      ) : null}

      {voice.error && !liveVoice ? (
        <p className="mt-2 font-mono text-[10px] text-seal">{voice.error}</p>
      ) : null}
    </div>
  );
}
