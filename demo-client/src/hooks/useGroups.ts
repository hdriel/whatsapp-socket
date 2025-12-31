import { useEffect, useState } from 'react';
import { getSocket } from '../socket';

export const useGroups = () => {
    const [groups, setGroups] = useState<Array<{ label: string; value: string }>>([]);
    const socket = getSocket();

    useEffect(() => {
        const onGroupList = (data: any[]) => {
            debugger;
            setGroups(data);
        };

        socket?.on('groups', onGroupList);

        return () => {
            socket?.off('groups', onGroupList);
        };
    }, [socket]);

    return groups;
};
