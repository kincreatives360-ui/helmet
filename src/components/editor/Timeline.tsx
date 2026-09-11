"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useEditorStore } from "../../store/editorStore";

const EASING_PRESETS = [
  "power1.inOut",
  "power3.out",
  "back.out(1.7)",
  "linear",
  "sine.inOut",
  "power2.out",
  "expo.inOut",
];

export function Timeline({ durationSeconds = 5 }: { durationSeconds: number }) {
  const progress = useEditorStore((s) => s.previewProgress);
  const setProgress = useEditorStore((s) => s.setPreviewProgress);
  const easing = useEditorStore((s) => s.easing);
  const setEasing = useEditorStore((s) => s.setEasing);
  const playbackMode = useEditorStore((s) => s.playbackMode);
  const setPlaybackMode = useEditorStore((s) => s.setPlaybackMode);

  const [playing, setPlaying] = useState(false);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    return () => {
      tweenRef.current?.kill();
    };
  }, []);

  const togglePlay = () => {
    if (playing) {
      tweenRef.current?.kill();
      setPlaying(false);
      return;
    }

    setPlaybackMode("auto");
    setPlaying(true);

    const startProgress = progress >= 0.999 ? 0 : progress;
    if (startProgress === 0 && progress !== 0) {
      setProgress(0);
    }

    const state = { p: startProgress };
    const remainingDuration = durationSeconds * (1 - startProgress);

    tweenRef.current?.kill();
    tweenRef.current = gsap.to(state, {
      p: 1,
      duration: Math.max(0.1, remainingDuration),
      ease: easing,
      onUpdate: () => {
        setProgress(state.p);
      },
      onComplete: () => {
        setPlaying(false);
      },
    });
  };

  const handleScrub = (val: number) => {
    if (playing) {
      tweenRef.current?.kill();
      setPlaying(false);
    }
    setPlaybackMode("auto");
    setProgress(val);
  };

  const currentTime = (progress * durationSeconds).toFixed(1);
  const totalTime = durationSeconds.toFixed(1);

  return (
    <div className="timelineContainer" id="timeline-controls">
      <div className="timelineHeader">
        <div className="timelineHeaderLeft">
          <span className="timelineTitle">Animation Timeline</span>
          <div className="timelineModeBadge">
            <button
              type="button"
              id="btn-mode-interactive"
              className={`modeBadgeBtn ${playbackMode === "interactive" ? "modeBadgeBtn--active" : ""}`}
              onClick={() => {
                tweenRef.current?.kill();
                setPlaying(false);
                setPlaybackMode("interactive");
              }}
              title="Interactive 3D drag & scroll physics"
            >
              Interactive
            </button>
            <button
              type="button"
              id="btn-mode-auto"
              className={`modeBadgeBtn ${playbackMode === "auto" ? "modeBadgeBtn--active" : ""}`}
              onClick={() => setPlaybackMode("auto")}
              title="Deterministic timeline scrubbing"
            >
              Timeline
            </button>
          </div>
        </div>

        <div className="timelineHeaderRight">
          <label htmlFor="select-easing" className="easingLabel">
            Easing:
          </label>
          <select
            id="select-easing"
            className="easingSelect"
            value={easing}
            onChange={(e) => {
              setEasing(e.target.value);
              if (playing) {
                tweenRef.current?.kill();
                setPlaying(false);
              }
            }}
          >
            {EASING_PRESETS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="timelineTrackRow">
        <button
          type="button"
          id="btn-timeline-play-pause"
          className="timelinePlayBtn"
          onClick={togglePlay}
          aria-label={playing ? "Pause timeline" : "Play timeline"}
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
          <span>{playing ? "Pause" : "Play"}</span>
        </button>

        <div className="timelineScrubberWrapper">
          <input
            id="timeline-scrubber"
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={progress}
            onChange={(e) => handleScrub(Number(e.target.value))}
            className="timelineScrubber"
            aria-label="Timeline progress scrubber"
          />
          <div
            className="timelineProgressFill"
            style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
          />
        </div>

        <div className="timelineTimeReadout">
          <span className="currentTimeText">{currentTime}s</span>
          <span className="timeDivider">/</span>
          <span className="totalTimeText">{totalTime}s</span>
        </div>
      </div>
    </div>
  );
}
