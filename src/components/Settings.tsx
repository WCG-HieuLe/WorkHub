import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const shades = [100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const bgFamilies = ['neutral', 'zinc', 'stone', 'gray', 'slate', 'sky', 'teal', 'amber'];
const accentFamilies = ['indigo', 'blue', 'cyan', 'violet', 'purple', 'emerald', 'lime', 'amber'];

const colorPalettes: Record<string, Record<number, string>> = {
    zinc: { 100: '#f4f4f5', 200: '#e4e4e7', 300: '#d4d4d8', 400: '#a1a1aa', 500: '#71717a', 600: '#52525b', 700: '#3f3f46', 800: '#27272a', 900: '#18181b', 950: '#09090b' },
    slate: { 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a', 950: '#020617' },
    stone: { 100: '#f5f5f4', 200: '#e7e5e4', 300: '#d6d3d1', 400: '#a8a29e', 500: '#78716c', 600: '#57534e', 700: '#44403c', 800: '#292524', 900: '#1c1917', 950: '#0c0a09' },
    gray: { 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db', 400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151', 800: '#1f2937', 900: '#111827', 950: '#030712' },
    neutral: { 100: '#f5f5f5', 200: '#e5e5e5', 300: '#d4d4d4', 400: '#a3a3a3', 500: '#737373', 600: '#525252', 700: '#404040', 800: '#262626', 900: '#171717', 950: '#0a0a0a' },
    violet: { 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6', 900: '#4c1d95', 950: '#2e1065' },
    purple: { 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe', 400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce', 800: '#6b21a8', 900: '#581c87', 950: '#3b0764' },
    fuchsia: { 100: '#fae8ff', 200: '#f5d0fe', 300: '#f0abfc', 400: '#e879f9', 500: '#d946ef', 600: '#c026d3', 700: '#a21caf', 800: '#86198f', 900: '#701a75', 950: '#4a044e' },
    pink: { 100: '#fce7f3', 200: '#fbcfe8', 300: '#f9a8d4', 400: '#f472b6', 500: '#ec4899', 600: '#db2777', 700: '#be185d', 800: '#9d174d', 900: '#831843', 950: '#500724' },
    blue: { 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a', 950: '#172554' },
    sky: { 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc', 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1', 800: '#075985', 900: '#0c4a6e', 950: '#082f49' },
    cyan: { 100: '#cffafe', 200: '#a5f3fc', 300: '#67e8f9', 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2', 700: '#0e7490', 800: '#155e75', 900: '#164e63', 950: '#083344' },
    teal: { 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 800: '#115e59', 900: '#134e4a', 950: '#042f2e' },
    emerald: { 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b', 950: '#022c22' },
    lime: { 100: '#f7fee7', 200: '#ecfccb', 300: '#d9f99d', 400: '#a3e635', 500: '#84cc16', 600: '#65a30d', 700: '#4d7c0f', 800: '#3f6212', 900: '#365314', 950: '#1a2e05' },
    amber: { 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f', 950: '#451a03' },
    orange: { 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12', 950: '#431407' },
    rose: { 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 800: '#9f1239', 900: '#881337', 950: '#4c0519' },
    indigo: { 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81', 950: '#1e1b4b' }
};

const getCurrentFamily = (families: string[], currentColor?: string) => {
    if (!currentColor) return families[0];
    const found = families.find(f =>
        Object.values(colorPalettes[f]).some(hex => hex.toLowerCase() === currentColor.toLowerCase())
    );
    return found || families[0];
};

const ColorFamilyPicker = ({ families, active, onChange, label }: { families: string[], active: string, onChange: (f: string) => void, label: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {families.map(f => (
                <button key={f} onClick={() => onChange(f)} style={{
                    padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s',
                    background: active === f ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                    color: active === f ? '#fff' : 'var(--text-secondary)',
                    border: '1px solid', borderColor: active === f ? 'var(--accent-primary)' : 'var(--border)'
                }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
            ))}
        </div>
    </div>
);

const ShadeRow = ({ family, label, type, activeHex, onSelect }: { family: string, label: string, type: any, activeHex?: string, onSelect: (type: any, hex: string) => void }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{label}</span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
            {shades.map(s => {
                const hex = colorPalettes[family][s];
                const isActive = activeHex?.toLowerCase() === hex.toLowerCase();
                return (
                    <button key={s} onClick={() => onSelect(type, hex)} style={{
                        flex: 1, height: '24px', borderRadius: '4px', cursor: 'pointer', border: 'none',
                        background: hex, transition: 'all 0.2s', position: 'relative',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        {isActive && (
                            <div style={{
                                width: '10px', height: '10px', borderRadius: '50%', background: '#fff',
                                boxShadow: '0 0 4px rgba(0,0,0,0.5)'
                            }} />
                        )}
                    </button>
                );
            })}
        </div>
    </div>
);

const EffectSlider = ({ label, value, min, max, unit = "", onChange }: { label: string, value: string | number, min: number, max: number, unit?: string, onChange: (v: string) => void }) => {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{label}</label>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>{localValue}{unit}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                value={localValue}
                onInput={(e) => {
                    const val = (e.target as HTMLInputElement).value;
                    setLocalValue(val);
                    onChange(val);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    accentColor: 'var(--accent-primary)',
                    height: '32px',
                    cursor: 'pointer',
                    background: 'transparent',
                    margin: 0
                }}
            />
        </div>
    );
};

export const Settings: React.FC = () => {
    const {
        customColors,
        setCustomColor,
        resetCustomColors
    } = useTheme();

    const [bgFamily, setBgFamily] = useState<string>(() => {
        const saved = localStorage.getItem('settings-bg-family');
        if (saved && bgFamilies.includes(saved)) return saved;
        return getCurrentFamily(bgFamilies, customColors.bgPrimary);
    });
    const [accentFamily, setAccentFamily] = useState<string>(() => {
        const saved = localStorage.getItem('settings-accent-family');
        if (saved && accentFamilies.includes(saved)) return saved;
        return getCurrentFamily(accentFamilies, customColors.accentPrimary);
    });

    // Save family choices to localStorage when they change
    useEffect(() => {
        localStorage.setItem('settings-bg-family', bgFamily);
    }, [bgFamily]);

    useEffect(() => {
        localStorage.setItem('settings-accent-family', accentFamily);
    }, [accentFamily]);

    const handleShadeSelect = (type: 'bg' | 'accent' | 'sidebar' | 'main' | 'component' | 'item', hex: string) => {
        if (type === 'bg') {
            setCustomColor('bgPrimary', hex);
            const family = bgFamily;
            const shadeValue = Object.keys(colorPalettes[family]).find(k => colorPalettes[family][parseInt(k)] === hex);
            if (shadeValue) {
                const shade = parseInt(shadeValue);
                const secondaryShade = shade > 500 ? shade - 100 : shade + 100;
                const cardColor = colorPalettes[family][secondaryShade];
                setCustomColor('bgCard', cardColor);
                setCustomColor('bgHeader', cardColor);
                setCustomColor('bgHover', colorPalettes[family][shade > 500 ? shade - 200 : shade + 200]);
            }
        } else if (type === 'sidebar') {
            setCustomColor('bgSidebar', hex);
        } else if (type === 'main') {
            setCustomColor('bgMainLayout', hex);
        } else if (type === 'component') {
            setCustomColor('bgComponent', hex);
        } else if (type === 'item') {
            setCustomColor('bgItem', hex);
        } else {
            setCustomColor('accentPrimary', hex);
            const shadeValue = Object.keys(colorPalettes[accentFamily]).find(k => colorPalettes[accentFamily][parseInt(k)] === hex);
            if (shadeValue) {
                const shade = parseInt(shadeValue);
                const secondaryShade = shade > 500 ? shade - 200 : shade + 200;
                setCustomColor('accentSecondary', colorPalettes[accentFamily][secondaryShade]);
            }
        }
    };

    return (
        <div className="settings-content-wrapper" style={{ padding: '0.25rem 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {/* 1. Theme Selection Section */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '1rem'
                }}>
                    <div className="settings-card" style={{ background: 'var(--bg-card)', padding: '0.75rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '1.1rem' }}>🌓</span>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Background & Layout</h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <ColorFamilyPicker families={bgFamilies} active={bgFamily} onChange={setBgFamily} label="Background Palette" />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                                <ShadeRow family={bgFamily} label="Sidebar" type="sidebar" activeHex={customColors.bgSidebar} onSelect={handleShadeSelect} />
                                <ShadeRow family={bgFamily} label="Main Layout" type="main" activeHex={customColors.bgMainLayout} onSelect={handleShadeSelect} />
                                <ShadeRow family={bgFamily} label="Component" type="component" activeHex={customColors.bgComponent} onSelect={handleShadeSelect} />
                                <ShadeRow family={bgFamily} label="Item" type="item" activeHex={customColors.bgItem} onSelect={handleShadeSelect} />
                            </div>
                        </div>
                    </div>

                    <div className="settings-card" style={{ background: 'var(--bg-card)', padding: '0.75rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '1.1rem' }}>✨</span>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Accent Style</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <ColorFamilyPicker families={accentFamilies} active={accentFamily} onChange={setAccentFamily} label="Accent Palette" />
                            <div style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                                <ShadeRow family={accentFamily} label="Accent Color" type="accent" activeHex={customColors.accentPrimary} onSelect={handleShadeSelect} />
                            </div>

                            <div style={{ background: 'var(--glass)', backdropFilter: 'blur(10px)', padding: '0.5rem', borderRadius: '12px', border: '1px solid var(--border)', marginTop: '0.25rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-primary)' }} />
                                    <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Preview Theme</span>
                                    <button style={{ marginLeft: 'auto', background: 'var(--accent-primary)', border: 'none', color: '#fff', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px' }}>Button</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Visual Effects & Actions */}
                <div className="settings-card" style={{ background: 'var(--bg-card)', padding: '0.75rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.1rem' }}>🧪</span>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Visual Effects</h3>
                        </div>
                        <button onClick={resetCustomColors} style={{
                            padding: '3px 10px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600, transition: 'all 0.2s'
                        }}>Reset All</button>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '0.75rem',
                        padding: '0.5rem',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '16px'
                    }}>
                        <EffectSlider label="Corner Radius" value={parseInt(customColors.borderRadius || '20')} min={0} max={40} unit="px" onChange={(v) => setCustomColor('borderRadius', v)} />
                        <EffectSlider label="Glass Opacity" value={Math.round(parseFloat(customColors.glassOpacity || '0.85') * 100)} min={0} max={100} unit="%" onChange={(v) => setCustomColor('glassOpacity', (parseInt(v) / 100).toString())} />
                        <EffectSlider label="Blur Intensity" value={parseInt(customColors.glassBlur || '20')} min={0} max={50} unit="px" onChange={(v) => setCustomColor('glassBlur', v)} />
                        <EffectSlider label="Border Brightness" value={Math.round(parseFloat(customColors.borderOpacity || '0.1') * 100)} min={0} max={100} unit="%" onChange={(v) => setCustomColor('borderOpacity', (parseInt(v) / 100).toString())} />
                    </div>
                </div>

            </div>
        </div>
    );
};
