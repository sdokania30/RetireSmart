import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface InputFieldProps {
    label: string;
    value: number;
    onChange: (val: string) => void;
    error?: string;
    tooltip?: string;
    className?: string;
    step?: string;
    isLakhs?: boolean;
    disabled?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({
    label,
    value,
    onChange,
    error,
    tooltip,
    className,
    step = "1",
    isLakhs = false,
    disabled = false
}) => {

    // If isLakhs is true, we display value / 100000
    const displayValue = isLakhs ? (value / 100000) : value;
    const [lakhsInput, setLakhsInput] = useState<string>('');

    useEffect(() => {
        if (!isLakhs) return;
        const next = String(displayValue);
        setLakhsInput(next);
    }, [isLakhs, displayValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (isLakhs) {
            // Keep text input permissive for partial numeric states during typing.
            if (!/^-?\d*\.?\d*$/.test(val)) return;
            setLakhsInput(val);
            // Allow partial input without forcing a numeric value
            if (val === '' || val === '.' || val === '-' || val === '-.') return;
            const num = parseFloat(val);
            if (!isNaN(num)) {
                // Convert back to absolute rupees
                // Use Math.round to avoid float precision issues like 0.3 * 100000 = 30000.0000004
                onChange((Math.round(num * 100000)).toString());
            }
        } else {
            onChange(val);
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        if (!isLakhs) return;
        const val = e.target.value;
        if (val === '' || val === '.' || val === '-' || val === '-.') {
            setLakhsInput('');
            onChange('0');
            return;
        }
        const num = parseFloat(val);
        if (!isNaN(num)) {
            onChange((Math.round(num * 100000)).toString());
        }
    };

    return (
        <div className={className}>
            <div className="flex justify-between items-baseline mb-1">
                <label className={`flex items-center text-xs font-medium ${disabled ? 'text-slate-400' : 'text-slate-500'}`}>
                    {label} {isLakhs && <span className="text-[10px] text-slate-400 font-normal ml-1">(₹ Lakhs)</span>}
                    {tooltip && <Tooltip text={tooltip} />}
                </label>
            </div>
            <div className="relative">
                <input
                    type={isLakhs ? "text" : "number"}
                    inputMode={isLakhs ? "decimal" : undefined}
                    pattern={isLakhs ? "^-?[0-9]*[.]?[0-9]*$" : undefined}
                    step={isLakhs ? undefined : step}
                    value={isLakhs ? lakhsInput : displayValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="0"
                    disabled={disabled}
                    className={`w-full p-2.5 border rounded-lg text-sm focus:ring-2 outline-none transition-all 
            ${disabled ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : ''}
            ${error ? 'border-red-400 focus:ring-red-200 bg-red-50' : !disabled ? 'border-slate-200 focus:ring-brand-500' : ''}`}
                />
                {error && !disabled && <AlertCircle className="absolute right-2 top-2.5 text-red-500 w-4 h-4" />}
            </div>
            {error && !disabled && <span className="text-[10px] text-red-600 mt-1 block">{error}</span>}
        </div>
    );
};
