//download function from ourcodeworld.com
function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

//remove ad
function removeAd() {
    setTimeout(() => {
        let divy = document.querySelectorAll('div')
        divy[divy.length - 1].remove()
        divy[divy.length - 2].remove()
    }, 1000);
}

//removeAd()