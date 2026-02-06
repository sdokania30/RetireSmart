import React from 'react';
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (isLakhs) {
            // Allow user to type decimal points for lakhs
            const num = parseFloat(val);
            if (!isNaN(num)) {
                // Convert back to absolute rupees
                // Use Math.round to avoid float precision issues like 0.3 * 100000 = 30000.0000004
                onChange((Math.round(num * 100000)).toString());
            } else {
                onChange("0");
            }
        } else {
            onChange(val);
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
                    type="number"
                    step={isLakhs ? "0.01" : step}
                    value={displayValue === 0 ? '' : displayValue}
                    onChange={handleChange}
                    placeholder="0"
                    disabled={disabled}
                    className={`w-full p-2 border rounded text-sm focus:ring-2 outline-none transition-all 
            ${disabled ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : ''}
            ${error ? 'border-red-400 focus:ring-red-200 bg-red-50' : !disabled ? 'border-slate-200 focus:ring-brand-500' : ''}`}
                />
                {error && !disabled && <AlertCircle className="absolute right-2 top-2.5 text-red-500 w-4 h-4" />}
            </div>
            {error && !disabled && <span className="text-[10px] text-red-600 mt-1 block">{error}</span>}
        </div>
    );
};
