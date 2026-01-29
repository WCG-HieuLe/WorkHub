import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeBackground = 'zinc' | 'slate' | 'stone' | 'gray' | 'neutral';
export type ThemeAccent = 'violet' | 'blue' | 'indigo' | 'emerald' | 'orange' | 'rose';

export interface CustomColors {
    bgPrimary?: string;
    bgSecondary?: string;
    bgCard?: string;
    bgHover?: string;
    bgHeader?: string;
    bgSidebar?: string;
    bgMainLayout?: string;
    bgComponent?: string;
    bgItem?: string;
    textPrimary?: string;
    textSecondary?: string;
    accentPrimary?: string;
    accentSecondary?: string;
    borderRadius?: string;
    glassOpacity?: string;
    glassBlur?: string;
    borderOpacity?: string;
}

interface ThemeContextType {
    background: ThemeBackground;
    accent: ThemeAccent;
    customColors: CustomColors;
    setBackground: (bg: ThemeBackground) => void;
    setAccent: (accent: ThemeAccent) => void;
    setCustomColor: (key: keyof CustomColors, value: string | undefined) => void;
    resetCustomColors: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialize state from local storage or defaults
    const [background, setBackgroundState] = useState<ThemeBackground>(() => {
        const saved = localStorage.getItem('theme-bg');
        return (saved as ThemeBackground) || 'zinc';
    });

    const [accent, setAccentState] = useState<ThemeAccent>(() => {
        const saved = localStorage.getItem('theme-accent');
        return (saved as ThemeAccent) || 'violet';
    });

    const [customColors, setCustomColors] = useState<CustomColors>(() => {
        const saved = localStorage.getItem('custom-colors');
        return saved ? JSON.parse(saved) : {};
    });

    // Update DOM attributes and persistence when state changes
    useEffect(() => {
        localStorage.setItem('theme-bg', background);
        document.documentElement.setAttribute('data-bg', background);
    }, [background]);

    useEffect(() => {
        localStorage.setItem('theme-accent', accent);
        document.documentElement.setAttribute('data-accent', accent);
    }, [accent]);

    // Apply custom colors as CSS variables
    useEffect(() => {
        localStorage.setItem('custom-colors', JSON.stringify(customColors));

        const root = document.documentElement;
        const colorMap: Record<keyof CustomColors, string> = {
            bgPrimary: '--bg-primary',
            bgSecondary: '--bg-secondary',
            bgCard: '--bg-card',
            bgHover: '--bg-hover',
            bgHeader: '--bg-header',
            bgSidebar: '--sidebar-bg',
            bgMainLayout: '--main-layout-bg',
            bgComponent: '--component-bg',
            bgItem: '--item-bg',
            textPrimary: '--text-primary',
            textSecondary: '--text-secondary',
            accentPrimary: '--accent-primary',
            accentSecondary: '--accent-secondary',
            borderRadius: '--radius-full',
            glassOpacity: '--glass-opacity',
            glassBlur: '--glass-blur',
            borderOpacity: '--border-opacity'
        };

        (Object.keys(colorMap) as Array<keyof CustomColors>).forEach(key => {
            if (customColors[key] !== undefined && customColors[key] !== null) {
                let value = customColors[key]!;
                // Add units if missing for specific keys
                if (key === 'borderRadius' && !value.endsWith('px') && !value.endsWith('rem')) value += 'px';
                if (key === 'glassBlur' && !value.endsWith('px')) value += 'px';

                root.style.setProperty(colorMap[key], value);
            } else {
                root.style.removeProperty(colorMap[key]);
            }
        });
    }, [customColors]);

    const setBackground = (bg: ThemeBackground) => {
        setBackgroundState(bg);
    };

    const setAccent = (newAccent: ThemeAccent) => {
        setAccentState(newAccent);
    };

    const setCustomColor = (key: keyof CustomColors, value: string | undefined) => {
        setCustomColors(prev => ({ ...prev, [key]: value }));
    };

    const resetCustomColors = () => {
        setCustomColors({});
    };

    return (
        <ThemeContext.Provider value={{
            background,
            accent,
            customColors,
            setBackground,
            setAccent,
            setCustomColor,
            resetCustomColors
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
