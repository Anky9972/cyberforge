import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Map } from 'lucide-react';

interface TourStep {
    target: string; // ID or class name
    title: string;
    description: string;
    position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const TOUR_STEPS: TourStep[] = [
    {
        target: 'body',
        title: 'Welcome to CyberForge',
        description: 'Let us show you how to master the art of automated fuzzing and security analysis.',
        position: 'center'
    },
    {
        target: '', // We'll just show centered modals for simplicity or bind to IDs if we added them
        title: 'Crash Deduplication',
        description: 'We automatically group similar crashes so you can focus on unique bugs, not duplicates.',
        position: 'center'
    },
    {
        target: '',
        title: 'Interactive Collaboration',
        description: 'Click "Discuss" on any vulnerability to assign teammates and leave comments.',
        position: 'center'
    },
    {
        target: '',
        title: 'Customization',
        description: 'Use the light/dark toggle and settings icon to personalize your dashboard workflow.',
        position: 'center'
    }
];

export const OnboardingTour: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        // Show tour on first visit
        const hasSeenTour = localStorage.getItem('hasSeenTour');
        if (!hasSeenTour) {
            setIsOpen(true);
        }
    }, []);

    const handleNext = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleClose();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem('hasSeenTour', 'true');
    };

    if (!isOpen) return null;

    const step = TOUR_STEPS[currentStep];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-gray-900 border border-blue-500/50 rounded-2xl p-8 max-w-md w-full shadow-2xl relative"
                >
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 text-gray-500 hover:text-white"
                    >
                        <X size={20} />
                    </button>

                    <div className="mb-6 flex justify-center">
                        <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center">
                            <Map className="text-blue-400" size={32} />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-center text-white mb-2">{step.title}</h2>
                    <p className="text-gray-400 text-center mb-8">{step.description}</p>

                    <div className="flex justify-between items-center">
                        <div className="flex gap-1">
                            {TOUR_STEPS.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`w-2 h-2 rounded-full ${idx === currentStep ? 'bg-blue-500' : 'bg-gray-700'}`}
                                />
                            ))}
                        </div>

                        <div className="flex gap-3">
                            {currentStep > 0 && (
                                <button
                                    onClick={handlePrev}
                                    className="px-4 py-2 text-gray-400 hover:text-white font-medium"
                                >
                                    Back
                                </button>
                            )}
                            <button
                                onClick={handleNext}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold flex items-center gap-2"
                            >
                                {currentStep === TOUR_STEPS.length - 1 ? 'Get Started' : 'Next'}
                                {currentStep < TOUR_STEPS.length - 1 && <ChevronRight size={16} />}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
