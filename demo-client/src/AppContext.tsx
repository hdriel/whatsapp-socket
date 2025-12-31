import React, { createContext, useContext, useState, ReactNode } from 'react';

export enum ActionType {
    PRIVATE,
    GROUP,
}

interface AppContextType {
    actionType: ActionType;
    setActionType: (type: ActionType) => void;
    groupOption: { label: string; value: string } | null;
    setGroupOption: (option: { label: string; value: string } | null) => void;
    messageToPhone: string;
    setMessageToPhone: (message: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [actionType, setActionType] = useState(ActionType.PRIVATE);
    const [groupOption, setGroupOption] = useState<{ label: string; value: string } | null>(null);
    const [messageToPhone, setMessageToPhone] = useState('');

    return (
        <AppContext.Provider
            value={{
                actionType,
                setActionType,
                groupOption,
                setGroupOption,
                messageToPhone,
                setMessageToPhone,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
