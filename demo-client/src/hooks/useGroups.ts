import { useEffect, useState } from 'react';
import { getSocket } from '../socket';
import { Group } from '../types';

export const useGroups = () => {
    const [groups, setGroups] = useState<Array<{ label: string; value: string }>>([]);
    const socket = getSocket();

    useEffect(() => {
        const onGroupList = (data: Group[]) => {
            setGroups((data ?? []).map((group) => ({ label: group.subject, value: group.id })));
        };

        socket?.on('groups', onGroupList);

        return () => {
            socket?.off('groups', onGroupList);
        };
    }, [socket]);

    return groups;
};
