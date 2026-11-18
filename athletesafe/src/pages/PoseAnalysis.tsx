// ============================================================
// AthleteSafe – Pose Analysis Page
// Upload athlete image → AI pose detection → injury risk
// ============================================================

import React, { useState, useRef, useCallback } from 'react';
import {
  Upload, Camera, X, AlertTriangle, CheckCircle,
  Activity, Zap, ArrowRight, RefreshCw, ImageIcon,
  ChevronDown, ChevronUp, Info,
} from 'lucide-react';
import { analyzePose } from '../services/poseAnalysisService';
import type { PoseAnalysisResult, PoseKeypoint } from '../types';
import { RiskBadge } from '../components/ui/RiskBadge';
import { RiskScore } from '../components/ui/RiskScore';
import { RiskFactorItem } from '../components/ui/RiskFactor';
import { useApp } from '../context/AppContext';
import clsx from 'clsx';

const SPORTS = ['Football', 'Basketball', 'Cricket', 'Athletics', 'Tennis', 'Rugby', 'Cycling', 'Swimming', 'Other'];

// ── Skeleton colours ──────────────────────────────────────────
const SKELETON_CONNECTIONS: [string, string][] = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],   ['right_shoulder', 'right_elbow'],
  ['left_elbow',    'left_wrist'],   ['right_elbow',    'right_wrist'],
  ['left_shoulder', 'left_hip'],     ['right_shoulder', 'right_hip'],
  ['left_hip',      'right_hip'],
  ['left_hip',      'left_knee'],    ['right_hip',      'right_knee'],
  ['left_knee',     'left_ankle'],   ['right_knee',     'right_ankle'],
  ['left_ear',      'left_shoulder'],['right_ear',      'right_shoulder'],
  ['nose',          'left_eye'],     ['nose',           'right_eye'],
];

