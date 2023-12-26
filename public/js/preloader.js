function onReady(callback) {
    var intervalId = window.setInterval(function () {
        if (document.getElementsByTagName('body')[0] !== undefined) {
            window.clearInterval(intervalId);
            callback.call(this);
        }
    }, 3000);
}

function setVisible(selector, visible) {
    document.querySelector(selector).style.display = visible ? 'block' : 'none';
}

// onReady(function () {
//     setVisible('#loader-wrapper', false);
// });


// window.addEventListener("unload", function() {
//     console.log('nice');
//     setVisible('#loader-wrapper', true);
// });

window.addEventListener("beforeunload", (event) => {
    document.querySelector('#loader-wrapper').style.display = 'block';
  });