export const encodeFile = (file: File): File => new File([file], encodeURIComponent(file.name), { type: file.type });

export const getCurrentLocation = async () => {
    try {
        const position: any = await new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 60_000,
                maximumAge: 0,
            });
        });

        const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
        };

        return location;
    } catch (err: any) {
        if (err.code === 1) {
            throw Error('Location permission denied');
        } else if (err.code === 2) {
            throw Error('Location unavailable');
        } else if (err.code === 3) {
            throw Error('Location request timed out');
        } else {
            throw Error(err instanceof Error ? err.message : 'Failed to send location');
        }
    }
};
