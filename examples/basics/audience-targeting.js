(function() {
    const listOfUsers = [
        { id: '1', city: 'Austin' },
        { id: '2', city: 'San Francisco' },
        { id: '3', city: 'New York' },
    ];

    const optimizely = window.optimizelySdk.createInstance({
        sdkKey: window.OPTY_SDK_KEY,
    });

    optimizely.onReady().then(() => {
        listOfUsers.forEach(user => {
            const isEnabled = optimizely.isFeatureEnabled(window.FEATURE_KEY, user.id, user)
            document.getElementById(`user-${user.id}-enabled`).innerHTML = isEnabled ? "✅" : "❌";
        });
    });
})();