// ── Pose overlay canvas ───────────────────────────────────────
const PoseOverlay: React.FC<{
  keypoints: PoseKeypoint[];
  width: number;
  height: number;
}> = ({ keypoints, width, height }) => {
  const kpMap = new Map(keypoints.map((k) => [k.name, k]));

  return (
    <svg
      width={width}
      height={height}
      className="pose-overlay-svg"
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
    >
      {/* Connections */}
      {SKELETON_CONNECTIONS.map(([a, b]) => {
        const pa = kpMap.get(a);
        const pb = kpMap.get(b);
        if (!pa || !pb) return null;
        const conf = Math.min(pa.confidence, pb.confidence);
        return (
          <line
            key={`${a}-${b}`}
            x1={(pa.x / 100) * width}
            y1={(pa.y / 100) * height}
            x2={(pb.x / 100) * width}
            y2={(pb.y / 100) * height}
            stroke={conf > 0.85 ? '#B96545' : '#C8953A'}
            strokeWidth={conf > 0.85 ? 2.5 : 1.8}
            strokeOpacity={0.85}
            strokeLinecap="round"
          />
        );
      })}

      {/* Keypoints */}
      {keypoints.map((kp) => {
        const cx = (kp.x / 100) * width;
        const cy = (kp.y / 100) * height;
        const isJoint = ['knee', 'hip', 'ankle', 'shoulder', 'elbow'].some((j) =>
          kp.name.includes(j)
        );
        return (
          <g key={kp.name}>
            <circle
              cx={cx} cy={cy}
              r={isJoint ? 6 : 4}
              fill={kp.confidence > 0.9 ? '#F4F1EA' : '#C8953A'}
              stroke={isJoint ? '#B96545' : '#8FA69A'}
              strokeWidth={isJoint ? 2 : 1.5}
              opacity={0.92}
            />
            {isJoint && (
              <circle cx={cx} cy={cy} r={10}
                fill="none"
                stroke="#B96545"
                strokeWidth={1}
                opacity={0.3}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
};

// ── Severity colour helper ────────────────────────────────────
const segSeverityClass = (s: string) => ({
  normal:   'seg-normal',
  mild:     'seg-mild',
  moderate: 'seg-moderate',
  severe:   'seg-severe',
}[s] ?? 'seg-normal');

const jointStatusClass = (s: string) => ({
  normal:  'joint-normal',
  caution: 'joint-caution',
  risk:    'joint-risk',
}[s] ?? 'joint-normal');

// ── Analysis steps for loading UI ────────────────────────────
const STEPS = [
  'Loading image data...',
  'Detecting athlete silhouette...',
  'Mapping body keypoints (17-point skeleton)...',
  'Computing joint angles and segment lengths...',
  'Analysing bilateral symmetry...',
  'Detecting postural deviations...',
  'Generating injury risk indicators...',
  'Compiling recommendations...',
];

// ── Main page ─────────────────────────────────────────────────
export const PoseAnalysis: React.FC = () => {
  const { selectedAthlete, addToast } = useApp();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imgDims, setImgDims] = useState({ w: 0, h: 0 });
  const [sport, setSport] = useState(selectedAthlete.sport);
  const [athleteName, setAthleteName] = useState(selectedAthlete.name);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [result, setResult] = useState<PoseAnalysisResult | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [expandedSegment, setExpandedSegment] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // ── File handling ─────────────────────────────────────────
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      addToast({ type: 'error', message: 'Please upload an image file (JPEG, PNG, WebP).' });
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      addToast({ type: 'error', message: 'Image must be under 15 MB.' });
      return;
    }
    setImageFile(file);
    setResult(null);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const onImgLoad = () => {
    if (imgRef.current) {
      setImgDims({
        w: imgRef.current.offsetWidth,
        h: imgRef.current.offsetHeight,
      });
    }
  };

  // ── Run analysis ──────────────────────────────────────────
  const runAnalysis = async () => {
    if (!imageUrl || !imageFile) return;
    setLoading(true);
    setResult(null);
    setLoadStep(0);

    // Animate loading steps
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < STEPS.length) setLoadStep(step);
      else clearInterval(interval);
    }, 400);

    try {
      const res = await analyzePose(imageUrl, imageFile.name, sport, athleteName, imageFile);
      clearInterval(interval);
      setLoadStep(STEPS.length - 1);
      setResult(res);
      addToast({ type: 'success', message: 'Pose analysis complete.' });
    } catch {
      addToast({ type: 'error', message: 'Analysis failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImageFile(null);
    setImageUrl(null);
    setResult(null);
    setLoadStep(0);
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Pose Analysis</h1>
          <p className="page-subtitle">
            Upload an athlete image to detect posture, joint angles and injury risk indicators.
          </p>
        </div>
        <div className="pose-header-badge">
          <Camera size={13} />
          <span>Computer Vision · V1 Prototype</span>
        </div>
      </div>

      {/* How it works banner */}
      <div className="pose-how-it-works">
        <div className="pose-how-step"><span className="pose-step-num">01</span><span>Upload image</span></div>
        <div className="pose-how-arrow"><ArrowRight size={13} /></div>
        <div className="pose-how-step"><span className="pose-step-num">02</span><span>Select sport context</span></div>
        <div className="pose-how-arrow"><ArrowRight size={13} /></div>
        <div className="pose-how-step"><span className="pose-step-num">03</span><span>AI maps 17 keypoints</span></div>
        <div className="pose-how-arrow"><ArrowRight size={13} /></div>
        <div className="pose-how-step"><span className="pose-step-num">04</span><span>Joint angles computed</span></div>
        <div className="pose-how-arrow"><ArrowRight size={13} /></div>
        <div className="pose-how-step"><span className="pose-step-num">05</span><span>Injury risk generated</span></div>
      </div>

      <div className="pose-main-grid">

        {/* ── Left panel: Upload + Config ── */}
        <div className="pose-left-panel">

          {/* Upload zone */}
          {!imageUrl ? (
            <div
              className={clsx('pose-upload-zone', dragging && 'pose-upload-dragging')}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <div className="pose-upload-icon">
                <ImageIcon size={28} strokeWidth={1.5} />
              </div>
              <p className="pose-upload-title">Drop athlete image here</p>
              <p className="pose-upload-sub">
                JPEG, PNG or WebP · Max 15 MB
              </p>
              <button className="btn btn-ghost btn-sm pose-upload-btn">
                <Upload size={13} /> Browse files
              </button>
            </div>
          ) : (
            <div className="pose-image-container">
              <div className="pose-image-wrapper">
                <img
                  ref={imgRef}
                  src={imageUrl}
                  alt="Athlete pose"
                  className="pose-image"
                  onLoad={onImgLoad}
                  draggable={false}
                />
                {/* Skeleton overlay on result */}
                {result && showOverlay && imgDims.w > 0 && (
                  <PoseOverlay
                    keypoints={result.keypoints}
                    width={imgDims.w}
                    height={imgDims.h}
                  />
                )}
                {/* Corner badge */}
                {result && (
                  <div className="pose-image-risk-badge">
                    <RiskBadge level={result.riskLevel} />
                  </div>
                )}
              </div>

              {/* Image controls */}
              <div className="pose-image-controls">
                <span className="pose-image-name">{imageFile?.name}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {result && (
                    <button
                      className={clsx('btn btn-ghost btn-sm', showOverlay && 'btn-overlay-active')}
                      onClick={() => setShowOverlay((v) => !v)}
                    >
                      <Activity size={13} />
                      {showOverlay ? 'Hide' : 'Show'} skeleton
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm" onClick={reset}>
                    <X size={13} /> Remove
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Config */}
          <div className="pose-config-card">
            <div className="pose-config-title">Analysis Context</div>
            <div className="pose-config-fields">
              <div className="form-field">
                <label className="form-label">Athlete Name</label>
                <input
                  className="form-input"
                  value={athleteName}
                  onChange={(e) => setAthleteName(e.target.value)}
                  placeholder="Enter athlete name"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Sport</label>
                <select
                  className="form-select"
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                >
                  {SPORTS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <button
              className="btn btn-primary pose-analyse-btn"
              onClick={runAnalysis}
              disabled={!imageUrl || loading}
            >
              {loading ? (
                <><span className="btn-spinner" /> Analysing pose...</>
              ) : (
                <><Camera size={15} /> Analyse Pose</>
              )}
            </button>
          </div>

          {/* Info note */}
          <div className="pose-info-note">
            <Info size={13} />
            <span>
              For best results: use a clear full-body image with the athlete visible
              from head to feet, in their sport-specific position or movement.
            </span>
          </div>
        </div>

        {/* ── Right panel: Loading / Results ── */}
        <div className="pose-right-panel">

          {/* Empty state */}
          {!loading && !result && (
            <div className="pose-empty-state">
              <div className="pose-empty-icon">
                <Activity size={32} strokeWidth={1} />
              </div>
              <p className="pose-empty-title">No analysis yet</p>
              <p className="pose-empty-sub">
                Upload an athlete image and click Analyse Pose to generate a pose-based
                injury risk assessment.
              </p>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="pose-loading">
              <div className="pose-loading-ring">
                <div className="pose-loading-ring-inner" />
              </div>
              <div className="pose-loading-title">Analysing Athlete Pose</div>
              <div className="pose-loading-current">{STEPS[loadStep]}</div>
              <div className="pose-loading-steps">
                {STEPS.map((step, i) => (
                  <div key={step} className={clsx('pose-loading-step', i <= loadStep && 'pls-active')}>
                    {i < loadStep
                      ? <CheckCircle size={12} />
                      : i === loadStep
                      ? <span className="pls-dot pls-dot-active" />
                      : <span className="pls-dot" />
                    }
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <div className="pose-results">

              {/* Result header */}
              <div className="pose-result-header">
                <div>
                  <div className="pose-result-tag">POSE ANALYSIS COMPLETE · {result.modelVersion}</div>
                  <h2 className="pose-result-title">{result.athleteName}</h2>
                  <p className="pose-result-meta">{result.sport} · {new Date(result.analyzedAt).toLocaleString('en-GB')}</p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={runAnalysis}>
                  <RefreshCw size={13} /> Re-analyse
                </button>
              </div>

              {/* Risk score + confidence */}
              <div className="pose-score-row">
                <div className="pose-score-panel">
                  <RiskScore
                    score={result.overallRiskScore}
                    level={result.riskLevel}
                    size="sm"
                  />
                  <div className="pose-confidence">
                    <span className="label-xs">MODEL CONFIDENCE</span>
                    <span className="font-mono" style={{ fontSize: 15, fontWeight: 600 }}>
                      {(result.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="pose-summary-text">
                  <p>{result.summary}</p>
                </div>
              </div>

              {/* Joint angle table */}
              <div className="pose-section">
                <div className="pose-section-title"><Zap size={14} /> Joint Angle Analysis</div>
                <div className="pose-joint-grid">
                  {result.jointAngles.map((j) => (
                    <div key={j.joint} className={clsx('pose-joint-card', jointStatusClass(j.status))}>
                      <div className="pose-joint-name">{j.joint}</div>
                      <div className="pose-joint-angle font-mono">{j.angle}°</div>
                      <div className="pose-joint-range">
                        Normal: {j.normalRange[0]}–{j.normalRange[1]}°
                      </div>
                      <div className={clsx('pose-joint-status-label', jointStatusClass(j.status))}>
                        {j.status === 'normal' ? '✓ Normal'
                          : j.status === 'caution' ? `⚠ +${j.deviation}°`
                          : `✗ +${j.deviation}°`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Body segment findings */}
              <div className="pose-section">
                <div className="pose-section-title"><Activity size={14} /> Body Segment Findings</div>
                <div className="pose-segments">
                  {result.segments.map((seg) => (
                    <div key={seg.label} className={clsx('pose-segment', segSeverityClass(seg.severity))}>
                      <div
                        className="pose-segment-header"
                        onClick={() => setExpandedSegment(
                          expandedSegment === seg.label ? null : seg.label
                        )}
                      >
                        <div className="pose-segment-left">
                          <span className={clsx('pose-seg-dot', segSeverityClass(seg.severity))} />
                          <div>
                            <span className="pose-segment-label">{seg.label}</span>
                            <span className="pose-segment-finding">{seg.finding}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className={clsx('pose-seg-badge', segSeverityClass(seg.severity))}>
                            {seg.severity}
                          </span>
                          {expandedSegment === seg.label
                            ? <ChevronUp size={14} />
                            : <ChevronDown size={14} />
                          }
                        </div>
                      </div>
                      {expandedSegment === seg.label && (
                        <div className="pose-segment-details">{seg.details}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk factors */}
              <div className="pose-two-col">
                <div className="pose-section">
                  <div className="pose-section-title">Risk Drivers</div>
                  {result.riskFactors.length > 0 ? (
                    <div className="risk-factors-list">
                      {result.riskFactors.map((f) => (
                        <RiskFactorItem key={f.name} factor={f} />
                      ))}
                    </div>
                  ) : (
                    <p className="pose-empty-factors">No significant risk factors detected.</p>
                  )}
                </div>

                <div className="pose-section">
                  <div className="pose-section-title">Protective Factors</div>
                  {result.protectiveFactors.length > 0 ? (
                    <div className="risk-factors-list">
                      {result.protectiveFactors.map((f) => (
                        <RiskFactorItem key={f.name} factor={f} />
                      ))}
                    </div>
                  ) : (
                    <p className="pose-empty-factors">No protective factors identified.</p>
                  )}
                </div>
              </div>

              {/* Recommendations */}
              <div className="pose-section">
                <div className="pose-section-title">Recommended Interventions</div>
                <ul className="pose-rec-list">
                  {result.recommendations.map((r, i) => (
                    <li key={i}>
                      <span className="rec-bullet" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* What to monitor */}
              <div className="pose-section">
                <div className="pose-section-title">What to Monitor</div>
                <ul className="pose-monitor-list">
                  {result.whatToMonitor.map((m, i) => (
                    <li key={i}><Activity size={12} /><span>{m}</span></li>
                  ))}
                </ul>
              </div>

              {/* Disclaimer */}
              <div className="result-disclaimer">
                <AlertTriangle size={13} />
                <span>{result.disclaimer}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
