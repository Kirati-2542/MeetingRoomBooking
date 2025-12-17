import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type AlertType = 'success' | 'error' | 'info';

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: AlertType;
}

export const AlertModal: React.FC<AlertModalProps> = ({
    isOpen,
    onClose,
    title,
    message,
    type = 'success'
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-12 h-12 text-emerald-500" />;
            case 'error':
                return <AlertCircle className="w-12 h-12 text-red-500" />;
            default:
                return <Info className="w-12 h-12 text-blue-500" />;
        }
    };

    const getButtonClass = () => {
        switch (type) {
            case 'success':
                return 'bg-gradient-to-r from-emerald-400 to-teal-500 shadow-emerald-200';
            case 'error':
                return 'bg-gradient-to-r from-red-400 to-pink-500 shadow-red-200';
            default:
                return 'bg-gradient-to-r from-blue-400 to-indigo-500 shadow-blue-200';
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all scale-100 animate-scale-in relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8 text-center">
                    <div className="flex justify-center mb-6">
                        <div className={`p-4 rounded-full bg-opacity-10 ${type === 'success' ? 'bg-emerald-100' : type === 'error' ? 'bg-red-100' : 'bg-blue-100'}`}>
                            {getIcon()}
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {title}
                    </h3>

                    <p className="text-gray-500 mb-8 leading-relaxed">
                        {message}
                    </p>

                    <button
                        onClick={onClose}
                        className={`w-full py-3 px-6 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 ${getButtonClass()}`}
                    >
                        ตกลง
                    </button>
                </div>
            </div>
        </div>
    );
};
