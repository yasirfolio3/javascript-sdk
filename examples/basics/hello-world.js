(function() {
    const userId = '1';
    const optimizely = window.optimizelySdk.createInstance({
        sdkKey: window.OPTY_SDK_KEY,
    });

    optimizely.onReady().then(() => {
        if (optimizely.isFeatureEnabled(window.FEATURE_KEY, userId)) {
            document.getElementById('title').style.color = "red";
        }
    });
})();
