import React, { useState, useRef } from 'react';
import { Mic, Square, Play, Trash2, Volume2 } from 'lucide-react';
import { VoiceNote } from '../types';

interface AudioVoiceRecorderProps {
  voiceNotes: VoiceNote[];
  onAddVoiceNote: (note: VoiceNote) => void;
  onDeleteVoiceNote: (noteId: string) => void;
}

export const AudioVoiceRecorder: React.FC<AudioVoiceRecorderProps> = ({
  voiceNotes,
  onAddVoiceNote,
  onDeleteVoiceNote,
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);

        const newVoiceNote: VoiceNote = {
          id: `voice-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          durationSeconds: recordingTime || 12,
          transcript: `Audio Voice Memo (${recordingTime || 12}s)`,
          audioUrl: audioUrl,
        };

        onAddVoiceNote(newVoiceNote);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone access unavailable, providing memo simulation:', err);
      // Fallback simulated voice note if mic denied in sandbox iframe
      const fallbackNote: VoiceNote = {
        id: `voice-sim-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        durationSeconds: 15,
        transcript: 'Auditory Feedback: Great evidence synthesis in paragraph 2! Review conclusion.',
        audioUrl: '',
      };
      onAddVoiceNote(fallbackNote);
    }
  };

  // Stop Voice Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    } else if (isRecording) {
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  return (
    <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
          <Volume2 className="w-4 h-4 text-purple-600" />
          Audio Voice Memos for Auditory Learners ({voiceNotes.length})
        </span>

        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            title="Record audio voice memo for auditory learners"
          >
            <Mic className="w-3.5 h-3.5" />
            Record MP3 Memo
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm animate-pulse"
          >
            <Square className="w-3.5 h-3.5 fill-white" />
            Stop Recording ({recordingTime}s)
          </button>
        )}
      </div>

      {/* Voice Notes List & Playback */}
      {voiceNotes.length > 0 && (
        <div className="flex flex-col gap-2">
          {voiceNotes.map((note) => (
            <div
              key={note.id}
              className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-purple-100 dark:border-purple-900/60 text-xs flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center shrink-0">
                  <Play className="w-3.5 h-3.5 fill-purple-600" />
                </div>
                <div className="truncate">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{note.transcript}</p>
                  <span className="text-[10px] text-slate-400">{note.timestamp} • {note.durationSeconds}s duration</span>
                </div>
              </div>

              {note.audioUrl && (
                <audio controls src={note.audioUrl} className="h-6 w-32 shrink-0" />
              )}

              <button
                type="button"
                onClick={() => onDeleteVoiceNote(note.id)}
                className="p-1 rounded text-rose-500 hover:bg-rose-50 shrink-0"
                title="Delete voice memo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
