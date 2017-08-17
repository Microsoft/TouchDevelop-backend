$.ready(function () {
    var url = "https://uhf.microsoft.com/" + navigator.language + "/shell/api/mscc?sitename=touchdevelopweb&domain=touchdevelop.com&mscc_eudomain=true";
    console.log('mscc url:' + url);
    $.getScript(url, function (info) {
        try {
            if (!info || !info.IsConsentRequired) return undefined;

            info.Css.forEach(css => {
                var link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = css;
                document.head.appendChild(link);
            })

            var d = $('<div class="mscc"></div>');
            d.html(info.Markup);
            $(document.body).append(d);
            info.Js.forEach(function (js) { $.load(js) });
        } catch (e) {
            console.error(e);
        }
    });
});