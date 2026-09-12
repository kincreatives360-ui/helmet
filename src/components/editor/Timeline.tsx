"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { Repeat } from "lucide-react";
import { useEditorStore } from "../../store/editorStore";
import { EASING_OPTIONS } from "../../lib/easing";

const DURATION_PRESETS = [3, 5, 10, 15];

export function Timeline({ durationSeconds: initialDuration }: { durationSeconds?: number }) {
  const progress = useEditorStore((s) => s.previewProgress);
  const setProgress = useEditorStore((s) => s.setPreviewProgress);
  const easing = useEditorStore((s) => s.easing);
  const setEasing = useEditorStore((s) => s.setEasing);
  const setPlaybackMode = useEditorStore((s) => s.setPlaybackMode);
  const storeDuration = useEditorStore((s) => s.durationSeconds);
  const setDurationSeconds = useEditorStore((s) => s.setDurationSeconds);

  const duration = storeDuration ?? initialDuration ?? 5;

  const [playing, setPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const isLoopingRef = useRef(true);

  useEffect(() => {
    isLoopingRef.current = isLooping;
  }, [isLooping]);

  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const playAnimationRef = useRef<(startFrom: number) => void>(() => {});

  useEffect(() => {
    return () => {
      tweenRef.current?.kill();
    };
  }, []);

  const playAnimation = useCallback(
    (startFrom: number) => {
      setPlaybackMode("auto");
      setPlaying(true);

      const state = { p: startFrom };
      const remainingDuration = duration * (1 - startFrom);

      tweenRef.current?.kill();
      tweenRef.current = gsap.to(state, {
        p: 1,
        duration: Math.max(0.05, remainingDuration),
        ease: "none",
        onUpdate: () => {
          setProgress(state.p);
        },
        onComplete: () => {
          if (isLoopingRef.current) {
            setProgress(0);
            playAnimationRef.current(0);
          } else {
            setPlaying(false);
          }
        },
      });
    },
    [duration, setPlaybackMode, setProgress],
  );

  useEffect(() => {
    playAnimationRef.current = playAnimation;
  }, [playAnimation]);

  const handleDurationChange = (newDur: number) => {
    const validDur = Math.max(0.5, Math.min(120, newDur));
    setDurationSeconds(validDur);
    if (playing) {
      tweenRef.current?.kill();
      playAnimation(progress);
    }
  };

  const togglePlay = () => {
    if (playing) {
      tweenRef.current?.kill();
      setPlaying(false);
      return;
    }

    const startProgress = progress >= 0.999 ? 0 : progress;
    if (startProgress === 0 && progress !== 0) {
      setProgress(0);
    }

    playAnimation(startProgress);
  };

  const handleScrub = (val: number) => {
    if (playing) {
      tweenRef.current?.kill();
      setPlaying(false);
    }
    setPlaybackMode("auto");
    setProgress(val);
  };

  const currentTime = (progress * duration).toFixed(1);
  const totalTime = duration.toFixed(1);

  return (
    <div className="timelineContainer" id="timeline-controls">
      <div className="timelineHeader">
        <div className="timelineHeaderLeft">
          <span className="timelineTitle">Animation Timeline</span>
          <div className="timelineKeyframePills">
            {[0, 0.25, 0.5, 0.75, 1].map((p) => (
              <button
                key={p}
                type="button"
                className={`timelineKeyframePill ${Math.abs(progress - p) < 0.02 ? "timelineKeyframePill--active" : ""}`}
                onClick={() => handleScrub(p)}
                title={`Jump to ${Math.round(p * 100)}%`}
              >
                {Math.round(p * 100)}%
              </button>
            ))}
          </div>
        </div>

        <div className="timelineHeaderRight">
          {/* Duration Control */}
          <div className="durationControlGroup">
            <div className="durationPresetPills">
              {DURATION_PRESETS.map((d) => (
                <button
                  key={d}
                  type="button"
                  id={`btn-duration-preset-${d}`}
                  className={`durationPill ${duration === d ? "durationPill--active" : ""}`}
                  onClick={() => handleDurationChange(d)}
                >
                  {d}s
                </button>
              ))}
            </div>
            <div className="durationInputWrapper">
              <input
                type="number"
                id="input-timeline-duration"
                className="durationInput"
                min={0.5}
                max={120}
                step={0.5}
                value={duration}
                onChange={(e) => handleDurationChange(Number(e.target.value))}
                title="Custom duration in seconds"
              />
              <span className="durationUnit">s</span>
            </div>
          </div>

          {/* Easing Control */}
          <div className="easingControlGroup">
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
              {EASING_OPTIONS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="timelineBtnIcon">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="timelineBtnIcon">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
          <span className="timelineBtnText">{playing ? "Pause" : "Play"}</span>
        </button>

        <button
          type="button"
          id="btn-timeline-loop"
          className={`timelineLoopBtn ${isLooping ? "timelineLoopBtn--active" : ""}`}
          onClick={() => {
            const nextVal = !isLooping;
            setIsLooping(nextVal);
            isLoopingRef.current = nextVal;
          }}
          title={isLooping ? "Looping enabled" : "Looping disabled"}
          aria-label={isLooping ? "Disable loop" : "Enable loop"}
        >
          <Repeat size={13} className="timelineBtnIcon" />
          <span className="timelineBtnText">Loop</span>
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
          <div className="timelineTickMarkers">
            <span className="timelineTick" style={{ left: "25%" }} title="25% marker" />
            <span className="timelineTick" style={{ left: "50%" }} title="50% marker" />
            <span className="timelineTick" style={{ left: "75%" }} title="75% marker" />
          </div>
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
