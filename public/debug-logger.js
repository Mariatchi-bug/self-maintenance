
(function () {
    var errorContainer = document.createElement('div');
    errorContainer.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: white; color: red; z-index: 9999; overflow: auto; padding: 20px; font-family: monospace; display: none;';
    document.body.appendChild(errorContainer);

    function showError(msg) {
        errorContainer.style.display = 'block';
        var p = document.createElement('p');
        p.textContent = msg;
        errorContainer.appendChild(p);
    }

    window.onerror = function (msg, url, lineNo, columnNo, error) {
        var string = msg.toLowerCase();
        var substring = "script error";
        if (string.indexOf(substring) > -1) {
            showError('Script Error: See Browser Console for Detail');
        } else {
            var message = [
                'Message: ' + msg,
                'URL: ' + url,
                'Line: ' + lineNo,
                'Column: ' + columnNo,
                'Error object: ' + JSON.stringify(error)
            ].join(' - ');
            showError(message);
        }
        return false;
    };

    window.addEventListener('unhandledrejection', function (event) {
        showError('Unhandled Rejection: ' + event.reason);
    });
})();
