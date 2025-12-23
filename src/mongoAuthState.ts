import {
    type AuthenticationCreds,
    type SignalDataTypeMap,
    initAuthCreds,
    WAProto as proto,
} from '@fadzzzslebew/baileys';

const BufferJSON = {
    replacer: (_k: string, value: any) => {
        if (Buffer.isBuffer(value) || value instanceof Uint8Array || value?.type === 'Buffer') {
            return {
                type: 'Buffer',
                data: Buffer.from(value?.data || value).toString('base64'),
            };
        }
        return value;
    },

    reviver: (_: string, value: any) => {
        if (typeof value === 'object' && !!value && (value.buffer === true || value.type === 'Buffer')) {
            const val = value.data || value.value;
            return typeof val === 'string' ? Buffer.from(val, 'base64') : Buffer.from(val || []);
        }
        return value;
    },
};

const useMongoDBAuthState = async (collection: any) => {
    const writeData = (data: any, id: string) => {
        const informationToStore = JSON.parse(JSON.stringify(data, BufferJSON.replacer));
        const update = { $set: { ...informationToStore } };
        return collection.updateOne({ _id: id }, update, { upsert: true });
    };

    const readData = async (id: string) => {
        try {
            const data = JSON.stringify(await collection.findOne({ _id: id }));
            return JSON.parse(data, BufferJSON.reviver);
        } catch (error) {
            return null;
        }
    };

    const removeData = async (id: string) => {
        try {
            await collection.deleteOne({ _id: id });
        } catch (_a) {}
    };

    const creds: AuthenticationCreds = (await readData('creds')) || initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type: keyof SignalDataTypeMap, ids: string[]) => {
                    const data: { [id: string]: any } = {};
                    await Promise.all(
                        ids.map(async (id) => {
                            let value = await readData(`${type}-${id}`);
                            if (type === 'app-state-sync-key' && value) {
                                value = proto.Message.AppStateSyncKeyData.fromObject(value);
                            }
                            data[id] = value;
                        })
                    );
                    return data;
                },
                set: async (data: any) => {
                    const tasks: Promise<any>[] = [];
                    for (const category of Object.keys(data)) {
                        for (const id of Object.keys(data[category])) {
                            const value = data[category][id];
                            const key = `${category}-${id}`;
                            tasks.push(value ? writeData(value, key) : removeData(key));
                        }
                    }
                    await Promise.all(tasks);
                },
            },
        },
        saveCreds: () => {
            return writeData(creds, 'creds');
        },
    };
};

export default useMongoDBAuthState;
