/// <reference path='../typings/node/node.d.ts' />

'use strict';

import * as td from 'td';
import * as assert from 'assert';

type JsonObject = td.JsonObject;
type JsonBuilder = td.JsonBuilder;

var clone = td.clone;



var expandInfo: td.Action1<JsonBuilder>;



export async function formatAsync(templ: string, pubdata: JsonBuilder) : Promise<string>
{
    if (pubdata["time"] != null) {
        pubdata["timems"] = pubdata["time"] * 1000;
        pubdata["humantime"] = humanTime(new Date(pubdata["timems"]));
    }

    let targets = {}
    let bodies = {}
    templ = td.replaceFn(templ, /<!--\s*SECTION\s+(\S+)\s+(\S+)\s*-->([^]*?)<!--\s*END\s*-->/g, (elt: string[]) => {
        let result: string;
        let name = elt[1];
        targets[name] = elt[2];
        bodies[name] = elt[3];
        result = "";
        return result;
    });
    let body = pubdata["body"].replace(/<div class='md-para'>\s*<\/div>/g, "");
    let s = body.replace(/^\s*<div[^<>]*md-tutorial[^<>]*>/g, "");
    if (s != body) {
        body = s.replace(/<\/div>\s*$/g, "");
    }
    body = body.replace(/<div[^<>]md-tutorial[^<>]*>\s*<\/div>/g, "");
    let sects = body.split("<hr ");
    if (sects.length > 1 && sects[0].trim(" \t\n") == "") {
        sects.splice(0, 1);
    }
    else {
        let sname = "main";
        if (sects.length == 1) {
            sname = "full";
        }
        sects[0] = "data-name='" + sname + "' data-arguments='' />" + sects[0];
    }
    let sinks = {};
    for (let s2 of sects) {
        let coll = (/[^>]*data-name='([^'"<>]*)' data-arguments='([^'"<>]*)'[^>]*>([^]*)/.exec(s2) || []);
        let sectjs = {};
        let name1 = decodeURIComponent(coll[1]);
        for (let s3 of decodeURIComponent(coll[2]).split(";")) {
            let s4 = s3.trim();
            let coll2 = (/^([^=]*)=(.*)/.exec(s4) || []);
            if (coll2[1] == null) {
                sectjs[s4] = "true";
            }
            else {
                sectjs[coll2[1]] = coll2[2];
            }
        }
        sectjs["body"] = coll[3];
        await expandInfo(sectjs);
        let b = sectjs["isvolatile"];
        if (b != null && b) {
            pubdata["isvolatile"] = true;
        }
        for (let fn of Object.keys(pubdata)) {
            if ( ! sectjs.hasOwnProperty(fn)) {
                sectjs[fn] = clone(pubdata[fn]);
            }
        }
        let expanded = "";
        let target = "main";
        let sectTempl = bodies[name1];
        if (sectTempl == null) {
            expanded = "<div>section definition missing: " + htmlQuote(name1) + "</div>";
        }
        else {
            target = targets[name1];
            let promos = sectjs["promo"];
            if (promos != null) {
                let accum = "";
                for (let promo of promos) {
                    let jsb = promo["promo"];
                    if (jsb == null) {
                        continue;
                    }
                    let replRes = fmt(promo, "<li class='promo-item'>\n    <strong>@promo.name@</strong> by @promo.username@, \n    <span class='promo-description'>@promo.description@</span>\n</li>");
                    if (orEmpty(jsb["link"]) != "") {
                        replRes = fmt(promo, "<li class='promo-item'>\n    <a href=\"@promo.link@\">@promo.name@</a> by @promo.username@,\n    <span class='promo-description'>@promo.description@</span>\n</li>");
                    }
                    accum = accum + replRes;
                }
                sectjs["body"] = orEmpty(sectjs["body"] + accum);
            }
            expanded = td.replaceFn(sectTempl, /@([a-zA-Z0-9_]+)@/g, (elt1: string[]) => {
                let result1: string;
                let key = elt1[1];
                result1 = orEmpty(sectjs[key]);
                if ( ! /^(body)$/.test(key)) {
                    result1 = htmlQuote(result1);
                }
                return result1;
            });
        }
        sinks[target] = orEmpty(sinks[target]) + expanded;
    }
    td.jsonCopyFrom(pubdata, clone(sinks));
    let expanded1 = td.replaceFn(templ, /@([a-zA-Z0-9_]+)@/g, (elt2: string[]) => {
        let result2: string;
        let key1 = elt2[1];
        result2 = orEmpty(pubdata[key1]);
        return result2;
    });
    return expanded1;
}

function orEmpty(s: string) : string
{
    let r: string;
    if (s == null) {
        r = "";
    }
    else {
        r = s;
    }
    return r;
}

function htmlQuote(tdUsername: string) : string
{
    let _new: string;
    _new = td.replaceAll(td.replaceAll(td.replaceAll(td.replaceAll(td.replaceAll(tdUsername, "&", "&amp;"), "<", "&lt;"), ">", "&gt;"), "\"", "&quot;"), "'", "&#39;");
    return _new;
}

export function init(expandInfo:td.Action1<JsonBuilder>) : void
{
    expandInfo = expandInfo;
}

/**
 * {language:html:html}
 */
function fmt(promo: JsonBuilder, html: string) : string
{
    let replRes = td.replaceFn(html, /@([a-zA-Z0-9_\.]+)@/g, (elt: string[]) => {
        let result: string;
        let jsb = promo;
        for (let fldName of elt[1].split(".")) {
            if (jsb == null) {
                break;
            }
            jsb = jsb[fldName];
        }
        if (jsb == null) {
            result = "";
        }
        else {
            result = htmlQuote(orEmpty(td.toString(jsb)));
        }
        return result;
    });
    return replRes;
}

function twoDigit(p: number) : string
{
    let s2 = "00" + p;
    return s2.substr(s2.length - 2, 2);
}

function humanTime(p: Date) : string
{
    return p.getFullYear() + "-" + twoDigit(p.getMonth() + 1) + "-" + twoDigit(p.getDate()) + 
        " " + twoDigit(p.getHours()) + ":" + twoDigit(p.getMinutes());
}


