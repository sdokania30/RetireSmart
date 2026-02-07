import { useMemo } from 'react';
import { GlobalSettings, ExpenseBucket, Milestone } from '../types';

export const useScenarioValidation = (
    settings: GlobalSettings,
    expenses: ExpenseBucket[],
    milestones: Milestone[],
    isZeroMode: boolean
) => {
    return useMemo(() => {
        const errors: Record<string, string> = {};

        // Global Age Check
        if (settings.currentAge < 18 || settings.currentAge > 100) {
            errors.currentAge = "Age must be between 18 and 100";
        }
        if (settings.retirementAge < settings.currentAge) {
            errors.retirementAge = "Must be greater than or equal to Current Age";
        }
        if (settings.lifeExpectancy <= settings.retirementAge) {
            errors.lifeExpectancy = "Must be greater than Retirement Age";
        }

        // Make ROI check conditional on Zero Mode (since Zero Mode forces 0 ROI, logical validation might fail if checking limits strictly)
        if (!isZeroMode) {
            if (settings.postRetirementROI < 0 || settings.postRetirementROI > 30) {
                errors.postRetirementROI = "Realistic ROI is 0-30%";
            }
        }

        // Expense Logic
        let maxExpenseAge = 0;

        expenses.forEach(e => {
            if (e.endAge > maxExpenseAge) maxExpenseAge = e.endAge;

            if (e.endAge > settings.lifeExpectancy) {
                errors[`exp_end_${e.id}`] = `Exceeds Life Expectancy (${settings.lifeExpectancy})`;
            }
            if (e.currentMonthlyCost < 0) {
                errors[`exp_cost_${e.id}`] = "Must be positive";
            }
        });

        if (maxExpenseAge > settings.lifeExpectancy) {
            errors.lifeExpectancy = `Must cover all expenses (max: ${maxExpenseAge})`;
        }

        // Milestone Logic
        milestones.forEach(m => {
            if (settings.currentAge + m.yearOffset > settings.lifeExpectancy) {
                errors[`ms_year_${m.id}`] = "Exceeds Life Expectancy";
            }
            if (m.currentCost < 0) {
                errors[`ms_cost_${m.id}`] = "Must be positive";
            }
        });

        const hasCriticalErrors = Object.keys(errors).some(k =>
            ['currentAge', 'retirementAge', 'lifeExpectancy', 'postRetirementROI'].includes(k)
        );

        return { errors, hasCriticalErrors };
    }, [settings, expenses, milestones, isZeroMode]);
};
