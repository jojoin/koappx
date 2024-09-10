/*
* viewer
*/
const fs = require('fs')
const path = require('path')

const less = require('less')
const csso = require('csso')
const UglifyJS = require("uglify-js")
const htmlMinify = require('html-minifier')
const htmlMinifyOptions = {
    continueOnParseError: true,
    includeAutoGeneratedTags: true,
    removeAttributeQuotes: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    useShortDoctype: true,
    collapseWhitespace: true
}


 const extend = require('extend')

 const toolfs = require('./tool/fs')
 const tooltppl = require('./tool/tppl')
 const tooltype = require('./tool/type')

 // data
const allViews = {}



async function readComponentFiles(componentdir, names, ext){
    let files = names.map(function(x){
        let nks = x.split('/')
        let filename = nks.length>0 ? nks[nks.length-1] : x
        return `${componentdir}/${x}/${filename}.${ext}`
    })
    // console.log(files)
    return toolfs.readsSync(files, {ignore: true, merge: true})
}


async function compileJsCssTpl(cnf, staticdir, componentdir, vname, view){
    let jscon = await readComponentFiles(componentdir, view.components, 'js')
    if(false == cnf.debug) {
        jscon = UglifyJS.minify(jscon).code
    }
    fs.writeFileSync(`${staticdir}/jscss/${vname}.js`, jscon)
    let lesscon = await readComponentFiles(componentdir, view.components, 'less')
    let csscon = await less.render(lesscon, {rewriteUrls: 'off'})
    // console.log(csscon)
    if(false == cnf.debug) {
        // csscon.css.toString()
        csscon = csso.minify(csscon.css.toString())
        // console.log(csscon)
    }
    // console.log(csscon)
    fs.writeFileSync(`${staticdir}/jscss/${vname}.css`, csscon.css)
    let htmlcon = await readComponentFiles(componentdir, view.components, 'html')
    // console.log(htmlcon)
    if(false == cnf.debug) {
        // console.log(htmlcon)
        htmlcon = htmlMinify.minify(htmlcon, htmlMinifyOptions)
        // console.log(htmlcon)
    }
    return htmlcon
}

async function compileOneView(paths, cnf, key, filename){
    let view = require(filename)
    if( ! tooltype.isArray(view.components) ){
        console.log(`[Error] cannot find components setting in viewer '${key}'.`)
        return
    }
    if( ! tooltype.isFunction(view.datas) ){
        console.log(`[Error] cannot find datas setting in viewer '${key}'.`)
        return
    }
    // compile
    fs.mkdirSync(paths.static+'/jscss', {recursive: true})
    let viewcon =  await compileJsCssTpl(cnf, paths.static, paths.app+'/component', key, view)
    // console.log(viewcon)
    // load
    return {
        "datas": view.datas,
        "tmplfunc": tooltppl(viewcon),
    }
}

/*
* load all page 
*/
exports.load = async function(paths, cnf, app) {
    let viewerdir = paths.app + '/viewer'
    if( ! fs.statSync(viewerdir, {throwIfNoEntry: false})) {
        console.log(`[Note] cannot find viewer dir '${viewerdir}'.`)
        return
    }
    // scan
    var doscviews = async function(bsp, sco) {
        if(bsp && bsp.indexOf('_')===0){
            return
        }
        for(let i in sco.files){
            let one = sco.files[i]
            let key = path.basename(one).replace('.js', '')
            if(key.indexOf('_')===0){
                continue
            }
            if(bsp){
                key = bsp + '_' + key
            }
            // console.log(key)
            allViews[key] = await compileOneView(paths, cnf, key, one)
        }
    }
    
    // do scan view
    let sco = toolfs.scanSync(viewerdir)
    await doscviews(null, sco)
    // screen child dir
    for(let i in sco.folders){
        let dir = sco.folders[i]
        , bsp = path.basename(dir);
        let sco2 = toolfs.scanSync(dir)
        await doscviews(bsp, sco2)
    }
 }

/*
* render one page
*/
exports.render = async function(name, paths, cnf, ctx, next) {

    var key = name.replace('/', '_')
    let view = allViews[key]
    if( ! view){
        throw `[Error] cannot find viewer <${name}> in 'app/viewer/*' path settings.`
    }
    // if debug 
    if(cnf.debug) {
        // refresh
        let fname = `${paths.app}/viewer/${name}.js`
        view = await compileOneView(paths, cnf, key, fname)
    }
    // data
    let lang = ctx.lang.data
    lang.useset = ctx.lang.use
    let pagadata = {
        config: cnf,
        title: "koappx page",
        page: {
            name: name,
            key: key,
            version: cnf.page_version||0,
        },
        lang: lang, // lang use & data
        theme: ctx.theme,
        ctx: ctx,
    }
    // console.log(lang)
    let data = await view.datas(cnf, ctx)    
    // console.log(ctx.res, ctx.status)
    if(ctx.status>=301 && ctx.status<=302){
        // redirect or other
        ctx.body = `View <${name}> Status Code = ${ctx.status}`
        return
    }
    pagadata = Object.assign(pagadata, data)
    // tmpl
    // console.log("call viewer.render() name:", name)
    let body = ""
    try {
        body = view.tmplfunc(pagadata)
        // console.log(pagadata, body, view.tmplfunc)
    } catch (e) {
        console.log(`Viewer <${name}> Tmpl Error:`, e)
        body = e.toString()
    }
    // console.log(ctx.status)
    ctx.body = body
    //ok
}




