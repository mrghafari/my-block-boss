(function() {
    function generateUUID() {
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, function(c) {
            return (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16);
        });
    }
    
    if (typeof crypto.randomUUID === 'undefined') {
        crypto.randomUUID = generateUUID;
    }
    
    if (typeof crypto.getRandomValues === 'undefined') {
        crypto.getRandomValues = function(array) {
            for (var i = 0; i < array.length; i++) {
                array[i] = Math.floor(Math.random() * 256);
            }
            return array;
        };
    }
})();
